import { useMemo } from 'react';
import { useCuentos, useRegistrosDeAlumno } from '@/api';
import { esParaAlumno, estadoTarea } from '@/features/tareas/estadoTarea';
import { useAsignacionesStore } from '@/features/tareas/useAsignacionesStore';

/** Cuentos que la docente le dejó de tarea a este niño y que todavía no hizo (los más antiguos primero). */
export function useTareasPendientes(alumnoId: string | null) {
  const asignaciones = useAsignacionesStore((s) => s.asignaciones);
  const registros = useRegistrosDeAlumno(alumnoId);
  const cuentos = useCuentos();

  return useMemo(() => {
    if (!alumnoId || !registros || !cuentos) return [];
    return asignaciones
      .filter((a) => esParaAlumno(a, alumnoId) && estadoTarea(a, alumnoId, registros) !== 'hecha')
      .sort((a, b) => a.creada.localeCompare(b.creada))
      .flatMap((a) => {
        const cuento = cuentos.find((c) => c.id === a.cuentoId && c.estado === 'publicado');
        return cuento ? [{ asignacion: a, cuento }] : [];
      });
  }, [alumnoId, asignaciones, registros, cuentos]);
}
