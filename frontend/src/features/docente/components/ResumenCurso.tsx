import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/app/routes';
import { LibroDelCurso } from '@/features/docente/components/LibroDelCurso';
import { BarrasPorDia } from '@/features/docente/components/BarrasPorDia';
import { EncabezadoPagina, Hoja } from '@/features/docente/components/Hoja';
import { useLibroCurso, type EstadoAlumno } from '@/features/docente/components/useLibroCurso';

const COLOR_NUMERO: Record<EstadoAlumno, string> = {
  sin_actividad: 'text-statusDanger',
  atencion: 'text-statusWarn',
  al_dia: 'text-statusOk',
};

const Dato: React.FC<{ etiqueta: string; valor: React.ReactNode; nota?: React.ReactNode }> = ({ etiqueta, valor, nota }) => (
  <div className="px-5 py-4">
    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-secondary">{etiqueta}</p>
    <p className="mt-1 font-display text-5xl font-semibold leading-none text-primary">{valor}</p>
    {nota && <p className="mt-1.5 text-xs font-semibold text-secondary">{nota}</p>}
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
        <LibroDelCurso filas={libro.filas} />

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
