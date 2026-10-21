import { useMemo } from 'react';
import type { Registro } from '@/types';
import { useAlumno, useCuentos, useProgresosDeAlumno, useRegistrosDeAlumno } from '@/api';
import { esDeLosUltimosDias } from '@/features/docente/components/format';

export interface ProgresoNivel {
  id: string;
  etiqueta: string;
  total: number;
  hechos: number;
  porcentaje: number;
}

const NIVELES = [
  { id: 'nivel-a', etiqueta: 'Nivel A · Vocales y sílabas' },
  { id: 'nivel-b', etiqueta: 'Nivel B · Cuentos' },
  { id: 'nivel-c', etiqueta: 'Nivel C · Palabras' },
  { id: 'nivel-d', etiqueta: 'Nivel D · Historias' },
];

const claveDia = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

/** Datos de la ficha de un estudiante: progreso por nivel, actividad por día y sesiones recientes (en vivo). */
export function useFichaAlumno(alumnoId: string) {
  const alumno = useAlumno(alumnoId);
  const cuentos = useCuentos();
  const progresos = useProgresosDeAlumno(alumnoId);
  const registros = useRegistrosDeAlumno(alumnoId);

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
    const fechas = [...registros.map((r) => r.fecha), ...progresos.map((p) => p.fechaUltimoAcceso)];
    const actividadPorDia = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() - (6 - i));
      const corto = d.toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', '');
      return {
        etiqueta: corto.charAt(0).toUpperCase() + corto.slice(1),
        valor: fechas.filter((f) => claveDia(new Date(f)) === claveDia(d)).length,
      };
    });

    const recientes: Registro[] = [...registros].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 6);

    return {
      alumno,
      niveles,
      actividadPorDia,
      recientes,
      cuentosCompletados: completados.size,
      cuentosPublicados: publicados.length,
      palabrasEscuchadas: registros.reduce((t, r) => t + (r.palabrasEscuchadas ?? 0), 0),
      sesionesSemana: registros.filter((r) => r.tipo === 'sesion' && esDeLosUltimosDias(r.fecha, 7)).length,
      ultimoAcceso: [...fechas].sort((a, b) => b.localeCompare(a))[0] ?? null,
    };
  }, [alumno, cuentos, progresos, registros]);
}
