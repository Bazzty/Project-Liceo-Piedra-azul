import { useMemo } from 'react';
import type { Alumno, Cuento, Pictograma, Registro } from '@/types';
import { esDeLosUltimosDias, porcentajeAvance } from '@/features/docente/components/format';
import { useAlumnos, useCuentos, usePictogramas, useProgresos, useRegistros } from '@/api';

export interface FilaProgreso {
  cuento: Cuento;
  porcentaje: number;
}

export interface Resumen {
  alumnos: Alumno[];
  cuentosTerminados: number;
  cuentosPosibles: number;
  palabrasEscuchadas: number;
  sesionesSemana: number;
  masUsados: Pictograma[];
  progresoPorCuento: FilaProgreso[];
  registro: (Registro & { alumnoNombre: string })[];
  ultimaActividad: string | null;
}

/**
 * Calcula el resumen del panel docente a partir de IndexedDB (Dexie).
 * - Sin `alumnoId`: resumen de todo el curso.
 * - Con `alumnoId`: resumen individual de ese alumno.
 * Es reactivo: si cambia cualquier tabla, el panel se actualiza solo.
 * Devuelve `null` mientras carga.
 */
export function useResumen(alumnoId?: string): Resumen | null {
  const alumnos = useAlumnos();
  const cuentos = useCuentos();
  const progresos = useProgresos();
  const registros = useRegistros();
  const pictogramas = usePictogramas();

  return useMemo(() => {
    if (!alumnos || !cuentos || !progresos || !registros || !pictogramas) return null;

    const publicados = cuentos.filter((c) => c.estado === 'publicado');
    const idsPublicados = new Set(publicados.map((c) => c.id));
    const alumnosFiltrados = alumnoId ? alumnos.filter((a) => a.id === alumnoId) : alumnos;
    const idsAlumnos = new Set(alumnosFiltrados.map((a) => a.id));

    const progresosFiltrados = progresos.filter((p) => idsAlumnos.has(p.alumnoId));
    const registrosFiltrados = registros.filter((r) => idsAlumnos.has(r.alumnoId));

    const cuentosTerminados = progresosFiltrados.filter(
      (p) => p.completado && idsPublicados.has(p.cuentoId),
    ).length;
    const cuentosPosibles = publicados.length * alumnosFiltrados.length;

    const palabrasEscuchadas = registrosFiltrados.reduce((t, r) => t + (r.palabrasEscuchadas ?? 0), 0);
    const sesionesSemana = registrosFiltrados.filter(
      (r) => r.tipo === 'sesion' && esDeLosUltimosDias(r.fecha, 7),
    ).length;

    // Pictogramas más usados en el tablero (top 3)
    const conteo = new Map<string, number>();
    registrosFiltrados
      .filter((r) => r.tipo === 'tablero')
      .forEach((r) => r.pictogramaIds?.forEach((id) => conteo.set(id, (conteo.get(id) ?? 0) + 1)));
    const masUsados = [...conteo.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => pictogramas.find((p) => p.id === id))
      .filter((p): p is Pictograma => Boolean(p));

    // Progreso por cuento: promedio del curso o avance individual
    const progresoPorCuento: FilaProgreso[] = publicados.map((cuento) => {
      const porAlumno = alumnosFiltrados.map((a) =>
        porcentajeAvance(
          progresos.find((p) => p.alumnoId === a.id && p.cuentoId === cuento.id),
          cuento,
        ),
      );
      const promedio = porAlumno.length
        ? Math.round(porAlumno.reduce((t, n) => t + n, 0) / porAlumno.length)
        : 0;
      return { cuento, porcentaje: promedio };
    });

    const nombres = new Map(alumnos.map((a) => [a.id, a.nombre]));
    const registro = registrosFiltrados
      .filter((r) => r.tipo !== 'sesion')
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 6)
      .map((r) => ({ ...r, alumnoNombre: nombres.get(r.alumnoId) ?? 'Alumno' }));

    const ultimaActividad =
      registrosFiltrados.map((r) => r.fecha).sort((a, b) => b.localeCompare(a))[0] ?? null;

    return {
      alumnos: alumnosFiltrados,
      cuentosTerminados,
      cuentosPosibles,
      palabrasEscuchadas,
      sesionesSemana,
      masUsados,
      progresoPorCuento,
      registro,
      ultimaActividad,
    };
  }, [alumnos, cuentos, progresos, registros, pictogramas, alumnoId]);
}

export interface FilaAlumno {
  alumno: Alumno;
  terminados: number;
  posibles: number;
  ultimaActividad: string | null;
}

/** Una fila por alumno para la lista del panel docente (reactivo). */
export function useListaAlumnos(): FilaAlumno[] | null {
  const alumnos = useAlumnos();
  const cuentos = useCuentos();
  const progresos = useProgresos();
  const registros = useRegistros();

  return useMemo(() => {
    if (!alumnos || !cuentos || !progresos || !registros) return null;
    const publicados = new Set(cuentos.filter((c) => c.estado === 'publicado').map((c) => c.id));
    return alumnos.map((alumno) => ({
      alumno,
      terminados: progresos.filter(
        (p) => p.alumnoId === alumno.id && p.completado && publicados.has(p.cuentoId),
      ).length,
      posibles: publicados.size,
      ultimaActividad:
        registros
          .filter((r) => r.alumnoId === alumno.id)
          .map((r) => r.fecha)
          .sort((a, b) => b.localeCompare(a))[0] ?? null,
    }));
  }, [alumnos, cuentos, progresos, registros]);
}
