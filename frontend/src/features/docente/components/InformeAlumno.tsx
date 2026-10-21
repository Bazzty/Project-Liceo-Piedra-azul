import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { ROUTES } from '@/app/routes';
import { ResultadosActividades, TareasDelAlumno } from '@/features/docente/components/BloquesActividad';
import { useFichaAlumno } from '@/features/docente/components/useFichaAlumno';
import { UMBRALES } from '@/features/docente/components/umbrales';
import { Button } from '@/shared/ui';

const Titulo: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="font-display text-xl font-semibold text-primary border-b-2 border-primary pb-1 mb-3 break-after-avoid">{children}</h2>
);

const Dato: React.FC<{ etiqueta: string; valor: React.ReactNode }> = ({ etiqueta, valor }) => (
  <div>
    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.09em] text-secondary">{etiqueta}</p>
    <p className="mt-0.5 font-display text-3xl font-semibold leading-none text-primary">{valor}</p>
  </div>
);

/**
 * Informe de avance de un niño para imprimir (reuniones con la familia).
 * Se arma con los mismos datos de la ficha; las orientaciones salen de ellos, y la docente decide qué hacer.
 */
export const InformeAlumno: React.FC<{ alumnoId: string }> = ({ alumnoId }) => {
  const navigate = useNavigate();
  const ficha = useFichaAlumno(alumnoId);
  const [conObservaciones, setConObservaciones] = useState(false);

  if (!ficha) return <p className="text-secondary font-semibold">Cargando informe…</p>;
  const { alumno } = ficha;
  const hoy = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  const diasActivos = ficha.actividadPorDia.filter((d) => d.valor > 0).length;
  const nota = alumno.notaDocente?.trim();

  // Orientaciones: frases cortas a partir de los datos, para que la docente las revise y adapte
  const orientaciones: string[] = [];
  if (ficha.sinAyuda !== null && ficha.sinAyuda < UMBRALES.porcentajeSinAyudaBajo) {
    orientaciones.push(
      ficha.palabrasDificiles.length > 0
        ? `Reforzar las palabras: ${ficha.palabrasDificiles.map((p) => p.palabra).join(', ')}. En los juegos necesita más ayuda de la esperada.`
        : 'Reforzar los juegos de los cuentos: necesita más ayuda de la esperada.',
    );
  } else if (ficha.sinAyuda !== null) {
    orientaciones.push('Resuelve la mayoría de los juegos sin ayuda: se puede avanzar al siguiente cuento o nivel.');
  }
  if (diasActivos <= UMBRALES.diasActivosMinimos) orientaciones.push('Usó la aplicación pocos días esta semana: conviene acordar con la familia un momento fijo de práctica.');
  if (ficha.tareas.some((t) => t.estado === 'vencida')) orientaciones.push('Tiene tareas vencidas: conversar con la familia y definir una nueva fecha.');
  if (orientaciones.length === 0) orientaciones.push('Avanza según lo esperado. Se sugiere mantener la práctica actual.');

  return (
    <>
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(`${ROUTES.profesorEstudiantes}?alumno=${alumnoId}`)}
          className="inline-flex items-center gap-1.5 min-h-10 text-sm font-semibold text-brand hover:text-brand-hover cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden /> Volver a la ficha
        </button>
        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-2 min-h-10 text-sm cursor-pointer">
            <input type="checkbox" checked={conObservaciones} onChange={(e) => setConObservaciones(e.target.checked)} className="w-4 h-4 accent-[var(--brand)]" />
            Incluir mis observaciones
          </label>
          <Button size="lg" onClick={() => window.print()}>
            <Printer className="w-5 h-5" aria-hidden /> Imprimir
          </Button>
        </div>
      </div>

      <article className="bg-surface border border-borderCustom rounded-card px-8 py-8 max-w-3xl w-full mx-auto flex flex-col gap-6 print:border-0 print:p-0 print:max-w-none">
        <header className="flex items-start justify-between gap-4 border-b-[3px] border-primary pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-secondary">Liceo Piedra Azul · Puerto Montt</p>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-primary leading-tight">Informe de avance</h1>
            <p className="mt-1 text-lg text-primary">
              <strong>{alumno.nombre} {alumno.apellido}</strong> · Kínder A
            </p>
          </div>
          <div className="text-right text-sm text-secondary">
            <p>{hoy}</p>
            <p>Leer para Todos</p>
            <p className="font-semibold">Datos de demostración</p>
          </div>
        </header>

        <section aria-label="Resumen" className="grid grid-cols-2 sm:grid-cols-4 gap-4 break-inside-avoid">
          <Dato etiqueta="Cuentos leídos" valor={<>{ficha.cuentosCompletados}<span className="text-lg text-secondary"> de {ficha.cuentosPublicados}</span></>} />
          <Dato etiqueta="Palabras escuchadas" valor={ficha.palabrasEscuchadas} />
          <Dato etiqueta="Días con actividad" valor={<>{diasActivos}<span className="text-lg text-secondary"> de 7</span></>} />
          <Dato etiqueta="Juegos sin ayuda" valor={ficha.sinAyuda === null ? '—' : `${ficha.sinAyuda} %`} />
        </section>

        <section className="break-inside-avoid">
          <Titulo>Progreso por nivel</Titulo>
          <ul className="flex flex-col gap-2.5">
            {ficha.niveles.map((n) => (
              <li key={n.id} className="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)_minmax(0,7rem)] items-center gap-3 text-sm">
                <span className="font-semibold text-primary">{n.etiqueta}</span>
                <span className="h-2.5 rounded-md bg-borderCustom overflow-hidden" aria-hidden>
                  <span className="block h-full bg-brand" style={{ width: `${n.porcentaje}%` }} />
                </span>
                <span className="text-right text-secondary">{n.total === 0 ? 'Sin contenido' : `${n.hechos} de ${n.total}`}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="break-inside-avoid">
          <Titulo>Juegos y actividades</Titulo>
          <ResultadosActividades resultados={ficha.resultados} palabras={ficha.palabrasDificiles} maximo={8} />
        </section>

        <section className="break-inside-avoid">
          <Titulo>Tareas</Titulo>
          <TareasDelAlumno tareas={ficha.tareas} />
        </section>

        <section className="break-inside-avoid">
          <Titulo>Orientaciones</Titulo>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 text-sm text-primary">
            {orientaciones.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-secondary">Generadas a partir de los datos del curso; la docente las revisa y decide.</p>
        </section>

        {conObservaciones && nota && (
          <section className="break-inside-avoid">
            <Titulo>Observaciones de la docente</Titulo>
            <p className="text-sm text-primary whitespace-pre-line">{nota}</p>
          </section>
        )}

        <footer className="mt-4 grid grid-cols-2 gap-10 pt-10 text-center text-sm text-secondary break-inside-avoid">
          <p className="border-t border-primary pt-1">Docente</p>
          <p className="border-t border-primary pt-1">Apoderado</p>
        </footer>
        <p className="text-[0.7rem] text-secondary text-center">
          Documento con datos de un menor de edad: entregar solo a su apoderado.
        </p>
      </article>
    </>
  );
};
