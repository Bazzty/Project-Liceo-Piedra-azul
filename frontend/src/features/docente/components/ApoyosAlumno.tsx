import React, { useState } from 'react';
import { HeartHandshake } from 'lucide-react';
import { actualizarAlumno } from '@/api';
import { Hoja } from '@/features/docente/components/Hoja';
import { APOYOS } from '@/shared/config/apoyos';
import type { Alumno, ApoyoId } from '@/types';

const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' });

const FilaApoyo: React.FC<{ alumno: Alumno; id: ApoyoId }> = ({ alumno, id }) => {
  const config = APOYOS.find((a) => a.id === id);
  const actual = alumno.apoyos?.[id];
  const [motivo, setMotivo] = useState<string | null>(null);
  if (!config || !alumno.id) return null;
  const alumnoId = alumno.id;

  const guardar = (cambios: Partial<NonNullable<typeof actual>>) =>
    actualizarAlumno(alumnoId, {
      apoyos: { ...alumno.apoyos, [id]: { activo: false, ...actual, ...cambios } },
    });

  return (
    <li className="border-t border-borderCustom py-3 first:border-t-0 first:pt-0">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={!!actual?.activo}
          onChange={(e) => guardar({ activo: e.target.checked, desde: e.target.checked ? actual?.desde ?? new Date().toISOString() : actual?.desde })}
          className="mt-1 w-5 h-5 accent-[var(--brand)]"
        />
        <span className="min-w-0">
          <span className="block text-sm font-bold text-primary">{config.nombre}</span>
          <span className="block text-xs text-secondary">{config.descripcion}</span>
        </span>
      </label>
      {actual?.activo && (
        <div className="mt-2 ml-8 flex flex-col gap-1">
          <label htmlFor={`motivo-${id}`} className="text-xs font-semibold text-secondary">
            ¿Por qué lo usa? {actual.desde && <span className="font-normal">· desde el {fechaCorta(actual.desde)}</span>}
          </label>
          <input
            id={`motivo-${id}`}
            value={motivo ?? actual.motivo ?? ''}
            onChange={(e) => setMotivo(e.target.value)}
            onBlur={() => motivo !== null && guardar({ motivo: motivo.trim() })}
            maxLength={120}
            placeholder={`Ej.: ${config.ejemplo}`}
            className="w-full min-h-11 rounded-control border border-borderStrong bg-surface px-3 text-sm text-primary"
          />
        </div>
      )}
    </li>
  );
};

/** Apoyos del PIE de un niño: qué ajustes usa y por qué. Se aplican solos cuando él entra. */
export const ApoyosAlumno: React.FC<{ alumno: Alumno }> = ({ alumno }) => (
  <Hoja aria-label="Apoyos del PIE">
    <h2 className="font-display text-2xl font-semibold text-primary inline-flex items-center gap-2">
      <HeartHandshake className="w-5 h-5 text-brand" aria-hidden /> Apoyos del PIE
    </h2>
    <p className="text-xs text-secondary">Se aplican solos cuando {alumno.nombre} entra. Queda anotado el motivo para el equipo.</p>
    <ul className="mt-3 flex flex-col">
      {APOYOS.map((a) => (
        <FilaApoyo key={a.id} alumno={alumno} id={a.id} />
      ))}
    </ul>
  </Hoja>
);

/** Apoyos activos, para el informe impreso. */
export const ApoyosEnInforme: React.FC<{ alumno: Alumno }> = ({ alumno }) => {
  const activos = APOYOS.filter((a) => alumno.apoyos?.[a.id]?.activo);
  if (activos.length === 0) return <p className="text-sm text-secondary">No tiene apoyos configurados.</p>;
  return (
    <ul className="flex flex-col gap-1.5 text-sm text-primary">
      {activos.map((a) => (
        <li key={a.id}>
          <strong>{a.nombre}</strong>
          {alumno.apoyos?.[a.id]?.motivo ? ` · ${alumno.apoyos[a.id]?.motivo}` : ''}
        </li>
      ))}
    </ul>
  );
};
