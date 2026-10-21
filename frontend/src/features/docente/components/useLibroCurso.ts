import { useMemo } from 'react';
import type { Alumno } from '@/types';
import { useAlumnos, useCuentos, useProgresos, useRegistros } from '@/api';
import { esDeLosUltimosDias } from '@/features/docente/components/format';
import { palabrasDificiles, promedioReciente, resultadosDeRegistros } from '@/features/docente/components/resultados';
import { UMBRALES } from '@/features/docente/components/umbrales';
import { esParaAlumno, estadoTarea } from '@/features/tareas/estadoTarea';
import { useAsignacionesStore } from '@/features/tareas/useAsignacionesStore';

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
  /** % de juegos sin ayuda en sus últimas sesiones (null si aún no juega). */
  sinAyuda: number | null;
  /** Palabras que más le cuestan. */
  palabrasDificiles: string[];
  tareasVencidas: number;
  /** Razones por las que conviene apoyarlo, de la más grave a la menos (vacío si va al día). */
  motivos: string[];
}

export interface NotaDelDia {
  alumnoId?: string;
  estado: EstadoAlumno;
  titulo: string;
  consejo: string;
  motivos: string[];
  /** Palabras para reforzar con una tarea. */
  refuerzo: string[];
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
  const asignaciones = useAsignacionesStore((s) => s.asignaciones);

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
      if (diasSinActividad === null || diasSinActividad >= UMBRALES.diasSinEntrar) estado = 'sin_actividad';
      else if (diasActivos <= UMBRALES.diasActivosMinimos) estado = 'atencion';

      // Cómo le va en los juegos y si dejó tareas sin hacer
      const delAlumno = registros.filter((r) => r.alumnoId === alumno.id);
      const resultados = resultadosDeRegistros(delAlumno, cuentos);
      const sinAyuda = promedioReciente(resultados);
      const dificiles = palabrasDificiles(resultados, 3).map((d) => d.palabra);
      const tareasVencidas = asignaciones.filter(
        (a) => alumno.id && esParaAlumno(a, alumno.id) && estadoTarea(a, alumno.id, registros) === 'vencida',
      ).length;
      const lecturaBaja = sinAyuda !== null && sinAyuda < UMBRALES.porcentajeSinAyudaBajo;

      const motivos: string[] = [];
      if (estado === 'sin_actividad') motivos.push(diasSinActividad === null ? 'aún no ha entrado' : `${diasSinActividad} días sin entrar`);
      else if (estado === 'atencion') motivos.push(diasActivos === 0 ? 'sin sesiones esta semana' : `solo ${diasActivos} día con actividad esta semana`);
      if (lecturaBaja) motivos.push(`le cuestan los juegos (${sinAyuda} % sin ayuda)`);
      if (tareasVencidas > 0) motivos.push(`${tareasVencidas} ${tareasVencidas === 1 ? 'tarea vencida' : 'tareas vencidas'}`);
      if (estado === 'al_dia' && motivos.length > 0) estado = 'atencion';

      return {
        alumno,
        nivel: [...completados].some((id) => nivelB.has(id)) ? 'B' : 'A',
        semana,
        cuentos: completados.size,
        ultimoAcceso,
        diasSinActividad,
        estado,
        sinAyuda,
        palabrasDificiles: dificiles,
        tareasVencidas,
        motivos,
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
    const CONSEJOS: Record<EstadoAlumno, string> = {
      sin_actividad: 'Revisa si tiene su tarjeta o conversa con su familia.',
      atencion: 'Acompaña su sesión en el laboratorio para retomar el ritmo.',
      al_dia: '',
    };
    const notas: NotaDelDia[] = filas
      .filter((f) => f.motivos.length > 0)
      .sort((a, b) => gravedad[a.estado] - gravedad[b.estado] || b.motivos.length - a.motivos.length || (b.diasSinActividad ?? 99) - (a.diasSinActividad ?? 99))
      .slice(0, 4)
      .map((f) => {
        const apoyoEnJuegos = f.sinAyuda !== null && f.sinAyuda < UMBRALES.porcentajeSinAyudaBajo;
        return {
          alumnoId: f.alumno.id,
          estado: f.estado,
          titulo: `${f.alumno.nombre} · ${f.motivos[0]}`,
          consejo: apoyoEnJuegos && f.palabrasDificiles.length > 0
            ? `Refuerza con una tarea: ${f.palabrasDificiles.join(', ')}.`
            : CONSEJOS[f.estado] || 'Revisa su ficha y deja una tarea de refuerzo.',
          motivos: f.motivos.slice(1),
          refuerzo: f.palabrasDificiles,
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
  }, [alumnos, cuentos, progresos, registros, asignaciones]);
}
