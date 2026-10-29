import { useMemo } from 'react';
import { useAlumnos, useCuentos, useProgresos, useRegistros } from '@/api';
import { palabrasDificiles, resultadosDeRegistros } from '@/features/docente/components/resultados';
import { useLibroCurso } from '@/features/docente/components/useLibroCurso';
import { UMBRALES } from '@/features/docente/components/umbrales';
import { estadoTarea } from '@/features/tareas/estadoTarea';
import { useAsignacionesStore, type Asignacion } from '@/features/tareas/useAsignacionesStore';
import { NIVELES_CAMINO } from '@/shared/config/niveles';
import type { Cuento } from '@/types';

export interface PropuestaPlan {
  id: string;
  tipo: 'avanzar' | 'refuerzo_curso' | 'refuerzo_alumno';
  cuento: Cuento;
  /** Todo el curso o los ids de los niños. */
  destino: 'todos' | string[];
  etiqueta: string;
  motivo: string;
}

/** Fracción del curso que debe haber leído un nivel para pasar al siguiente. */
const AVANCE_ESPERADO = 0.7;
/** Un cuento ya leído por más de esta fracción del curso no se propone para avanzar. */
const YA_LEIDO_POR_LA_MAYORIA = 0.5;

const palabrasDe = (c: Cuento) => new Set(c.paginas.flatMap((p) => p.palabras.map((w) => w.texto.toLowerCase())));

/** ¿Ya hay una tarea sin hacer que cubra esta propuesta? (para no sugerir lo mismo dos veces) */
const yaCubierto = (asignaciones: Asignacion[], cuentoId: string, destino: 'todos' | string[], todos: string[], registros: Parameters<typeof estadoTarea>[2]) =>
  asignaciones.some((a) => {
    if (a.cuentoId !== cuentoId) return false;
    const pendiente = (id: string) => (a.alumnos === 'todos' || a.alumnos.includes(id)) && estadoTarea(a, id, registros) !== 'hecha';
    // Para todo el curso solo cuenta otra tarea también para todo el curso; para un niño, cualquiera que lo incluya
    return destino === 'todos' ? a.alumnos === 'todos' && todos.some(pendiente) : destino.some(pendiente);
  });

/**
 * Plan sugerido para la semana, a partir de cómo va el curso: avanzar en el nivel donde está, reforzar las
 * palabras que más cuestan y apoyar a quienes más lo necesitan. Son sugerencias: la docente acepta o ajusta.
 */
export function usePlanSemanal(): PropuestaPlan[] | null {
  const alumnos = useAlumnos();
  const cuentos = useCuentos();
  const progresos = useProgresos();
  const registros = useRegistros();
  const libro = useLibroCurso();
  const asignaciones = useAsignacionesStore((s) => s.asignaciones);

  return useMemo(() => {
    if (!alumnos || !cuentos || !progresos || !registros || !libro) return null;
    const ids = alumnos.map((a) => a.id ?? '').filter(Boolean);
    const publicados = cuentos.filter((c) => c.estado === 'publicado' && c.id);
    const leidoPor = (cuentoId: string) => new Set(progresos.filter((p) => p.completado && p.cuentoId === cuentoId).map((p) => p.alumnoId)).size;
    const propuestas: PropuestaPlan[] = [];
    const usados = new Set<string>();
    const agregar = (p: Omit<PropuestaPlan, 'id'>) => {
      if (usados.has(p.cuento.id ?? '') || yaCubierto(asignaciones, p.cuento.id ?? '', p.destino, ids, registros)) return;
      usados.add(p.cuento.id ?? '');
      propuestas.push({ ...p, id: `plan-${propuestas.length}-${p.cuento.id}` });
    };

    // 1. Avanzar: el primer nivel que el curso aún no domina
    for (const nivel of NIVELES_CAMINO) {
      const delNivel = publicados.filter((c) => c.nivelId === nivel.id);
      if (delNivel.length === 0 || ids.length === 0) continue;
      const leidos = delNivel.reduce((t, c) => t + leidoPor(c.id ?? ''), 0);
      if (leidos / (delNivel.length * ids.length) >= AVANCE_ESPERADO) continue;
      const siguiente = delNivel.find((c) => leidoPor(c.id ?? '') / ids.length < YA_LEIDO_POR_LA_MAYORIA);
      if (siguiente) {
        agregar({
          tipo: 'avanzar',
          cuento: siguiente,
          destino: 'todos',
          etiqueta: `Avanzar en ${nivel.nombre}`,
          motivo: `Solo ${leidoPor(siguiente.id ?? '')} de ${ids.length} lo han leído.`,
        });
      }
      break;
    }

    // 2. Reforzar lo que más cuesta al curso
    const delCurso = palabrasDificiles(resultadosDeRegistros(registros, cuentos), 6).filter((p) => p.veces >= 2);
    if (delCurso.length > 0) {
      const mejor = publicados
        .map((c) => ({ c, coinciden: delCurso.filter((p) => palabrasDe(c).has(p.palabra.toLowerCase())).map((p) => p.palabra) }))
        .filter((x) => x.coinciden.length >= 1)
        .sort((a, b) => b.coinciden.length - a.coinciden.length)[0];
      if (mejor) {
        agregar({
          tipo: 'refuerzo_curso',
          cuento: mejor.c,
          destino: 'todos',
          etiqueta: 'Reforzar con el curso',
          motivo: `Incluye palabras que cuestan a varios: ${mejor.coinciden.join(', ')}.`,
        });
      }
    }

    // 3. Apoyo individual: quienes tienen palabras que les cuestan y bajo rendimiento o tareas vencidas
    libro.filas
      .filter((f) => f.alumno.id && f.palabrasDificiles.length > 0 && ((f.sinAyuda !== null && f.sinAyuda < UMBRALES.porcentajeSinAyudaBajo) || f.tareasVencidas > 0))
      .slice(0, 3)
      .forEach((f) => {
        const propias = f.palabrasDificiles.map((p) => p.toLowerCase());
        const mejor = publicados
          .map((c) => ({ c, coinciden: propias.filter((p) => palabrasDe(c).has(p)) }))
          .filter((x) => x.coinciden.length >= 1)
          .sort((a, b) => b.coinciden.length - a.coinciden.length)[0];
        if (mejor && f.alumno.id) {
          agregar({
            tipo: 'refuerzo_alumno',
            cuento: mejor.c,
            destino: [f.alumno.id],
            etiqueta: `Refuerzo para ${f.alumno.nombre}`,
            motivo: `Le cuestan: ${mejor.coinciden.join(', ')}.`,
          });
        }
      });

    return propuestas;
  }, [alumnos, cuentos, progresos, registros, libro, asignaciones]);
}
