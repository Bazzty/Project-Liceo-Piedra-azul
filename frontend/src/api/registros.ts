import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { Registro } from '@/types';

export const listarRegistros = () => db.registros.toArray();

export const useRegistros = () => useLiveQuery(() => listarRegistros(), []);

export const listarRegistrosDeAlumno = (alumnoId: string) => db.registros.where('alumnoId').equals(alumnoId).toArray();
export const crearRegistro = (registro: Registro) => db.registros.add(registro);

export const useRegistrosDeAlumno = (alumnoId?: string | null) =>
  useLiveQuery(async () => (alumnoId ? listarRegistrosDeAlumno(alumnoId) : []), [alumnoId]);
