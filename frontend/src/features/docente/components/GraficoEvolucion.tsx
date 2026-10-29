import React from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { formatearFecha } from '@/features/docente/components/format';
import type { Evolucion } from '@/features/docente/components/resultados';
import { UMBRALES } from '@/features/docente/components/umbrales';

const ANCHO = 320;
const ALTO = 120;
const MARGEN = { izq: 28, der: 10, arr: 10, abj: 18 };

/** Línea con el % de juegos sin ayuda en cada sesión: el niño comparado consigo mismo, no con el curso. */
export const GraficoEvolucion: React.FC<{ evolucion: Evolucion }> = ({ evolucion }) => {
  const { puntos, cambio, frase } = evolucion;
  const x = (i: number) => MARGEN.izq + (puntos.length === 1 ? 0 : (i / (puntos.length - 1)) * (ANCHO - MARGEN.izq - MARGEN.der));
  const y = (pct: number) => MARGEN.arr + (1 - pct / 100) * (ALTO - MARGEN.arr - MARGEN.abj);
  const camino = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(p.porcentaje).toFixed(1)}`).join(' ');
  const Icono = cambio === null || Math.abs(cambio) < 10 ? Minus : cambio > 0 ? TrendingUp : TrendingDown;
  const color = cambio === null || Math.abs(cambio) < 10 ? 'text-secondary' : cambio > 0 ? 'text-statusOk' : 'text-statusWarn';

  return (
    <div>
      <p className={`flex items-center gap-2 text-sm font-semibold ${color}`}>
        <Icono className="w-5 h-5 shrink-0" aria-hidden />
        {frase}
      </p>
      {puntos.length >= 2 && (
        <figure className="mt-2">
          <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="w-full h-auto" role="img" aria-label={`Evolución del porcentaje de juegos sin ayuda en ${puntos.length} sesiones. ${frase}`}>
            {[0, 50, 100].map((v) => (
              <g key={v}>
                <line x1={MARGEN.izq} x2={ANCHO - MARGEN.der} y1={y(v)} y2={y(v)} stroke="var(--border-color, #d0d7de)" strokeWidth="1" strokeDasharray={v === 50 ? '3 3' : undefined} />
                <text x={MARGEN.izq - 4} y={y(v) + 3} textAnchor="end" fontSize="9" fill="var(--text-secondary, #5b6b7b)">
                  {v}%
                </text>
              </g>
            ))}
            <path d={camino} fill="none" stroke="var(--brand-primary, #1a6b7c)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {puntos.map((p, i) => (
              <circle key={p.fecha} cx={x(i)} cy={y(p.porcentaje)} r="4" fill={p.porcentaje >= UMBRALES.porcentajeSinAyudaBajo ? 'var(--brand-primary, #1a6b7c)' : 'var(--status-warn, #b45309)'} stroke="#fff" strokeWidth="1.5">
                <title>{`${formatearFecha(p.fecha)} · ${p.titulo}: ${p.aciertos} de ${p.total}`}</title>
              </circle>
            ))}
          </svg>
          <figcaption className="flex justify-between text-[0.7rem] text-secondary">
            <span>{formatearFecha(puntos[0].fecha).split(',')[0]}</span>
            <span>% de juegos sin ayuda</span>
            <span>{formatearFecha(puntos[puntos.length - 1].fecha).split(',')[0]}</span>
          </figcaption>
        </figure>
      )}
    </div>
  );
};
