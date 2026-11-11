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
