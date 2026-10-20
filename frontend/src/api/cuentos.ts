import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { Cuento } from '@/types';

export const listarCuentos = () => db.cuentos.toArray();
export const listarCuentosPorNivel = (nivelId: string) => db.cuentos.where('nivelId').equals(nivelId).toArray();
export const obtenerCuento = (id: string) => db.cuentos.get(id);
export const obtenerPrimerCuento = () => db.cuentos.toCollection().first();
export const crearCuento = (cuento: Cuento) => db.cuentos.add(cuento);
export const actualizarCuento = (id: string, cambios: Partial<Cuento>) => db.cuentos.update(id, cambios);

/** Elimina el cuento y el avance de los alumnos en él. */
export const eliminarCuento = (id: string) =>
  db.transaction('rw', db.cuentos, db.progresos, async () => {
    await db.cuentos.delete(id);
    await db.progresos.where('cuentoId').equals(id).delete();
  });

export const useCuentos = () => useLiveQuery(() => listarCuentos(), []);
export const useCuentosDeNivel = (nivelId: string) =>
  useLiveQuery(() => listarCuentosPorNivel(nivelId), [nivelId]);
/** Sin id devuelve el primer cuento (útil para vistas de demostración). */
export const useCuento = (id?: string | null) =>
  useLiveQuery(async () => (id ? obtenerCuento(id) : obtenerPrimerCuento()), [id]);
