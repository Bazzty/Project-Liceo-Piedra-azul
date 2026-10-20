import { useMemo } from 'react';
import type { Alumno } from '@/types';
import { useAlumnos, useCuentos, useProgresos, useRegistros } from '@/api';
import { esDeLosUltimosDias } from '@/features/docente/components/format';

export type EstadoAlumno = 'al_dia' | 'atencion' | 'sin_actividad';

export interface FilaLibro {
  alumno: Alumno;
  nivel: 'A' | 'B';
  /** Un valor por día, de hace 6 días a hoy: ¿hubo actividad ese día? */
  semana: boolean[];
  cuentos: number;
  ultimoAcceso: string | null;
  diasSinActividad: number | null;
  estado: EstadoAlumno;
}

export interface NotaDelDia {
  alumnoId?: string;
  estado: EstadoAlumno;
  titulo: string;
  consejo: string;
}

export interface LibroCurso {
  filas: FilaLibro[];
  total: number;
  leyeronHoy: number;
  activosSemana: number;
  cuentosSemana: number;
  cuentosSemanaAnterior: number;
  sesionesSemana: number;
  palabrasEscuchadas: number;
  cuentosPorDia: { etiqueta: string; valor: number }[];
  notas: NotaDelDia[];
}

const claveDia = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

const DIA_MS = 86_400_000;
const inicioDelDia = (fecha: Date) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime();

const etiquetaDia = (fecha: Date) => {
  const corto = fecha.toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', '');
  return corto.charAt(0).toUpperCase() + corto.slice(1);
};

/**
 * Datos del "libro del curso": una fila por estudiante con sus últimos 7 días, indicadores de la semana
 * y las notas del día (a quién apoyar primero). Se calcula en vivo desde IndexedDB.
 */
export function useLibroCurso(): LibroCurso | null {
  const alumnos = useAlumnos();
  const cuentos = useCuentos();
  const progresos = useProgresos();
  const registros = useRegistros();

  return useMemo(() => {
    if (!alumnos || !cuentos || !progresos || !registros) return null;

    const hoy = new Date();
    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() - (6 - i));
      return d;
    });
    const nivelB = new Set(cuentos.filter((c) => c.nivelId === 'nivel-b').map((c) => c.id));

    const filas: FilaLibro[] = alumnos.map((alumno) => {
      const fechas = [
        ...registros.filter((r) => r.alumnoId === alumno.id).map((r) => r.fecha),
        ...progresos.filter((p) => p.alumnoId === alumno.id).map((p) => p.fechaUltimoAcceso),
      ];
      const conActividad = new Set(fechas.map((f) => claveDia(new Date(f))));
      const semana = dias.map((d) => conActividad.has(claveDia(d)));
      const ultimoAcceso = fechas.sort((a, b) => b.localeCompare(a))[0] ?? null;
      const diasSinActividad = ultimoAcceso
        ? Math.round((inicioDelDia(hoy) - inicioDelDia(new Date(ultimoAcceso))) / DIA_MS)
        : null;
      const completados = new Set(progresos.filter((p) => p.alumnoId === alumno.id && p.completado).map((p) => p.cuentoId));
      const diasActivos = semana.filter(Boolean).length;

      let estado: EstadoAlumno = 'al_dia';
      if (diasSinActividad === null || diasSinActividad >= 5) estado = 'sin_actividad';
      else if (diasActivos <= 1) estado = 'atencion';

      return {
        alumno,
        nivel: [...completados].some((id) => nivelB.has(id)) ? 'B' : 'A',
        semana,
        cuentos: completados.size,
        ultimoAcceso,
        diasSinActividad,
        estado,
      };
    });

    const completadosConFecha = progresos.filter((p) => p.completado);
    const cuentosPorDia = dias.map((d) => ({
      etiqueta: etiquetaDia(d),
      valor: completadosConFecha.filter((p) => claveDia(new Date(p.fechaUltimoAcceso)) === claveDia(d)).length,
    }));
    const cuentosSemana = completadosConFecha.filter((p) => esDeLosUltimosDias(p.fechaUltimoAcceso, 7)).length;
    const cuentosSemanaAnterior = completadosConFecha.filter(
      (p) => esDeLosUltimosDias(p.fechaUltimoAcceso, 14) && !esDeLosUltimosDias(p.fechaUltimoAcceso, 7),
    ).length;

    const gravedad: Record<EstadoAlumno, number> = { sin_actividad: 0, atencion: 1, al_dia: 2 };
    const notas: NotaDelDia[] = filas
      .filter((f) => f.estado !== 'al_dia')
      .sort((a, b) => gravedad[a.estado] - gravedad[b.estado] || (b.diasSinActividad ?? 99) - (a.diasSinActividad ?? 99))
      .slice(0, 3)
      .map((f) => {
        const nombre = f.alumno.nombre;
        const activos = f.semana.filter(Boolean).length;
        if (f.estado === 'sin_actividad') {
          return {
            alumnoId: f.alumno.id,
            estado: f.estado,
            titulo: f.diasSinActividad === null ? `${nombre} · aún no ha entrado` : `${nombre} · ${f.diasSinActividad} días sin entrar`,
            consejo: 'Revisa si tiene su tarjeta o conversa con su familia.',
          };
        }
        return {
          alumnoId: f.alumno.id,
          estado: f.estado,
          titulo: `${nombre} · ${activos === 0 ? 'sin sesiones' : `${activos} día con actividad`} esta semana`,
          consejo: 'Acompaña su sesión en el laboratorio para retomar el ritmo.',
        };
      });

    return {
      filas,
      total: filas.length,
      leyeronHoy: filas.filter((f) => f.semana[6]).length,
      activosSemana: filas.filter((f) => f.semana.some(Boolean)).length,
      cuentosSemana,
      cuentosSemanaAnterior,
      sesionesSemana: registros.filter((r) => r.tipo === 'sesion' && esDeLosUltimosDias(r.fecha, 7)).length,
      palabrasEscuchadas: registros.reduce((t, r) => t + (r.palabrasEscuchadas ?? 0), 0),
      cuentosPorDia,
      notas,
    };
  }, [alumnos, cuentos, progresos, registros]);
}
