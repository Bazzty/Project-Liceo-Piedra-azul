import { db } from '../db/db';

const ARASAAC_API_BASE = 'https://api.arasaac.org/v1';
const ARASAAC_STATIC_BASE = 'https://static.arasaac.org/pictograms';

export const getArasaacImageUrl = (id: number | string): string => {
	return `${ARASAAC_STATIC_BASE}/${id}/${id}_500.png`;
};

export interface ArasaacKeyword {
	keyword: string;
	type: number;
	meaning?: string;
}

export interface ArasaacPictogramResponse {
	_id: number;
	keywords: ArasaacKeyword[];
}

export type ArasaacSearchResult = ArasaacPictogramResponse;

export interface ArasaacOpcion {
	id: number;
	url: string;
}

// Diccionario de excepciones para palabras que producen falsos positivos en ARASAAC
const EXCEPCIONES_ARASAAC: Record<string, number> = {
	dama: 2432, // ID exacto para Dama/Señora en ARASAAC (evita el resultado "damasco")
};

export const fetchArasaacPictogramId = async (palabra: string): Promise<number | null> => {
	try {
		const cleanWord = palabra.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
		if (!cleanWord) return null;

		// Retorno directo si la palabra está en las excepciones
		if (EXCEPCIONES_ARASAAC[cleanWord]) {
			return EXCEPCIONES_ARASAAC[cleanWord];
		}

		const response = await fetch(
			`${ARASAAC_API_BASE}/pictograms/es/search/${encodeURIComponent(cleanWord)}`
		);
		if (!response.ok) return null;

		const data: ArasaacPictogramResponse[] = await response.json();
		if (!Array.isArray(data) || data.length === 0) return null;

		// 1. Filtrar por coincidencia EXACTA en las palabras clave del pictograma
		const exactMatch = data.find((item) =>
			item.keywords?.some(
				(k) => k.keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === cleanWord
			)
		);
		if (exactMatch) {
			return exactMatch._id;
		}

		// 2. Si no hay coincidencia exacta, priorizar que la palabra clave comience con el texto
		const startsWithMatch = data.find((item) =>
			item.keywords?.some((k) =>
				k.keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').startsWith(cleanWord)
			)
		);

		return startsWithMatch ? startsWithMatch._id : data[0]._id;
	} catch (error) {
		console.error(`Error al consultar la API de ARASAAC para "${palabra}":`, error);
		return null;
	}
};

export const searchArasaacPictograms = async (
	palabra: string,
	maxResultados = 8
): Promise<ArasaacOpcion[]> => {
	try {
		const cleanWord = palabra.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
		if (!cleanWord) return [];

		const response = await fetch(
			`${ARASAAC_API_BASE}/pictograms/es/search/${encodeURIComponent(cleanWord)}`
		);
		if (!response.ok) return [];

		const data: ArasaacPictogramResponse[] = await response.json();
		if (!Array.isArray(data)) return [];

		return data.slice(0, maxResultados).map((item) => ({
			id: item._id,
			url: getArasaacImageUrl(item._id),
		}));
	} catch {
		return [];
	}
};

export async function buscarPictogramaArasaac(palabra: string): Promise<string | null> {
	const id = await fetchArasaacPictogramId(palabra);
	if (!id) return null;
	return getArasaacImageUrl(id);
}

// Caché en memoria para evitar llamadas duplicadas a la API sin contaminar db.pictogramas
const cachePictogramasMemoria: Record<string, string> = {};

export async function resolverYGuardarPictograma(palabra: string): Promise<string | null> {
	const cleanWord = palabra.toLowerCase().trim();
	if (!cleanWord) return null;

	// 1. Revisar caché local en memoria
	if (cachePictogramasMemoria[cleanWord]) {
		return cachePictogramasMemoria[cleanWord];
	}

	// 2. Revisar si la palabra pertenece al catálogo de comunicación SAAC
	const picExistente = await db.pictogramas.where('palabra').equalsIgnoreCase(cleanWord).first();
	if (picExistente?.imagenUrl) {
		cachePictogramasMemoria[cleanWord] = picExistente.imagenUrl;
		return picExistente.imagenUrl;
	}

	// 3. Consultar la API de ARASAAC y almacenar únicamente en caché de sesión
	const apiUrl = await buscarPictogramaArasaac(cleanWord);
	if (apiUrl) {
		cachePictogramasMemoria[cleanWord] = apiUrl;
		return apiUrl;
	}

	return null;
}