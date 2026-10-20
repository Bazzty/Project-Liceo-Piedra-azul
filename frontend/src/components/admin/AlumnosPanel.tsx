import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, Palette, Volume2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { VozId } from '@/types';
import { THEMES_CONFIG } from '@/config/themes';
import { VOCES_CONFIG, VOZ_POR_DEFECTO } from '@/config/voces';
import { Avatar, OptionButton, PageTitle, ProgressBar, SectionTitle } from '@/shared/ui';
import { formatearFecha } from './format';
import { useListaAlumnos, useResumen } from './useResumen';
import { ProgresoPorCuento, RegistroLista, StatsGrid } from './widgets';

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
          <Avatar nombre={alumno.nombre} url={alumno.avatarUrl} size="lg" />
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
          <SectionTitle icon={<Palette className="w-5 h-5 text-brand" />}>Color del alumno</SectionTitle>
          <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Color del alumno">
            {THEMES_CONFIG.map((t) => (
              <OptionButton
                key={t.id}
                selected={alumno.temaId === t.id}
                onClick={() => db.alumnos.update(alumnoId, { temaId: t.id })}
                className="flex items-center gap-2 px-3 py-2 font-bold text-sm"
              >
                <span
                  className="w-5 h-5 rounded-full border-2 border-borderCustom"
                  style={{ backgroundColor: t.colorPreviewHex }}
                />
                {t.nombre}
              </OptionButton>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <SectionTitle icon={<Volume2 className="w-5 h-5 text-brand" />}>Voz del alumno</SectionTitle>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Voz del alumno">
            {VOCES_CONFIG.map((v) => (
              <OptionButton
                key={v.id}
                selected={vozActual === v.id}
                onClick={() => db.alumnos.update(alumnoId, { vozId: v.id as VozId })}
                className="text-left px-3 py-2"
              >
                <span className="block text-sm font-black text-primary">{v.nombre}</span>
                <span className="block text-xs font-semibold text-secondary">{v.descripcion}</span>
              </OptionButton>
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
      <PageTitle
        title="Alumnos"
        description="Entra al detalle de cada estudiante para ver su avance y cambiar su color y voz."
      />

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
                  <ProgressBar value={pct} size="sm" label={`Cuentos de ${alumno.nombre}`} />
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
