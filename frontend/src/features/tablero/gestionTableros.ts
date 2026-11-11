import { borrarTablerosDeAlumno, guardarTableros, obtenerTablero, obtenerTableros, tablerosDeAlumno } from '@/api';
import {
  armarConjunto,
  duplicarConjunto,
  idsDelConjunto,
  nuevoId,
  tablerosDelConjunto,
  type Conjunto,
} from '@/features/tablero/edicionTablero';
import { ID_PLANTILLA_GENERAL } from '@/features/tablero/plantillaGeneral';
import type { Tablero } from '@/types';

/** Qué se está editando: una plantilla (la general u otra de la docente) o el tablero de un niño. */
export type Destino = { tipo: 'plantilla'; id: string } | { tipo: 'alumno'; alumnoId: string };

export interface ConjuntoEditable {
  conjunto: Conjunto;
  /** Solo en un niño: `true` si ya tiene copia propia guardada; `false` si sigue usando la plantilla general. */
  copiaPropia: boolean;
}

/** Id de cada tablero de la copia de un niño: fijo, para que la pantalla no pierda de vista nada cuando la copia se guarde. */
export const idDeCopia = (alumnoId: string, idOrigen: string) => `copia-${alumnoId}-${idOrigen}`;

async function conjuntoDePrincipal(principal: Tablero): Promise<Conjunto> {
  const ids = principal.celdas.flatMap((c) => (c.tipo === 'carpeta' && c.destinoTableroId ? [c.destinoTableroId] : []));
  return armarConjunto(principal, await obtenerTableros(ids));
}

/**
 * El conjunto que la docente va a editar. Un niño sin copia propia recibe una copia *virtual* de la plantilla
 * general (con los ids que tendrá al guardarse): no se escribe nada hasta su primer cambio.
 */
export async function cargarConjunto(destino: Destino): Promise<ConjuntoEditable | undefined> {
  if (destino.tipo === 'plantilla') {
    const principal = await obtenerTablero(destino.id);
    return principal ? { conjunto: await conjuntoDePrincipal(principal), copiaPropia: false } : undefined;
  }
  const propios = await tablerosDeAlumno(destino.alumnoId);
  const suyo = propios.find((t) => t.principal);
  if (suyo) return { conjunto: armarConjunto(suyo, propios), copiaPropia: true };

  const general = await obtenerTablero(ID_PLANTILLA_GENERAL);
  if (!general) return undefined;
  const copia = duplicarConjunto(await conjuntoDePrincipal(general), {
    esPlantilla: false,
    alumnoId: destino.alumnoId,
    idDe: (id) => idDeCopia(destino.alumnoId, id),
  });
  return { conjunto: copia, copiaPropia: false };
}

/** Guarda el resultado de una edición: escribe lo nuevo y borra los tableros que ya no están. */
export async function guardarCambio(antes: Conjunto, despues: Conjunto): Promise<void> {
  const siguen = new Set(idsDelConjunto(despues));
  await guardarTableros(tablerosDelConjunto(despues), idsDelConjunto(antes).filter((id) => !siguen.has(id)));
}

/** Crea una plantilla nueva copiando otra (por defecto, la general). Devuelve el id de su tablero principal. */
export async function crearPlantilla(nombre: string, desdeId: string = ID_PLANTILLA_GENERAL): Promise<string | undefined> {
  const origen = await obtenerTablero(desdeId);
  if (!origen) return undefined;
  const ids = new Map<string, string>();
  const copia = duplicarConjunto(await conjuntoDePrincipal(origen), {
    nombre: nombre.trim() || origen.nombre,
    esPlantilla: true,
    idDe: (id) => ids.get(id) ?? ids.set(id, nuevoId('tablero')).get(id) as string,
  });
  await guardarTableros(tablerosDelConjunto(copia));
  return copia.principal.id;
}

/** Elimina una plantilla con sus carpetas. La general no se puede eliminar. Los niños que la usan conservan su copia. */
export async function eliminarPlantilla(id: string): Promise<void> {
  if (id === ID_PLANTILLA_GENERAL) throw new Error('La plantilla general no se puede eliminar');
  const principal = await obtenerTablero(id);
  if (!principal?.esPlantilla) return;
  await guardarTableros([], idsDelConjunto(await conjuntoDePrincipal(principal)));
}

/** Vuelve a la plantilla general: se borra la copia propia del niño. */
export const restablecerAlumno = async (alumnoId: string): Promise<void> => {
  await borrarTablerosDeAlumno(alumnoId);
};

/** Le da al niño una copia de una plantilla, en lugar de lo que tenía. La general no se copia: solo se restablece. */
export async function asignarPlantilla(alumnoId: string, plantillaId: string): Promise<void> {
  if (plantillaId === ID_PLANTILLA_GENERAL) return restablecerAlumno(alumnoId);
  const origen = await obtenerTablero(plantillaId);
  if (!origen?.esPlantilla) return;
  const copia = duplicarConjunto(await conjuntoDePrincipal(origen), {
    esPlantilla: false,
    alumnoId,
    idDe: (id) => idDeCopia(alumnoId, id),
  });
  const anteriores = (await tablerosDeAlumno(alumnoId)).map((t) => t.id);
  await guardarTableros(tablerosDelConjunto(copia), anteriores.filter((id) => !idsDelConjunto(copia).includes(id)));
}

/** Deja la plantilla general como vino de fábrica. `fabrica` es lo que devuelve `construirPlantillaGeneral`. */
export async function restablecerPlantillaGeneral(fabrica: Tablero[]): Promise<void> {
  const actual = await obtenerTablero(ID_PLANTILLA_GENERAL);
  const anteriores = actual ? idsDelConjunto(await conjuntoDePrincipal(actual)) : [];
  const nuevos = new Set(fabrica.map((t) => t.id));
  await guardarTableros(fabrica, anteriores.filter((id) => !nuevos.has(id)));
}
