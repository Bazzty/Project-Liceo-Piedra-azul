import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { Progreso } from '@/types';

export const listarProgresos = () => db.progresos.toArray();
export const listarProgresosDeAlumno = (alumnoId: string) =>
  db.progresos.where('alumnoId').equals(alumnoId).toArray();
export const registrarProgreso = (progreso: Progreso) => db.progresos.add(progreso);

/** Cuentos distintos que el alumno completó (releer un cuento no suma otra estrella). */
export const contarCompletados = (progresos: Progreso[] | undefined) =>
  new Set((progresos ?? []).filter((p) => p.completado).map((p) => p.cuentoId)).size;

export const useProgresos = () => useLiveQuery(() => listarProgresos(), []);
export const useProgresosDeAlumno = (alumnoId?: string | null) =>
  useLiveQuery(async () => (alumnoId ? listarProgresosDeAlumno(alumnoId) : []), [alumnoId]);
