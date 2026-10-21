import React from 'react';
import { formatearFecha } from '@/features/docente/components/format';
import type { ResultadoActividad } from '@/features/docente/components/resultados';
import type { TareaDeAlumno } from '@/features/docente/components/useFichaAlumno';
import { formatearLimite } from '@/features/tareas/estadoTarea';
import { UMBRALES } from '@/features/docente/components/umbrales';

const colorDe = (porcentaje: number) =>
  porcentaje >= 70 ? 'bg-statusOk' : porcentaje >= UMBRALES.porcentajeSinAyudaBajo ? 'bg-statusWarn' : 'bg-statusDanger';

/** Resultados de las sesiones de juegos y las palabras que más cuestan. */
export const ResultadosActividades: React.FC<{
  resultados: ResultadoActividad[];
  palabras: { palabra: string; veces: number }[];
  maximo?: number;
}> = ({ resultados, palabras, maximo = 5 }) => (
  <div className="flex flex-col gap-4">
    {resultados.length === 0 ? (
      <p className="text-sm text-secondary">Aún no ha hecho juegos. Se muestran aquí cuando termine los de un cuento.</p>
    ) : (
      <ul className="flex flex-col gap-3">
        {resultados.slice(0, maximo).map((r) => (
          <li key={`${r.fecha}-${r.titulo}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,7rem)] items-center gap-x-4 gap-y-1">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-primary">{r.titulo}</p>
              <p className="text-xs text-secondary">{formatearFecha(r.fecha)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-primary">
                {r.aciertos} de {r.total} <span className="font-normal text-secondary">sin ayuda</span>
              </p>
              <span
                role="progressbar"
                aria-label={`${r.porcentaje} % sin ayuda en ${r.titulo}`}
                aria-valuenow={r.porcentaje}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-1 block h-2 rounded-md bg-borderCustom overflow-hidden"
              >
                <span className={`block h-full ${colorDe(r.porcentaje)}`} style={{ width: `${r.porcentaje}%` }} />
              </span>
            </div>
          </li>
        ))}
      </ul>
    )}

    {palabras.length > 0 && (
      <div>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-secondary">Palabras que le cuestan</p>
        <ul className="mt-1.5 flex flex-wrap gap-2">
          {palabras.map((p) => (
            <li key={p.palabra} className="rounded-sm bg-statusWarn-bg px-2.5 py-1 text-sm font-semibold text-statusWarn">
              {p.palabra}
              {p.veces > 1 && <span className="font-normal"> ×{p.veces}</span>}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

const ETIQUETA_TAREA = {
  hecha: { texto: '✓ Hecha', clases: 'bg-statusOk-bg text-statusOk' },
  pendiente: { texto: '● Pendiente', clases: 'bg-statusInfo-bg text-statusInfo' },
  vencida: { texto: '■ Vencida', clases: 'bg-statusDanger-bg text-statusDanger' },
} as const;

export const EtiquetaTarea: React.FC<{ estado: keyof typeof ETIQUETA_TAREA }> = ({ estado }) => (
  <span className={`inline-flex px-2.5 py-0.5 rounded-sm text-xs font-semibold whitespace-nowrap ${ETIQUETA_TAREA[estado].clases}`}>{ETIQUETA_TAREA[estado].texto}</span>
);

/** Tareas que la docente le dejó a este niño y cómo van. */
export const TareasDelAlumno: React.FC<{ tareas: TareaDeAlumno[] }> = ({ tareas }) =>
  tareas.length === 0 ? (
    <p className="text-sm text-secondary">No tiene tareas asignadas.</p>
  ) : (
    <ul className="flex flex-col gap-3">
      {tareas.map((t) => (
        <li key={t.asignacion.id} className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-primary">{t.titulo}</p>
            <p className="text-xs text-secondary">
              {t.asignacion.limite ? `Para el ${formatearLimite(t.asignacion.limite)}` : 'Sin fecha límite'}
              {t.porcentaje !== null && ` · ${t.porcentaje} % sin ayuda`}
            </p>
          </div>
          <EtiquetaTarea estado={t.estado} />
        </li>
      ))}
    </ul>
  );
