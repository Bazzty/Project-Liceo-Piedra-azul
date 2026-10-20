import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { Nivel } from '@/types';

export const listarNiveles = () => db.niveles.orderBy('orden').toArray();
export const obtenerNivel = (id: string) => db.niveles.get(id);
export const crearNivel = (nivel: Nivel) => db.niveles.add(nivel);
export const actualizarNivel = (id: string, cambios: Partial<Nivel>) => db.niveles.update(id, cambios);

/** Elimina el nivel junto con sus cuentos y el avance asociado. */
export const eliminarNivel = (id: string, cuentoIds: string[]) =>
  db.transaction('rw', db.niveles, db.cuentos, db.progresos, async () => {
    await db.progresos.where('cuentoId').anyOf(cuentoIds).delete();
    await db.cuentos.bulkDelete(cuentoIds);
    await db.niveles.delete(id);
  });

export const useNiveles = () => useLiveQuery(() => listarNiveles(), []);
export const useNivel = (id: string) => useLiveQuery(() => obtenerNivel(id), [id]);
