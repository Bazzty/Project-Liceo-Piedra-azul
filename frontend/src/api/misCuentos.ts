import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { MiCuento } from '@/types';

export const crearMiCuento = (cuento: MiCuento) => db.misCuentos.add(cuento);

/** Los cuentos de un niño, el más nuevo primero. */
export const listarMisCuentos = async (alumnoId: string) =>
  (await db.misCuentos.where('alumnoId').equals(alumnoId).toArray()).sort((a, b) => b.fecha.localeCompare(a.fecha));

export const useMisCuentos = (alumnoId?: string | null) =>
  useLiveQuery(async () => (alumnoId ? listarMisCuentos(alumnoId) : []), [alumnoId]);

/** Un cuento, solo si es del niño que lo pide. */
export const useMiCuento = (alumnoId?: string | null, id?: number) =>
  useLiveQuery(async () => {
    const cuento = id === undefined || Number.isNaN(id) ? undefined : await db.misCuentos.get(id);
    return cuento && cuento.alumnoId === alumnoId ? cuento : null;
  }, [alumnoId, id]);
