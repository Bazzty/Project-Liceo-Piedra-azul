import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/app/routes';
import { BarrasPorDia } from '@/features/docente/components/BarrasPorDia';
import { EncabezadoPagina, Hoja } from '@/features/docente/components/Hoja';
import { formatearFecha } from '@/features/docente/components/format';
import { useLibroCurso, type EstadoAlumno, type FilaLibro } from '@/features/docente/components/useLibroCurso';

const ETIQUETAS_ESTADO: Record<EstadoAlumno, { texto: string; clases: string }> = {
  al_dia: { texto: '● Al día', clases: 'bg-statusOk-bg text-statusOk' },
  atencion: { texto: '▲ Atención', clases: 'bg-statusWarn-bg text-statusWarn' },
  sin_actividad: { texto: '■ Sin actividad', clases: 'bg-statusDanger-bg text-statusDanger' },
};

const COLOR_NUMERO: Record<EstadoAlumno, string> = {
  sin_actividad: 'text-statusDanger',
  atencion: 'text-statusWarn',
  al_dia: 'text-statusOk',
};

const EtiquetaEstado: React.FC<{ estado: EstadoAlumno }> = ({ estado }) => (
  <span className={`inline-flex px-2.5 py-0.5 rounded-sm text-xs font-semibold ${ETIQUETAS_ESTADO[estado].clases}`}>
    {ETIQUETAS_ESTADO[estado].texto}
  </span>
);

const Dato: React.FC<{ etiqueta: string; valor: React.ReactNode; nota?: React.ReactNode }> = ({ etiqueta, valor, nota }) => (
  <div className="px-5 py-4">
    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-secondary">{etiqueta}</p>
    <p className="mt-1 font-display text-5xl font-semibold leading-none text-primary">{valor}</p>
    {nota && <p className="mt-1.5 text-xs font-semibold text-secondary">{nota}</p>}
  </div>
);

const SemanaEnCuadros: React.FC<{ fila: FilaLibro }> = ({ fila }) => (
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

/** Resumen del curso como "libro de clases": un vistazo a cada estudiante y a quién apoyar primero. */
export const ResumenCurso: React.FC = () => {
  const libro = useLibroCurso();
  if (!libro) return <p className="text-secondary font-semibold">Cargando resumen…</p>;

  const hoy = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  const fecha = hoy.charAt(0).toUpperCase() + hoy.slice(1);
  const requierenApoyo = libro.filas.filter((f) => f.estado !== 'al_dia').length;
  const diferencia = libro.cuentosSemana - libro.cuentosSemanaAnterior;

  return (
    <>
      <EncabezadoPagina
        etiqueta={`${fecha} · Datos de demostración`}
        titulo="Kínder A"
        descripcion={
          <>
            Hoy leyeron <strong>{libro.leyeronHoy} de {libro.total}</strong> estudiantes.{' '}
            {requierenApoyo === 0 ? (
              'Todos van al día.'
            ) : (
              <strong className="text-statusWarn">
                {requierenApoyo} {requierenApoyo === 1 ? 'requiere' : 'requieren'} apoyo esta semana.
              </strong>
            )}
          </>
        }
      />

      <Hoja padding={false} aria-label="Indicadores de la semana" className="grid grid-cols-2 lg:grid-cols-4 lg:divide-x divide-borderCustom">
        <Dato
          etiqueta="Activos esta semana"
          valor={
            <>
              {libro.activosSemana}
              <span className="text-2xl text-secondary"> / {libro.total}</span>
            </>
          }
        />
        <Dato
          etiqueta="Cuentos leídos"
          valor={libro.cuentosSemana}
          nota={diferencia === 0 ? 'Igual que la semana pasada' : `${diferencia > 0 ? '▲' : '▼'} ${Math.abs(diferencia)} ${diferencia > 0 ? 'más' : 'menos'} que la semana pasada`}
        />
        <Dato etiqueta="Sesiones esta semana" valor={libro.sesionesSemana} />
        <Dato etiqueta="Palabras escuchadas" valor={libro.palabrasEscuchadas} />
      </Hoja>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <Hoja aria-label="Libro del curso" className="overflow-x-auto">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold text-primary">Libro del curso</h2>
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
              {libro.filas.map((fila) => (
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

        <div className="flex flex-col gap-5 min-w-0">
          <Hoja aria-label="Notas del día">
            <h2 className="font-display text-2xl font-semibold text-primary">Notas del día</h2>
            {libro.notas.length === 0 ? (
              <p className="mt-3 text-sm text-secondary">Todo en orden: nadie necesita apoyo especial hoy.</p>
            ) : (
              <ol className="mt-2 flex flex-col">
                {libro.notas.map((nota, i) => (
                  <li key={nota.alumnoId ?? i} className="grid grid-cols-[1.9rem_minmax(0,1fr)] gap-3 py-3 border-t border-borderCustom">
                    <span className={`font-display text-3xl font-semibold leading-none ${COLOR_NUMERO[nota.estado]}`}>{i + 1}</span>
                    <div>
                      <p className="text-sm font-bold text-primary">{nota.titulo}</p>
                      <p className="mt-0.5 text-sm leading-snug text-primary">{nota.consejo}</p>
                      {nota.alumnoId && (
                        <Link
                          to={`${ROUTES.profesorEstudiantes}?alumno=${nota.alumnoId}`}
                          className="mt-1 inline-block text-sm font-semibold text-brand hover:text-brand-hover"
                        >
                          Abrir ficha
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Hoja>

          <Hoja>
            <h2 className="font-display text-2xl font-semibold text-primary">Cuentos por día</h2>
            <BarrasPorDia datos={libro.cuentosPorDia} titulo="Cuentos leídos por día" />
          </Hoja>
        </div>
      </div>
    </>
  );
};
