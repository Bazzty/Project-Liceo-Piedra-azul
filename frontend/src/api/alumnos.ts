import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { Alumno } from '@/types';

// --- Acceso a datos (hoy: IndexedDB; mañana: HTTP al backend) ---
export const listarAlumnos = () => db.alumnos.toArray();
export const obtenerAlumno = (id: string) => db.alumnos.get(id);
export const actualizarAlumno = (id: string, cambios: Partial<Alumno>) => db.alumnos.update(id, cambios);

// --- Hooks para los componentes ---
export const useAlumnos = () => useLiveQuery(() => listarAlumnos(), []);
export const useAlumno = (id?: string | null) =>
  useLiveQuery(async () => (id ? obtenerAlumno(id) : undefined), [id]);
