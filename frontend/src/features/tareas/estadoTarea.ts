import type { Registro } from '@/types';
import type { Asignacion } from '@/features/tareas/useAsignacionesStore';

export type EstadoTarea = 'hecha' | 'pendiente' | 'vencida';

/** Ids de los niños a quienes va dirigida la tarea. */
export const destinatarios = (a: Asignacion, todosLosIds: string[]): string[] => (a.alumnos === 'todos' ? todosLosIds : a.alumnos);

export const esParaAlumno = (a: Asignacion, alumnoId: string): boolean => a.alumnos === 'todos' || a.alumnos.includes(alumnoId);

const hoyCorto = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** La sesión de actividades con que el niño cumplió la tarea (la primera hecha desde que se asignó). */
export const resultadoDeTarea = (a: Asignacion, alumnoId: string, registros: Registro[]): Registro | undefined =>
  registros
    .filter((r) => r.alumnoId === alumnoId && r.tipo === 'actividad' && r.cuentoId === a.cuentoId && r.fecha >= a.creada)
    .sort((x, y) => x.fecha.localeCompare(y.fecha))[0];

export const estadoTarea = (a: Asignacion, alumnoId: string, registros: Registro[]): EstadoTarea => {
  if (resultadoDeTarea(a, alumnoId, registros)) return 'hecha';
  return a.limite && a.limite < hoyCorto() ? 'vencida' : 'pendiente';
};

/** "12/10" a partir de AAAA-MM-DD. */
export const formatearLimite = (limite: string): string => `${limite.slice(8, 10)}/${limite.slice(5, 7)}`;
