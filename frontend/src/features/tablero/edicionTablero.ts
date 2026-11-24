import type { CeldaTablero, Tablero } from '@/types';

/**
 * Un tablero principal y las carpetas que abre (un solo nivel). Es la unidad que la docente edita, copia y
 * asigna. Todas las operaciones de este archivo son puras: reciben un conjunto y devuelven otro, sin tocar el original.
 */
export interface Conjunto {
  principal: Tablero;
  carpetas: Tablero[];
}

export const nuevoId = (prefijo: string): string => {
  const azar = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `${prefijo}-${azar}`;
};

export const tablerosDelConjunto = (c: Conjunto): Tablero[] => [c.principal, ...c.carpetas];
export const idsDelConjunto = (c: Conjunto): string[] => tablerosDelConjunto(c).map((t) => t.id);

/** El tablero principal más las carpetas a las que apuntan sus celdas, en el orden de sus celdas. */
export function armarConjunto(principal: Tablero, todos: Tablero[]): Conjunto {
  const porId = new Map(todos.map((t) => [t.id, t]));
  const vistas = new Set<string>();
  const carpetas: Tablero[] = [];
  for (const celda of principal.celdas) {
    const destino = celda.tipo === 'carpeta' && celda.destinoTableroId ? porId.get(celda.destinoTableroId) : undefined;
    if (destino && destino.id !== principal.id && !vistas.has(destino.id)) {
      vistas.add(destino.id);
      carpetas.push(destino);
    }
  }
  return { principal, carpetas };
}

interface OpcionesDeCopia {
  /** Nombre del tablero principal de la copia (por defecto, el del original). */
  nombre?: string;
  /** `true` para una plantilla; `false` para la copia de un niño. */
  esPlantilla: boolean;
  alumnoId?: string;
  /** Id de cada tablero de la copia a partir del id del original. */
  idDe: (idOrigen: string) => string;
}

/** Copia el conjunto completo: tableros nuevos cuyas carpetas apuntan a las copias, no a los originales. */
export function duplicarConjunto(origen: Conjunto, opciones: OpcionesDeCopia): Conjunto {
  const copiar = (t: Tablero): Tablero => ({
    id: opciones.idDe(t.id),
    nombre: t.principal && opciones.nombre ? opciones.nombre : t.nombre,
    esPlantilla: opciones.esPlantilla,
    ...(opciones.alumnoId ? { alumnoId: opciones.alumnoId } : {}),
    copiadoDe: t.id,
    principal: t.principal,
    ...(t.volverAlElegir === undefined ? {} : { volverAlElegir: t.volverAlElegir }),
    celdas: t.celdas.map((c) => ({ ...c, ...(c.destinoTableroId ? { destinoTableroId: opciones.idDe(c.destinoTableroId) } : {}) })),
  });
  return { principal: copiar(origen.principal), carpetas: origen.carpetas.map(copiar) };
}

const enTablero = (c: Conjunto, tableroId: string, cambiar: (t: Tablero) => Tablero): Conjunto =>
  c.principal.id === tableroId
    ? { ...c, principal: cambiar(c.principal) }
    : { ...c, carpetas: c.carpetas.map((t) => (t.id === tableroId ? cambiar(t) : t)) };

const buscar = (c: Conjunto, tableroId: string) => tablerosDelConjunto(c).find((t) => t.id === tableroId);
const acotar = (indice: number | undefined, largo: number) => (indice === undefined ? largo : Math.max(0, Math.min(indice, largo)));
const insertar = (celdas: CeldaTablero[], celda: CeldaTablero, indice?: number) => {
  const i = acotar(indice, celdas.length);
  return [...celdas.slice(0, i), celda, ...celdas.slice(i)];
};

/** Una celda de palabra nueva, con su id. */
export const nuevaCeldaPalabra = (datos: { pictogramaId: string; textoMostrado: string; categoriaId: string; textoHablado?: string; esNucleo?: boolean }): CeldaTablero => ({
  id: nuevoId('celda'),
  tipo: 'palabra',
  pictogramaId: datos.pictogramaId,
  textoMostrado: datos.textoMostrado,
  categoriaId: datos.categoriaId,
  ...(datos.textoHablado ? { textoHablado: datos.textoHablado } : {}),
  ...(datos.esNucleo ? { esNucleo: true } : {}),
});

/** Agrega una palabra. Las carpetas se crean con `agregarCarpeta`; las palabras núcleo solo van en el principal. */
export function agregarCelda(c: Conjunto, tableroId: string, celda: CeldaTablero, indice?: number): Conjunto {
  if (celda.tipo === 'carpeta') throw new Error('Las carpetas se agregan con agregarCarpeta');
  if (!buscar(c, tableroId)) throw new Error(`No existe el tablero ${tableroId}`);
  const sinNucleo = tableroId === c.principal.id ? celda : { ...celda, esNucleo: undefined };
  return enTablero(c, tableroId, (t) => ({ ...t, celdas: insertar(t.celdas, limpiar(sinNucleo), indice) }));
}

/** Quita las claves sin valor: lo guardado queda sin `undefined`. */
const limpiar = (celda: CeldaTablero): CeldaTablero => Object.fromEntries(Object.entries(celda).filter(([, v]) => v !== undefined)) as unknown as CeldaTablero;

