import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/app/routes';
import { AvatarAlumno } from '@/features/docente/components/AvatarAlumno';
import { TareaDeHoy } from '@/features/docente/components/TareaDeHoy';
import { LibroDelCurso } from '@/features/docente/components/LibroDelCurso';
import { BarrasPorDia } from '@/features/docente/components/BarrasPorDia';
import { EncabezadoPagina, Hoja } from '@/features/docente/components/Hoja';
import { UMBRALES } from '@/features/docente/components/umbrales';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { useLibroCurso, type EstadoAlumno } from '@/features/docente/components/useLibroCurso';

const TINTE_NOTA: Record<EstadoAlumno, string> = {
  sin_actividad: 'bg-tinte-coral',
  atencion: 'bg-tinte-ambar',
  al_dia: 'bg-tinte-verde',
};

const saludo = () => {
  const hora = new Date().getHours();
  return hora < 12 ? 'Buenos días' : hora < 20 ? 'Buenas tardes' : 'Buenas noches';
};

const Dato: React.FC<{ etiqueta: string; valor: React.ReactNode; nota?: React.ReactNode; tinte: string }> = ({ etiqueta, valor, nota, tinte }) => (
  <div className={`rounded-card px-5 py-4 ${tinte}`}>
    <p className="text-sm font-medium text-primary/70">{etiqueta}</p>
    <p className="mt-2 font-display text-5xl leading-none text-primary">{valor}</p>
    {nota && <p className="mt-2 text-xs font-medium text-primary/70">{nota}</p>}
  </div>
);

/** Resumen del curso como "libro de clases": un vistazo a cada estudiante y a quién apoyar primero. */
export const ResumenCurso: React.FC = () => {
  const libro = useLibroCurso();
  const usuario = useAuthStore((st) => st.user);
  const [verTodas, setVerTodas] = useState(false);
  const [verSemana, setVerSemana] = useState(false);
  if (!libro) return <p className="text-secondary font-semibold">Cargando resumen…</p>;

  const hoy = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  const fecha = hoy.charAt(0).toUpperCase() + hoy.slice(1);
  const requierenApoyo = libro.filas.filter((f) => f.motivos.length > 0).length;
  const diferencia = libro.cuentosSemana - libro.cuentosSemanaAnterior;

  return (
    <>
      <EncabezadoPagina
        etiqueta={`Kínder A · ${fecha} · Datos de demostración`}
        titulo={`${saludo()}, ${usuario?.nombre ?? 'profesora'}`}
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

      <div aria-label="Indicadores de la semana" role="group" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Dato
          tinte="bg-tinte-azul"
          etiqueta="Activos esta semana"
          valor={
            <>
              {libro.activosSemana}
              <span className="text-2xl text-secondary"> / {libro.total}</span>
            </>
          }
        />
        <Dato
          tinte="bg-tinte-ambar"
          etiqueta="Cuentos leídos"
          valor={libro.cuentosSemana}
          nota={diferencia === 0 ? 'Igual que la semana pasada' : `${diferencia > 0 ? '▲' : '▼'} ${Math.abs(diferencia)} ${diferencia > 0 ? 'más' : 'menos'} que la semana pasada`}
        />
        <Dato tinte="bg-tinte-moca" etiqueta="Sesiones esta semana" valor={libro.sesionesSemana} />
        <Dato
          tinte="bg-tinte-verde"
          etiqueta="Momentos de calma"
          valor={libro.calmaSemana}
          nota={`esta semana · ${libro.calmaHoy} hoy`}
        />
              </div>

      <section aria-label="Para mirar hoy" className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-xl text-primary">Para mirar hoy</h2>
          <p className="text-sm text-secondary">
            Quién necesita apoyo primero.{' '}
            <span
              tabIndex={0}
              title={`Avisan si pasan ${UMBRALES.diasSinEntrar} días sin entrar, si hay ${UMBRALES.diasActivosMinimos} día o menos de actividad en la semana, si menos del ${UMBRALES.porcentajeSinAyudaBajo} % de los juegos sale sin ayuda o si hay tareas vencidas. Criterios provisionales.`}
              className="inline-flex align-middle text-secondary cursor-help"
              aria-label="Cómo se eligen"
            >
              <Info className="h-4 w-4" aria-hidden />
            </span>
          </p>
        </div>
        {libro.notas.length === 0 ? (
          <p className="rounded-card bg-tinte-verde px-5 py-4 text-sm font-medium text-tinte-verde-fuerte">Todo en orden: nadie necesita apoyo especial hoy.</p>
        ) : (
          <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {libro.notas.slice(0, verTodas ? undefined : 3).map((nota, i) => {
              const alumno = libro.filas.find((f) => f.alumno.id === nota.alumnoId)?.alumno;
              return (
                <li key={nota.alumnoId ?? i} className={`rounded-card p-4 flex flex-col gap-2 ${TINTE_NOTA[nota.estado]}`}>
                  <div className="flex items-center gap-3">
                    {alumno && <AvatarAlumno nombre={alumno.nombre} url={alumno.avatarUrl} />}
                    <p className="text-base font-semibold text-primary leading-snug">{nota.titulo}</p>
                  </div>
                  {nota.motivos.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5" aria-label="Otros motivos">
                      {nota.motivos.map((m) => (
                        <li key={m} className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {m}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-sm leading-snug text-primary/80">{nota.consejo}</p>
                  {nota.alumnoId && (
                    <div className="mt-auto pt-1 flex flex-wrap gap-2">
                      <Link
                        to={`${ROUTES.profesorActividades}?alumno=${nota.alumnoId}`}
                        className="inline-flex items-center min-h-9 rounded-control bg-brand px-3 text-sm font-medium text-onBrand hover:bg-brand-hover"
                      >
                        Asignar refuerzo
                      </Link>
                      <Link
                        to={`${ROUTES.profesorEstudiantes}?alumno=${nota.alumnoId}`}
                        className="inline-flex items-center min-h-9 rounded-control bg-white/70 px-3 text-sm font-medium text-primary hover:bg-white"
                      >
                        Abrir ficha
                      </Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
        {libro.notas.length > 3 && (
          <button type="button" onClick={() => setVerTodas(!verTodas)} className="self-start text-sm font-medium text-brand hover:text-brand-hover cursor-pointer">
            {verTodas ? 'Ver menos' : `Ver todos (${libro.notas.length})`}
          </button>
        )}
      </section>

      <TareaDeHoy />

      <div className="flex flex-col gap-4">
        <LibroDelCurso filas={libro.filas} />

        <div className="self-start">
          <button
            type="button"
            onClick={() => setVerSemana(!verSemana)}
            aria-expanded={verSemana}
            className="text-sm font-medium text-brand hover:text-brand-hover cursor-pointer"
          >
            {verSemana ? 'Ocultar actividad de la semana' : 'Ver actividad de la semana'}
          </button>
          {verSemana && (
            <Hoja className="mt-3">
              <h2 className="font-display text-xl text-primary">Cuentos por día</h2>
              <BarrasPorDia datos={libro.cuentosPorDia} titulo="Cuentos leídos por día" />
            </Hoja>
          )}
        </div>
      </div>
    </>
  );
};
