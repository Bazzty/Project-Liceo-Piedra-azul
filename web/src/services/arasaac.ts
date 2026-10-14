/**
 * Servicio Helper para resolver URLs y buscar IDs en la API de ARASAAC
 */
export const getArasaacImageUrl = (id: number | string): string => {
  return `https://static.arasaac.org/pictograms/${id}/${id}_500.png`;
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

export const fetchArasaacPictogramId = async (palabra: string): Promise<number | null> => {
  try {
    const cleanWord = palabra.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const response = await fetch(
      `https://api.arasaac.org/v1/pictograms/es/search/${encodeURIComponent(cleanWord)}`
    );
    if (!response.ok) return null;

    const data: ArasaacPictogramResponse[] = await response.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    // 1. Filtrar por coincidencia exacta en el arreglo de keywords de ARASAAC
    const exactMatch = data.find((item) =>
      item.keywords?.some((k) =>
        k.keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === cleanWord
      )
    );
    if (exactMatch) {
      return exactMatch._id;
    }

    // 2. Si no hay coincidencia exacta, tomar el primer resultado devuelto por la API
    return data[0]._id;
  } catch (error) {
    console.error(`Error al consultar la API de ARASAAC para "${palabra}":`, error);
    return null;
  }
};

export interface ArasaacOpcion {
  id: number;
  url: string;
}

/**
 * Busca varios pictogramas posibles para una palabra (para que el docente elija
 * el que mejor corresponda). Requiere internet; si falla devuelve una lista vacía.
 */
export const searchArasaacPictograms = async (
  palabra: string,
  maxResultados = 8,
): Promise<ArasaacOpcion[]> => {
  try {
    const cleanWord = palabra.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!cleanWord) return [];
    const response = await fetch(
      `https://api.arasaac.org/v1/pictograms/es/search/${encodeURIComponent(cleanWord)}`
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
