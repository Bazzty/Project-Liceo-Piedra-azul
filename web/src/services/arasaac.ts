import { db } from '../db/db';

const ARASAAC_API_BASE = 'https://api.arasaac.org/v1';
const ARASAAC_STATIC_BASE = 'https://static.arasaac.org/pictograms';

export interface ArasaacSearchResult {
	_id: number;
	keywords: { keyword: string; type: number }[];
}

/**
 * Consulta la API de ARASAAC buscando coincidencia exacta en palabras clave (keywords).
 */
export async function buscarPictogramaArasaac(palabra: string): Promise<string | null> {
	try {
		const cleanWord = palabra.toLowerCase().trim();
		const response = await fetch(
			`${ARASAAC_API_BASE}/pictograms/es/search/${encodeURIComponent(cleanWord)}`
		);

		if (!response.ok) return null;
		const data: ArasaacSearchResult[] = await response.json();
		if (!data || data.length === 0) return null;

		// Buscar coincidencia exacta dentro del arreglo de keywords
		const exactMatch = data.find((item) =>
			item.keywords.some((k) => k.keyword.toLowerCase().trim() === cleanWord)
		);
		const selectedId = exactMatch ? exactMatch._id : data[0]._id;
		return `${ARASAAC_STATIC_BASE}/${selectedId}/${selectedId}_500.png`;
	} catch (error) {
		console.warn(`Error al consultar API de ARASAAC para "${palabra}":`, error);
		return null;
	}
}

/**
 * Resuelve la URL del pictograma y guarda el resultado en Dexie.js si provino de la API.
 */
export async function resolverYGuardarPictograma(palabra: string): Promise<string | null> {
	const cleanWord = palabra.toLowerCase().trim();

	// 1. Verificar si ya fue guardado previamente en la DB local Dexie.js
	const picExistente = await db.pictogramas.where('palabra').equalsIgnoreCase(cleanWord).first();
	if (picExistente?.imagenUrl) {
		return picExistente.imagenUrl;
	}

	// 2. Si no existe en DB, consultar la API de ARASAAC
	const apiUrl = await buscarPictogramaArasaac(cleanWord);
	if (apiUrl) {
		// 3. Guardar en Dexie.js para uso offline futuro
		await db.pictogramas.add({
			palabra: cleanWord,
			categoria: 'objetos',
			imagenUrl: apiUrl,
			esFotoReal: false,
		});
		return apiUrl;
	}

	return null;
}