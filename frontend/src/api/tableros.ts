import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { Tablero } from '@/types';

const ID_PLANTILLA_GENERAL = 'plantilla-general';

export const listarCategorias = () => db.categorias.orderBy('orden').toArray();
export const useCategorias = () => useLiveQuery(() => listarCategorias(), []);

export const obtenerTablero = (id: string) => db.tableros.get(id);

/**
 * Tablero de entrada de un niño: su copia propia si la docente ya lo editó; si no, la plantilla general
 * (así recibe las mejoras de la plantilla mientras no tenga cambios propios).
 */
export async function tableroPrincipalDe(alumnoId: string | null): Promise<Tablero | undefined> {
  if (alumnoId) {
    const propio = await db.tableros
      .where('alumnoId')
      .equals(alumnoId)
      .filter((t) => t.principal)
      .first();
    if (propio) return propio;
  }
  return db.tableros.get(ID_PLANTILLA_GENERAL);
}

/** El tablero de entrada de un niño y todos los que de él cuelgan (mismas copias o misma plantilla). */
export async function tablerosDe(alumnoId: string | null): Promise<{ principal: Tablero; todos: Tablero[] } | undefined> {
  const principal = await tableroPrincipalDe(alumnoId);
  if (!principal) return undefined;
  const todos = principal.alumnoId
    ? await db.tableros.where('alumnoId').equals(principal.alumnoId).toArray()
    : await db.tableros.filter((t) => t.esPlantilla).toArray();
  return { principal, todos };
}

export const useTablerosDe = (alumnoId: string | null) => useLiveQuery(() => tablerosDe(alumnoId), [alumnoId]);

// --- Edición (la docente cambia tableros) ---

/** Los tableros con esos ids; los que no existen se omiten. */
export async function obtenerTableros(ids: string[]): Promise<Tablero[]> {
  const encontrados = await db.tableros.bulkGet(ids);
  return encontrados.filter((t): t is Tablero => Boolean(t));
}

/** Todos los tableros de un niño: su principal y sus carpetas. */
export const tablerosDeAlumno = (alumnoId: string) => db.tableros.where('alumnoId').equals(alumnoId).toArray();

/** Guarda (crea o reemplaza) y borra tableros en una sola operación: o se hace todo o nada. */
export const guardarTableros = (guardar: Tablero[], borrar: string[] = []) =>
  db.transaction('rw', db.tableros, async () => {
    if (borrar.length > 0) await db.tableros.bulkDelete(borrar);
    if (guardar.length > 0) await db.tableros.bulkPut(guardar);
  });

/** Borra todo lo que un niño tenía guardado: vuelve a usar la plantilla general. */
export const borrarTablerosDeAlumno = (alumnoId: string) => db.tableros.where('alumnoId').equals(alumnoId).delete();

/** Los tableros de entrada de las plantillas (la general y las que creó la docente). */
export const listarPlantillas = () => db.tableros.filter((t) => t.esPlantilla && t.principal).toArray();
export const usePlantillas = () => useLiveQuery(() => listarPlantillas(), []);
