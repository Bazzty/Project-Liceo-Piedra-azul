import React, { useState } from 'react';
import { Home, School, BookOpen, Volume2, Calendar, Users } from 'lucide-react';
import { formatearFecha } from './format';
import type { Resumen } from './useResumen';

/** Imagen de pictograma con respaldo limpio para vista docente. */
export const PictoImg: React.FC<{ src?: string; alt: string; className?: string }> = ({
  src,
  alt,
  className = 'w-9 h-9',
}) => {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div
        className={`${className} rounded-md bg-white border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0`}
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
      className={`${className} rounded-md bg-white border border-slate-300 dark:border-slate-700 object-contain p-0.5 shrink-0`}
    />
  );
};

interface TarjetaKPIProps {
  valor: React.ReactNode;
  etiqueta: string;
  icono: React.ElementType;
}

const TarjetaKPI: React.FC<TarjetaKPIProps> = ({ valor, etiqueta, icono: Icon }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
    <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
      <Icon className="w-6 h-6" />
    </div>
    <div className="flex flex-col min-w-0">
      <span className="text-xl font-black text-slate-900 dark:text-white truncate">{valor}</span>
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{etiqueta}</span>
    </div>
  </div>
);

/** Las 4 tarjetas KPI de resumen docente */
export const StatsGrid: React.FC<{ resumen: Resumen }> = ({ resumen }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <TarjetaKPI
      icono={BookOpen}
      valor={`${resumen.cuentosTerminados} / ${resumen.cuentosPosibles}`}
      etiqueta="Cuentos completados"
    />
    <TarjetaKPI
      icono={Volume2}
      valor={resumen.palabrasEscuchadas.toLocaleString()}
      etiqueta="Palabras escuchadas"
    />
    <TarjetaKPI
      icono={Calendar}
      valor={resumen.sesionesSemana}
      etiqueta="Sesiones esta semana"
    />
    <TarjetaKPI
      icono={Users}
      valor={
        resumen.masUsados.length > 0 ? (
          <div className="flex items-center gap-1.5 py-0.5">
            {resumen.masUsados.map((pic) => (
              <PictoImg key={pic.id || pic.palabra} src={pic.imagenUrl} alt={pic.palabra} className="w-7 h-7" />
            ))}
          </div>
        ) : (
          <span className="text-xs font-normal text-slate-400">Sin uso aún</span>
        )
      }
      etiqueta="Pictogramas favoritos"
    />
  </div>
);

/** Barras de progreso por cuento sobrias */
export const ProgresoPorCuento: React.FC<{ resumen: Resumen }> = ({ resumen }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Progreso por Cuento</h3>
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        {resumen.progresoPorCuento.length} cuentos
      </span>
    </div>

    {resumen.progresoPorCuento.length === 0 && (
      <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
        No hay cuentos publicados.
      </p>
    )}

    <div className="flex flex-col gap-3">
      {resumen.progresoPorCuento.map(({ cuento, porcentaje }) => (
        <div key={cuento.id} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
              {cuento.titulo}
            </span>
            <span className="text-slate-900 dark:text-white font-bold">{porcentaje}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-brand h-full rounded-full transition-all duration-500"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/** Últimos movimientos en formato bitácora administrativa */
export const RegistroLista: React.FC<{ resumen: Resumen; mostrarAlumno?: boolean }> = ({
  resumen,
  mostrarAlumno = false,
}) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Actividad Reciente</h3>
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Bitácora</span>
    </div>

    {resumen.registro.length === 0 && (
      <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
        Aún no hay actividad registrada.
      </p>
    )}

    <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
      {resumen.registro.map((r, idx) => (
        <div key={r.id || idx} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {formatearFecha(r.fecha)}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {r.lugar === 'liceo' ? <School className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                {r.lugar === 'liceo' ? 'Liceo' : 'Casa'}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
              {mostrarAlumno && <strong className="text-slate-900 dark:text-white">{r.alumnoNombre}: </strong>}
              {r.detalle}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);