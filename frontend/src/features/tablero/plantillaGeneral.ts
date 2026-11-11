import type { CategoriaTablero, CeldaTablero, Pictograma, Tablero } from '@/types';

export const ID_PLANTILLA_GENERAL = 'plantilla-general';

/** Categorías que trae la app: mismos colores que tenía el tablero antes de ser editable. */
export const CATEGORIAS_INICIALES: CategoriaTablero[] = [
  { id: 'necesidades', nombre: 'Necesidades', color: 'alerta', orden: 1 },
  { id: 'emociones', nombre: 'Emociones', color: 'colores', orden: 2 },
  { id: 'personas', nombre: 'Personas', color: 'logros', orden: 3 },
  { id: 'acciones', nombre: 'Acciones', color: 'hablar', orden: 4 },
  { id: 'objetos', nombre: 'Objetos', color: 'aprender', orden: 5 },
  { id: 'basicas', nombre: 'Básicas', color: 'aprender', orden: 6 },
];

/** Palabras esenciales: van primero en el tablero principal y se quedan visibles en las carpetas. */
export const PALABRAS_NUCLEO = ['pic-yo', 'pic-quiero', 'pic-mas', 'pic-si', 'pic-no', 'pic-terminado', 'pic-gracias', 'pic-ayuda'];

/** Carpetas de la plantilla general, en este orden. */
const CARPETAS = ['necesidades', 'emociones', 'personas', 'acciones', 'objetos'];

export const idCarpetaGeneral = (categoriaId: string) => `${ID_PLANTILLA_GENERAL}-${categoriaId}`;

type ConId = Pictograma & { id: string };
const tieneId = (p: Pictograma): p is ConId => Boolean(p.id);
const porPalabra = (a: Pictograma, b: Pictograma) => a.palabra.localeCompare(b.palabra, 'es');

const celdaDePalabra = (pic: ConId, esNucleo: boolean): CeldaTablero => ({
  id: `celda-${pic.id}`,
  tipo: 'palabra',
  pictogramaId: pic.id,
  textoMostrado: pic.palabra,
  categoriaId: pic.categoria,
  ...(esNucleo ? { esNucleo: true } : {}),
});

/**
 * Arma la plantilla general con el catálogo de pictogramas: un tablero principal (palabras núcleo y una
 * carpeta por categoría) y un tablero por carpeta. Cada palabra queda en un solo lugar.
 */
export function construirPlantillaGeneral(catalogo: Pictograma[]): Tablero[] {
  const conId = catalogo.filter(tieneId);
  const nucleo = PALABRAS_NUCLEO.map((id) => conId.find((p) => p.id === id)).filter((p): p is ConId => Boolean(p));
  const esNucleo = new Set(nucleo.map((p) => p.id));
  const resto = conId.filter((p) => !esNucleo.has(p.id));

  const carpetas: Tablero[] = [];
  const celdasCarpeta: CeldaTablero[] = [];

  for (const categoriaId of CARPETAS) {
    const palabras = resto.filter((p) => p.categoria === categoriaId).sort(porPalabra).map((p) => celdaDePalabra(p, false));
    if (palabras.length === 0) continue;
    const nombre = CATEGORIAS_INICIALES.find((c) => c.id === categoriaId)?.nombre ?? categoriaId;
    carpetas.push({ id: idCarpetaGeneral(categoriaId), nombre, esPlantilla: true, principal: false, celdas: palabras });
    celdasCarpeta.push({
      id: `carpeta-${categoriaId}`,
      tipo: 'carpeta',
      textoMostrado: nombre,
      categoriaId,
      destinoTableroId: idCarpetaGeneral(categoriaId),
    });
  }

  // Lo que no es núcleo ni cae en una carpeta (p. ej. categoría «básicas») no se pierde: va suelto en el principal.
  const sueltas = resto.filter((p) => !CARPETAS.includes(p.categoria)).sort(porPalabra).map((p) => celdaDePalabra(p, false));

  const principal: Tablero = {
    id: ID_PLANTILLA_GENERAL,
    nombre: 'Plantilla general',
    esPlantilla: true,
    principal: true,
    celdas: [...nucleo.map((p) => celdaDePalabra(p, true)), ...sueltas, ...celdasCarpeta],
  };
  return [principal, ...carpetas];
}
