import { useMemo } from 'react';
import type { Registro } from '@/types';
import { useAlumno, useCuentos, useProgresosDeAlumno, useRegistrosDeAlumno } from '@/api';
import { NIVELES_CAMINO } from '@/shared/config/niveles';
import { esDeLosUltimosDias } from '@/features/docente/components/format';
import { evolucionDe, palabrasDificiles, promedioReciente, resultadosDeRegistros, type ResultadoActividad } from '@/features/docente/components/resultados';
import { esParaAlumno, estadoTarea, resultadoDeTarea, type EstadoTarea } from '@/features/tareas/estadoTarea';
import { useAsignacionesStore, type Asignacion } from '@/features/tareas/useAsignacionesStore';

export interface ProgresoNivel {
  id: string;
  etiqueta: string;
  total: number;
  hechos: number;
  porcentaje: number;
}

const NIVELES = NIVELES_CAMINO.map((n) => ({ id: n.id, etiqueta: `Nivel ${n.letra} · ${n.nombre}` }));

export interface TareaDeAlumno {
  asignacion: Asignacion;
  titulo: string;
  estado: EstadoTarea;
  /** % sin ayuda con que la hizo, si ya la hizo. */
  porcentaje: number | null;
}

const claveDia = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

/** Datos de la ficha de un estudiante: progreso por nivel, actividad por día y sesiones recientes (en vivo). */
export function useFichaAlumno(alumnoId: string) {
  const alumno = useAlumno(alumnoId);
  const cuentos = useCuentos();
  const progresos = useProgresosDeAlumno(alumnoId);
  const registros = useRegistrosDeAlumno(alumnoId);
  const asignaciones = useAsignacionesStore((s) => s.asignaciones);

  return useMemo(() => {
    if (!alumno || !cuentos || !progresos || !registros) return null;

    const completados = new Set(progresos.filter((p) => p.completado).map((p) => p.cuentoId));
    const publicados = cuentos.filter((c) => c.estado === 'publicado');

    const niveles: ProgresoNivel[] = NIVELES.map((n) => {
      const delNivel = publicados.filter((c) => c.nivelId === n.id);
      const hechos = delNivel.filter((c) => c.id && completados.has(c.id)).length;
      return {
        ...n,
        total: delNivel.length,
        hechos,
        porcentaje: delNivel.length ? Math.round((hechos / delNivel.length) * 100) : 0,
      };
    });

    const hoy = new Date();
    const fechas = [...registros.filter((r) => r.tipo !== 'calma').map((r) => r.fecha), ...progresos.map((p) => p.fechaUltimoAcceso)];
    const actividadPorDia = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() - (6 - i));
      const corto = d.toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', '');
      return {
        etiqueta: corto.charAt(0).toUpperCase() + corto.slice(1),
        valor: fechas.filter((f) => claveDia(new Date(f)) === claveDia(d)).length,
      };
    });

    const resultados: ResultadoActividad[] = resultadosDeRegistros(registros, cuentos);
    const tareas: TareaDeAlumno[] = asignaciones
      .filter((a) => esParaAlumno(a, alumnoId))
      .map((a) => {
        const hecha = resultadoDeTarea(a, alumnoId, registros);
        const total = hecha?.total ?? 0;
        return {
          asignacion: a,
          titulo: cuentos.find((c) => c.id === a.cuentoId)?.titulo ?? 'Cuento',
          estado: estadoTarea(a, alumnoId, registros),
          porcentaje: hecha && total > 0 ? Math.round(((hecha.aciertos ?? 0) / total) * 100) : null,
        };
      })
      .sort((a, b) => b.asignacion.creada.localeCompare(a.asignacion.creada));

    const recientes: Registro[] = [...registros].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 6);

    return {
      alumno,
      niveles,
      actividadPorDia,
      recientes,
      resultados,
      evolucion: evolucionDe(resultados),
      palabrasDificiles: palabrasDificiles(resultados),
      sinAyuda: promedioReciente(resultados),
      tareas,
      cuentosCompletados: completados.size,
      cuentosPublicados: publicados.length,
      palabrasEscuchadas: registros.reduce((t, r) => t + (r.palabrasEscuchadas ?? 0), 0),
      calmaSemana: registros.filter((r) => r.tipo === 'calma' && esDeLosUltimosDias(r.fecha, 7)).length,
      sesionesSemana: registros.filter((r) => r.tipo === 'sesion' && esDeLosUltimosDias(r.fecha, 7)).length,
      ultimoAcceso: [...fechas].sort((a, b) => b.localeCompare(a))[0] ?? null,
    };
  }, [alumno, alumnoId, cuentos, progresos, registros, asignaciones]);
}
