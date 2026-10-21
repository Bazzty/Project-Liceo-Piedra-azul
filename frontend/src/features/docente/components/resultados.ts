import type { Cuento, Registro } from '@/types';
import { UMBRALES } from '@/features/docente/components/umbrales';

export interface ResultadoActividad {
  fecha: string;
  cuentoId?: string;
  titulo: string;
  aciertos: number;
  total: number;
  /** % de juegos resueltos sin ayuda. */
  porcentaje: number;
  dificiles: string[];
  /** El juego le ofreció descansar y aceptó. */
  descanso: boolean;
}

/** Resultados de las sesiones de juegos, de la más reciente a la más antigua. */
export const resultadosDeRegistros = (registros: Registro[], cuentos: Cuento[]): ResultadoActividad[] =>
  registros
    .filter((r) => r.tipo === 'actividad')
    .map((r) => {
      // Los registros antiguos solo traen el resumen escrito («…: 4 de 5 sin ayuda»)
      const escrito = r.detalle.match(/: (\d+) de (\d+)/);
      const aciertos = r.aciertos ?? (escrito ? Number(escrito[1]) : 0);
      const total = r.total ?? (escrito ? Number(escrito[2]) : 0);
      const titulo = cuentos.find((c) => c.id === r.cuentoId)?.titulo ?? r.detalle.match(/«(.+?)»/)?.[1] ?? 'Actividades';
      return {
        fecha: r.fecha,
        cuentoId: r.cuentoId,
        titulo,
        aciertos,
        total,
        porcentaje: total > 0 ? Math.round((aciertos / total) * 100) : 0,
        dificiles: r.dificiles ?? [],
        descanso: !!r.descanso,
      };
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

/** Palabras en las que más veces pidieron ayuda, de la que más cuesta a la que menos. */
export const palabrasDificiles = (resultados: ResultadoActividad[], maximo = 5): { palabra: string; veces: number }[] => {
  const cuenta = new Map<string, number>();
  resultados.forEach((r) => r.dificiles.forEach((p) => cuenta.set(p, (cuenta.get(p) ?? 0) + 1)));
  return [...cuenta.entries()]
    .map(([palabra, veces]) => ({ palabra, veces }))
    .sort((a, b) => b.veces - a.veces || a.palabra.localeCompare(b.palabra))
    .slice(0, maximo);
};

/** % de juegos sin ayuda en sus últimas sesiones, o null si todavía no jugó. */
export const promedioReciente = (resultados: ResultadoActividad[]): number | null => {
  const ultimas = resultados.filter((r) => r.total > 0).slice(0, UMBRALES.sesionesAPromediar);
  if (ultimas.length === 0) return null;
  const aciertos = ultimas.reduce((t, r) => t + r.aciertos, 0);
  const total = ultimas.reduce((t, r) => t + r.total, 0);
  return Math.round((aciertos / total) * 100);
};

export interface Evolucion {
  /** Sesiones de la más antigua a la más reciente (hasta 10). */
  puntos: ResultadoActividad[];
  /** Puntos de diferencia entre sus últimas sesiones y las primeras (null con menos de 2 sesiones). */
  cambio: number | null;
  frase: string;
}

/** Cómo le va a un niño comparado consigo mismo: sus primeras sesiones contra las últimas. */
export const evolucionDe = (resultados: ResultadoActividad[]): Evolucion => {
  const puntos = resultados.filter((r) => r.total > 0).slice(0, 10).reverse();
  if (puntos.length < 2) return { puntos, cambio: null, frase: 'Con más sesiones se podrá ver cómo avanza.' };
  const n = Math.min(3, Math.floor(puntos.length / 2));
  const media = (lista: ResultadoActividad[]) => Math.round(lista.reduce((t, r) => t + r.porcentaje, 0) / lista.length);
  const cambio = media(puntos.slice(-n)) - media(puntos.slice(0, n));
  const frase =
    cambio >= 10
      ? `Va mejorando: ${cambio} puntos más que en sus primeras sesiones.`
      : cambio <= -10
        ? `Últimamente le cuesta más que al principio (${Math.abs(cambio)} puntos menos): conviene reforzar.`
        : 'Se mantiene estable respecto de sus primeras sesiones.';
  return { puntos, cambio, frase };
};
