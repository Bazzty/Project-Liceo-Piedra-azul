import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, Palette, Volume2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { VozId } from '@/types';
import { THEMES_CONFIG } from '@/config/themes';
import { VOCES_CONFIG, VOZ_POR_DEFECTO } from '@/config/voces';
import { formatearFecha } from './format';
import { useListaAlumnos, useResumen } from './useResumen';
import { ProgresoPorCuento, RegistroLista, StatsGrid } from './widgets';

const Avatar: React.FC<{ nombre: string; url?: string; grande?: boolean }> = ({ nombre, url, grande }) => (
  <div
    className={`${grande ? 'w-14 h-14 text-2xl' : 'w-11 h-11 text-lg'} rounded-full bg-app border-2 border-borderCustom overflow-hidden flex items-center justify-center font-black text-brand shrink-0`}
  >
    {url ? <img src={url} alt={nombre} className="w-full h-full object-cover" /> : nombre.charAt(0).toUpperCase()}
  </div>
);

/** Detalle de un alumno: avance + cambio de color y voz. */
const DetalleAlumno: React.FC<{ alumnoId: string; onVolver: () => void }> = ({ alumnoId, onVolver }) => {
  const alumno = useLiveQuery(() => db.alumnos.get(alumnoId), [alumnoId]);
  const resumen = useResumen(alumnoId);

  if (!alumno || !resumen) return <p className="text-secondary font-semibold">Cargando…</p>;

  const vozActual = alumno.vozId ?? VOZ_POR_DEFECTO;

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={onVolver}
        className="self-start inline-flex items-center gap-2 text-sm font-bold text-secondary hover:text-brand cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a la lista
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar nombre={alumno.nombre} url={alumno.avatarUrl} grande />
          <h2 className="text-2xl font-black text-primary">
            Avance de {alumno.nombre} {alumno.apellido}
          </h2>
        </div>
        <span className="text-sm font-semibold text-secondary">
          Última sesión: {resumen.ultimaActividad ? formatearFecha(resumen.ultimaActividad) : 'sin actividad'}
        </span>
      </div>

      <StatsGrid resumen={resumen} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ProgresoPorCuento resumen={resumen} />
        <RegistroLista resumen={resumen} />
      </div>

      {/* Personalización del alumno: se guarda en la BD y se aplica cuando el alumno entra */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t-2 border-borderCustom pt-6">
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-black text-primary inline-flex items-center gap-2">
            <Palette className="w-5 h-5 text-brand" /> Color del alumno
          </h3>
          <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Color del alumno">
            {THEMES_CONFIG.map((t) => (
              <button
                key={t.id}
                role="radio"
                aria-checked={alumno.temaId === t.id}
                onClick={() => db.alumnos.update(alumnoId, { temaId: t.id })}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl border-2 font-bold text-sm cursor-pointer transition-all ${
                  alumno.temaId === t.id
                    ? 'border-brand bg-app text-primary'
                    : 'border-borderCustom bg-surface text-secondary hover:border-brand'
                }`}
              >
                <span
                  className="w-5 h-5 rounded-full border-2 border-borderCustom"
                  style={{ backgroundColor: t.colorPreviewHex }}
                />
                {t.nombre}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-black text-primary inline-flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-brand" /> Voz del alumno
          </h3>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Voz del alumno">
            {VOCES_CONFIG.map((v) => (
              <button
                key={v.id}
                role="radio"
                aria-checked={vozActual === v.id}
                onClick={() => db.alumnos.update(alumnoId, { vozId: v.id as VozId })}
                className={`text-left px-3 py-2 rounded-2xl border-2 cursor-pointer transition-all ${
                  vozActual === v.id
                    ? 'border-brand bg-app'
                    : 'border-borderCustom bg-surface hover:border-brand'
                }`}
              >
                <span className="block text-sm font-black text-primary">{v.nombre}</span>
                <span className="block text-xs font-semibold text-secondary">{v.descripcion}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

/** 9c. Lista de todos los alumnos con acceso al detalle de cada uno. */
export const AlumnosPanel: React.FC = () => {
  const filas = useListaAlumnos();
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  if (seleccionado) {
    return <DetalleAlumno alumnoId={seleccionado} onVolver={() => setSeleccionado(null)} />;
  }
  if (!filas) return <p className="text-secondary font-semibold">Cargando alumnos…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-black text-primary">Alumnos</h2>
        <p className="text-sm font-semibold text-secondary">
          Entra al detalle de cada estudiante para ver su avance y cambiar su color y voz.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {filas.map(({ alumno, terminados, posibles, ultimaActividad }) => {
          const pct = posibles ? Math.round((terminados / posibles) * 100) : 0;
          return (
            <li key={alumno.id}>
              <button
                onClick={() => alumno.id && setSeleccionado(alumno.id)}
                className="w-full flex items-center gap-4 bg-app border-2 border-borderCustom rounded-2xl p-3 hover:border-brand transition-all cursor-pointer text-left"
              >
                <Avatar nombre={alumno.nombre} url={alumno.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-primary truncate">
                    {alumno.nombre} {alumno.apellido}
                  </p>
                  <p className="text-xs font-semibold text-secondary">
                    {ultimaActividad ? `Última actividad: ${formatearFecha(ultimaActividad)}` : 'Sin actividad aún'}
                  </p>
                </div>
                <div className="hidden sm:flex flex-col gap-1 w-40">
                  <span className="text-xs font-bold text-secondary">
                    {terminados} de {posibles} cuentos
                  </span>
                  <div className="h-2.5 rounded-full bg-borderCustom overflow-hidden">
                    <div className="h-full bg-brand rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-secondary shrink-0" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
