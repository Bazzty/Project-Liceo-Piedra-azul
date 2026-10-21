import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Tarea que la docente deja a todo el curso o a algunos niños: un cuento y sus actividades. */
export interface Asignacion {
  id: string;
  cuentoId: string;
  /** Ids de los niños, o 'todos' para todo el curso (incluye a quienes lleguen después). */
  alumnos: string[] | 'todos';
  /** ISO de cuando se asignó: solo cuenta lo que el niño haga desde ese momento. */
  creada: string;
  /** Fecha límite (AAAA-MM-DD), opcional. */
  limite?: string;
  nota?: string;
}

interface AsignacionesState {
  asignaciones: Asignacion[];
  asignar: (datos: Omit<Asignacion, 'id' | 'creada'>) => void;
  quitar: (id: string) => void;
}

const haceDias = (dias: number) => new Date(Date.now() - dias * 86_400_000);
const fechaCorta = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Tareas de ejemplo para la demostración (viven en el navegador; con backend serán un recurso de la API). */
const DEMO: Asignacion[] = [
  { id: 'tarea-demo-1', cuentoId: 'cuento-auto-ana', alumnos: 'todos', creada: haceDias(3).toISOString(), limite: fechaCorta(haceDias(-1)), nota: 'Leer el cuento y hacer los juegos' },
  { id: 'tarea-demo-2', cuentoId: 'palabras-familia', alumnos: ['estudiante-mateo', 'estudiante-benjamin'], creada: haceDias(0).toISOString(), limite: fechaCorta(haceDias(-4)) },
  { id: 'tarea-demo-3', cuentoId: 'vocal-a', alumnos: ['estudiante-valentina'], creada: haceDias(6).toISOString(), limite: fechaCorta(haceDias(2)), nota: 'Refuerzo de vocales' },
];

export const useAsignacionesStore = create<AsignacionesState>()(
  persist(
    (set) => ({
      asignaciones: DEMO,
      asignar: (datos) =>
        set((s) => ({
          asignaciones: [{ ...datos, id: `tarea-${crypto.randomUUID().slice(0, 8)}`, creada: new Date().toISOString() }, ...s.asignaciones],
        })),
      quitar: (id) => set((s) => ({ asignaciones: s.asignaciones.filter((a) => a.id !== id) })),
    }),
    { name: 'asignaciones-docente', version: 1 },
  ),
);
