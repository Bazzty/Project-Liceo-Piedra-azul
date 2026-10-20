import React, { useState } from 'react';
import { Home, School } from 'lucide-react';
import type { Pictograma } from '@/types';
import { formatearFecha } from './format';
import type { Resumen } from './useResumen';

/** Imagen de pictograma con respaldo (si no carga, muestra la inicial de la palabra). */
export const PictoImg: React.FC<{ src?: string; alt: string; className?: string }> = ({
  src,
  alt,
  className = 'w-11 h-11',
}) => {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div
        className={`${className} rounded-xl bg-app border-2 border-borderCustom flex items-center justify-center text-secondary font-black shrink-0`}
        aria-label={alt}
      >
        {alt.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={`${className} rounded-xl bg-white border-2 border-borderCustom object-contain p-0.5 shrink-0`}
    />
  );
};

const Tarjeta: React.FC<{ valor: React.ReactNode; etiqueta: string }> = ({ valor, etiqueta }) => (
  <div className="bg-app border-2 border-borderCustom rounded-2xl p-4 flex flex-col gap-1">
    <span className="text-2xl xl:text-3xl font-black text-primary leading-none whitespace-nowrap">{valor}</span>
    <span className="text-sm font-semibold text-secondary">{etiqueta}</span>
  </div>
);

/** Las 4 tarjetas de resumen (cuentos terminados, palabras, sesiones, más usados). */
export const StatsGrid: React.FC<{ resumen: Resumen }> = ({ resumen }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <Tarjeta
      valor={`${resumen.cuentosTerminados} de ${resumen.cuentosPosibles}`}
      etiqueta="Cuentos terminados"
    />
    <Tarjeta valor={resumen.palabrasEscuchadas} etiqueta="Palabras escuchadas" />
    <Tarjeta valor={resumen.sesionesSemana} etiqueta="Sesiones esta semana" />
    <div className="bg-app border-2 border-borderCustom rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5 min-h-12 items-center">
        {resumen.masUsados.length === 0 ? (
          <span className="text-sm text-secondary font-semibold">Sin uso aún</span>
        ) : (
          resumen.masUsados.map((p: Pictograma) => (
            <PictoImg key={p.id} src={p.imagenUrl} alt={p.palabra} />
          ))
        )}
      </div>
      <span className="text-sm font-semibold text-secondary">Más usados en el tablero</span>
    </div>
  </div>
);

/** Barras de progreso por cuento. */
export const ProgresoPorCuento: React.FC<{ resumen: Resumen }> = ({ resumen }) => (
  <section className="flex flex-col gap-3">
    <h3 className="text-lg font-black text-primary">Progreso por cuento</h3>
    {resumen.progresoPorCuento.length === 0 && (
      <p className="text-sm text-secondary font-semibold">No hay cuentos publicados.</p>
    )}
    {resumen.progresoPorCuento.map(({ cuento, porcentaje }) => (
      <div key={cuento.id} className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_3rem] items-center gap-3">
        <span className="text-sm font-bold text-primary leading-tight">
          {cuento.titulo}
        </span>
        <div
          className="h-3 rounded-full bg-borderCustom overflow-hidden"
          role="progressbar"
          aria-valuenow={porcentaje}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso en ${cuento.titulo}`}
        >
          <div className="h-full bg-brand rounded-full" style={{ width: `${porcentaje}%` }} />
        </div>
        <span className="text-sm font-black text-primary text-right">{porcentaje}%</span>
      </div>
    ))}
  </section>
);

/** Últimos movimientos (lecturas y tablero). */
export const RegistroLista: React.FC<{ resumen: Resumen; mostrarAlumno?: boolean }> = ({
  resumen,
  mostrarAlumno = false,
}) => (
  <section className="flex flex-col gap-3">
    <h3 className="text-lg font-black text-primary">Registro</h3>
    {resumen.registro.length === 0 && (
      <p className="text-sm text-secondary font-semibold">Aún no hay actividad registrada.</p>
    )}
    {resumen.registro.map((r) => (
      <div key={r.id} className="border-2 border-borderCustom rounded-2xl p-3 bg-app flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2 text-xs font-bold text-secondary">
          <span>{formatearFecha(r.fecha)}</span>
          <span className="inline-flex items-center gap-1">
            {r.lugar === 'liceo' ? <School className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
            {r.lugar === 'liceo' ? 'Liceo' : 'Casa'}
          </span>
        </div>
        <p className="text-sm font-bold text-primary">
          {mostrarAlumno && <span className="text-brand">{r.alumnoNombre}: </span>}
          {r.detalle}
        </p>
      </div>
    ))}
  </section>
);
