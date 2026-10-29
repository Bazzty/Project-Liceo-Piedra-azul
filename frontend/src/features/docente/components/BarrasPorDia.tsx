import React from 'react';

export interface BarrasPorDiaProps {
  datos: { etiqueta: string; valor: number }[];
  /** Describe el gráfico para lectores de pantalla (se completa con los valores). */
  titulo: string;
}

const ANCHO = 420;
const BASE = 110;
const ALTO_MAXIMO = 84;

/** Barras por día con el valor escrito sobre cada una (no depende solo del color). */
export const BarrasPorDia: React.FC<BarrasPorDiaProps> = ({ datos, titulo }) => {
  const maximo = Math.max(4, ...datos.map((d) => d.valor));
  const ranura = (ANCHO - 20) / datos.length;
  const descripcion = `${titulo}: ${datos.map((d) => `${d.etiqueta} ${d.valor}`).join(', ')}`;

  return (
    <svg viewBox={`0 0 ${ANCHO} 150`} className="w-full h-auto" role="img" aria-label={descripcion}>
      <line x1="10" y1={BASE} x2={ANCHO - 6} y2={BASE} stroke="var(--border-strong)" strokeWidth="1" />
      {datos.map((d, i) => {
        const alto = Math.max(2, (d.valor / maximo) * ALTO_MAXIMO);
        const x = 14 + i * ranura + (ranura - 34) / 2;
        const centro = x + 17;
        return (
          <g key={d.etiqueta + i}>
            <rect x={x} y={BASE - alto} width="34" height={alto} rx="2" fill="var(--brand-primary)" />
            <text x={centro} y={BASE - alto - 6} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text-primary)">
              {d.valor}
            </text>
            <text x={centro} y={BASE + 20} textAnchor="middle" fontSize="12" fill="var(--text-secondary)">
              {d.etiqueta}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
