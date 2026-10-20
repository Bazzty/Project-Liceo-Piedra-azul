import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { Progreso } from '@/types';

export const listarProgresos = () => db.progresos.toArray();
export const listarProgresosDeAlumno = (alumnoId: string) =>
  db.progresos.where('alumnoId').equals(alumnoId).toArray();
export const registrarProgreso = (progreso: Progreso) => db.progresos.add(progreso);

export const useProgresos = () => useLiveQuery(() => listarProgresos(), []);
export const useProgresosDeAlumno = (alumnoId?: string | null) =>
  useLiveQuery(async () => (alumnoId ? listarProgresosDeAlumno(alumnoId) : []), [alumnoId]);
