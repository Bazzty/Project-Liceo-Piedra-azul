import type { Pictograma } from '@/types';

/**
 * Color de la franja de cada pictograma según su categoría: así el niño agrupa las palabras sin leer
 * (personas, cosas que hago, cómo me siento…). No hay pestañas: todas las palabras están en un solo tablero.
 */
const FRANJA: Record<Pictograma['categoria'], string> = {
  basicas: 'bg-btnAprender-bg',
  necesidades: 'bg-statusDanger',
  emociones: 'bg-btnColores-bg',
  personas: 'bg-btnLogros-bg',
  acciones: 'bg-btnHablar-bg',
  objetos: 'bg-btnAprender-bg',
};

export const franjaDe = (categoria: Pictograma['categoria']): string => FRANJA[categoria];

/** Las palabras que más se usan van primero, en este orden; el resto sigue por categoría. */
const PRIMERAS = ['pic-yo', 'pic-quiero', 'pic-mas', 'pic-si', 'pic-no', 'pic-terminado', 'pic-gracias', 'pic-ayuda'];
const ORDEN_CATEGORIAS: Pictograma['categoria'][] = ['necesidades', 'emociones', 'personas', 'acciones', 'objetos', 'basicas'];

/** Ordena el tablero: primero las palabras esenciales y luego las demás agrupadas por categoría. */
export const ordenarTablero = (pictogramas: Pictograma[]): Pictograma[] => {
  const posicion = (p: Pictograma) => {
    const i = PRIMERAS.indexOf(p.id ?? '');
    return i >= 0 ? i : PRIMERAS.length + ORDEN_CATEGORIAS.indexOf(p.categoria);
  };
  return [...pictogramas].sort((a, b) => posicion(a) - posicion(b) || a.palabra.localeCompare(b.palabra, 'es'));
};