/** Crea una carpeta: su celda en el principal y su tablero (vacío) con el mismo nombre. */
export function agregarCarpeta(c: Conjunto, datos: { nombre: string; categoriaId: string; pictogramaId?: string }, indice?: number): Conjunto {
  const tableroId = nuevoId('tablero');
  const celda: CeldaTablero = {
    id: nuevoId('carpeta'),
    tipo: 'carpeta',
    ...(datos.pictogramaId ? { pictogramaId: datos.pictogramaId } : {}),
    textoMostrado: datos.nombre,
    categoriaId: datos.categoriaId,
    destinoTableroId: tableroId,
  };
  const nueva: Tablero = { id: tableroId, nombre: datos.nombre, esPlantilla: c.principal.esPlantilla, principal: false, celdas: [], ...(c.principal.alumnoId ? { alumnoId: c.principal.alumnoId } : {}) };
  return { principal: { ...c.principal, celdas: insertar(c.principal.celdas, celda, indice) }, carpetas: [...c.carpetas, nueva] };
}

/** Quita una celda. Si es una carpeta, se quita también su tablero y todo lo que tenía dentro. */
export function quitarCelda(c: Conjunto, tableroId: string, celdaId: string): Conjunto {
  const celda = buscar(c, tableroId)?.celdas.find((x) => x.id === celdaId);
  if (!celda) return c;
  const sin = enTablero(c, tableroId, (t) => ({ ...t, celdas: t.celdas.filter((x) => x.id !== celdaId) }));
  return celda.tipo === 'carpeta' ? { ...sin, carpetas: sin.carpetas.filter((t) => t.id !== celda.destinoTableroId) } : sin;
}

type Cambios = Partial<Omit<CeldaTablero, 'id' | 'tipo' | 'destinoTableroId'>>;

/** Cambia datos de una celda. Si es una carpeta y cambia su nombre, el tablero que abre se renombra igual. */
export function actualizarCelda(c: Conjunto, tableroId: string, celdaId: string, cambios: Cambios): Conjunto {
  const actual = buscar(c, tableroId)?.celdas.find((x) => x.id === celdaId);
  if (!actual) return c;
  const aplicado = limpiar({ ...actual, ...cambios, ...(tableroId === c.principal.id ? {} : { esNucleo: undefined }) });
  const nuevo = enTablero(c, tableroId, (t) => ({ ...t, celdas: t.celdas.map((x) => (x.id === celdaId ? aplicado : x)) }));
  if (actual.tipo !== 'carpeta' || cambios.textoMostrado === undefined) return nuevo;
  return { ...nuevo, carpetas: nuevo.carpetas.map((t) => (t.id === actual.destinoTableroId ? { ...t, nombre: cambios.textoMostrado as string } : t)) };
}

/** Pone una celda en otra posición del mismo tablero. */
export function moverCelda(c: Conjunto, tableroId: string, celdaId: string, haciaIndice: number): Conjunto {
  const tablero = buscar(c, tableroId);
  const desde = tablero?.celdas.findIndex((x) => x.id === celdaId) ?? -1;
  if (!tablero || desde < 0) return c;
  const resto = tablero.celdas.filter((x) => x.id !== celdaId);
  const i = acotar(haciaIndice, resto.length);
  return enTablero(c, tableroId, (t) => ({ ...t, celdas: [...resto.slice(0, i), tablero.celdas[desde], ...resto.slice(i)] }));
}

/** Un lugar antes (−1) o después (+1): para quien no puede arrastrar. */
export function moverUno(c: Conjunto, tableroId: string, celdaId: string, paso: -1 | 1): Conjunto {
  const desde = buscar(c, tableroId)?.celdas.findIndex((x) => x.id === celdaId) ?? -1;
  return desde < 0 ? c : moverCelda(c, tableroId, celdaId, desde + paso);
}

/**
 * Mueve una celda un lugar entre las que se ven juntas (por ejemplo, las palabras de la grilla sin las núcleo ni las
 * carpetas). `visibles` son los ids de esas celdas en su orden. Respeta a las que no se ven: solo cambia de lugar con su vecina.
 */
export function moverRelativo(c: Conjunto, tableroId: string, celdaId: string, visibles: string[], paso: -1 | 1): Conjunto {
  const posicion = visibles.indexOf(celdaId);
  const vecina = visibles[posicion + paso];
  const celdas = buscar(c, tableroId)?.celdas ?? [];
  const destino = celdas.findIndex((x) => x.id === vecina);
  return posicion < 0 || !vecina || destino < 0 ? c : moverCelda(c, tableroId, celdaId, destino);
}

/** Pasa una palabra de un tablero a otro (por ejemplo, del principal a una carpeta). Las carpetas no se mueven a otra carpeta. */
export function pasarCelda(c: Conjunto, desdeId: string, celdaId: string, haciaId: string, indice?: number): Conjunto {
  const celda = buscar(c, desdeId)?.celdas.find((x) => x.id === celdaId);
  if (!celda || desdeId === haciaId || celda.tipo === 'carpeta' || !buscar(c, haciaId)) return c;
  return agregarCelda(quitarCelda(c, desdeId, celdaId), haciaId, celda, indice);
}

/** Cambia el nombre de un tablero; si es una carpeta, también el de su celda. */
export function renombrarTablero(c: Conjunto, tableroId: string, nombre: string): Conjunto {
  const nuevo = enTablero(c, tableroId, (t) => ({ ...t, nombre }));
  const celda = nuevo.principal.celdas.find((x) => x.tipo === 'carpeta' && x.destinoTableroId === tableroId);
  return celda ? actualizarCelda(nuevo, nuevo.principal.id, celda.id, { textoMostrado: nombre }) : nuevo;
}

/** Si al elegir una palabra dentro de una carpeta se vuelve sola al principal. */
export const ajustarVolverAlElegir = (c: Conjunto, valor: boolean): Conjunto => ({ ...c, principal: { ...c.principal, volverAlElegir: valor } });
