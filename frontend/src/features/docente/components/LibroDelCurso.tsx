import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/app/routes';
import { AvatarAlumno } from '@/features/docente/components/AvatarAlumno';
import { Hoja } from '@/features/docente/components/Hoja';
import { formatearFecha, normalizar } from '@/features/docente/components/format';
import type { EstadoAlumno, FilaLibro } from '@/features/docente/components/useLibroCurso';

const ETIQUETAS_ESTADO: Record<EstadoAlumno, { texto: string; clases: string }> = {
  al_dia: { texto: '● Al día', clases: 'bg-statusOk-bg text-statusOk' },
  atencion: { texto: '▲ Atención', clases: 'bg-statusWarn-bg text-statusWarn' },
  sin_actividad: { texto: '■ Sin actividad', clases: 'bg-statusDanger-bg text-statusDanger' },
};

export const EtiquetaEstado: React.FC<{ estado: EstadoAlumno }> = ({ estado }) => (
  <span className={`inline-flex px-2.5 py-0.5 rounded-sm text-xs font-semibold ${ETIQUETAS_ESTADO[estado].clases}`}>
    {ETIQUETAS_ESTADO[estado].texto}
  </span>
);

export const SemanaEnCuadros: React.FC<{ fila: FilaLibro }> = ({ fila }) => (
  <div
    className="flex gap-1"
    role="img"
    aria-label={`${fila.semana.filter(Boolean).length} de 7 días con actividad en la última semana`}
  >
    {fila.semana.map((activo, i) => (
      <span
        key={i}
        className={`w-[1.1rem] h-[1.1rem] rounded-[3px] box-border ${
          activo ? 'bg-brand' : 'border-[1.5px] border-borderStrong'
        } ${i === 6 ? 'outline outline-2 outline-offset-2 outline-primary' : ''}`}
      />
    ))}
  </div>
);

/** Tabla "libro del curso": una fila por estudiante con sus últimos 7 días, cuentos y estado. */
type Filtro = 'todos' | EstadoAlumno;
const FILTROS: { id: Filtro; etiqueta: string }[] = [
  { id: 'todos', etiqueta: 'Todos' },
  { id: 'atencion', etiqueta: 'Atención' },
  { id: 'sin_actividad', etiqueta: 'Sin actividad' },
];

export const LibroDelCurso: React.FC<{ filas: FilaLibro[]; titulo?: string }> = ({ filas: todas, titulo = 'Libro del curso' }) => {
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [buscar, setBuscar] = useState('');
  const filas = todas.filter(
    (f) => (filtro === 'todos' || f.estado === filtro) && normalizar(f.alumno.nombre).includes(normalizar(buscar)),
  );
  return (
        <Hoja aria-label={titulo} className="overflow-x-auto">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl text-primary">{titulo}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div role="group" aria-label="Filtrar por estado" className="flex gap-1">
                {FILTROS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFiltro(f.id)}
                    aria-pressed={filtro === f.id}
                    className={`min-h-9 rounded-full px-3 text-sm font-medium cursor-pointer transition-colors ${
                      filtro === f.id ? 'bg-tinte-azul text-brand' : 'text-secondary hover:bg-app'
                    }`}
                  >
                    {f.etiqueta}
                  </button>
                ))}
              </div>
              <label className="relative">
                <span className="sr-only">Buscar estudiante</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" aria-hidden />
                <input
                  type="search"
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  placeholder="Buscar"
                  className="min-h-9 w-36 rounded-control border border-borderCustom bg-surface pl-9 pr-3 text-sm text-primary"
                />
              </label>
            </div>
          </div>
          <table className="mt-2 w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-medium text-secondary">
                <th className="py-2 pr-3 font-semibold">Estudiante</th>
                <th className="py-2 pr-3 font-semibold">Últimos 7 días</th>
                <th className="py-2 pr-3 font-semibold">Cuentos</th>
                <th className="py-2 pr-3 font-semibold">Último acceso</th>
                <th className="py-2 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-secondary">
                    Nadie coincide con ese filtro.
                  </td>
                </tr>
              )}
              {filas.map((fila) => (
                <tr key={fila.alumno.id} className="border-t border-borderCustom hover:bg-brand/5 transition-colors">
                  <td className="py-3 pr-3">
                    <Link
                      to={`${ROUTES.profesorEstudiantes}?alumno=${fila.alumno.id}`}
                      className="flex items-center gap-3 text-primary hover:text-brand"
                    >
                      <AvatarAlumno nombre={fila.alumno.nombre} url={fila.alumno.avatarUrl} />
                      <span>
                        <span className="block text-base font-semibold">{fila.alumno.nombre}</span>
                        <span className="block text-xs text-secondary">
                          Nivel {fila.nivel}
                          {fila.calmaSemana > 0 && <span className="ml-2 rounded-full bg-tinte-verde px-2 py-0.5 font-medium text-tinte-verde-fuerte">Calma ×{fila.calmaSemana}</span>}
                        </span>
                        {fila.motivos.length > 0 && <span className="block text-xs font-medium text-statusWarn">{fila.motivos.join(' · ')}</span>}
                      </span>
                    </Link>
                  </td>
                  <td className="py-3 pr-3">
                    <SemanaEnCuadros fila={fila} />
                  </td>
                  <td className="py-3 pr-3 text-base font-semibold">{fila.cuentos}</td>
                  <td className="py-3 pr-3 text-sm text-secondary whitespace-nowrap">
                    {fila.ultimoAcceso ? formatearFecha(fila.ultimoAcceso) : 'Nunca'}
                  </td>
                  <td className="py-3">
                    <EtiquetaEstado estado={fila.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Hoja>
);
};
