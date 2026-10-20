import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/app/routes';
import { Hoja } from '@/features/docente/components/Hoja';
import { formatearFecha } from '@/features/docente/components/format';
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
export const LibroDelCurso: React.FC<{ filas: FilaLibro[]; titulo?: string }> = ({ filas, titulo = 'Libro del curso' }) => (
        <Hoja aria-label={titulo} className="overflow-x-auto">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold text-primary">{titulo}</h2>
            <p className="text-xs text-secondary">Cada cuadro es un día con actividad; el marcado es hoy</p>
          </div>
          <table className="mt-2 w-full text-left border-collapse">
            <thead>
              <tr className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-secondary">
                <th className="py-2 pr-3 font-semibold">Estudiante</th>
                <th className="py-2 pr-3 font-semibold">Últimos 7 días</th>
                <th className="py-2 pr-3 font-semibold">Cuentos</th>
                <th className="py-2 pr-3 font-semibold">Último acceso</th>
                <th className="py-2 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr key={fila.alumno.id} className="border-t border-borderCustom">
                  <td className="py-3 pr-3">
                    <Link
                      to={`${ROUTES.profesorEstudiantes}?alumno=${fila.alumno.id}`}
                      className="block text-primary hover:text-brand"
                    >
                      <span className="font-display text-xl font-semibold">{fila.alumno.nombre}</span>
                      <span className="block text-xs text-secondary">Nivel {fila.nivel}</span>
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
