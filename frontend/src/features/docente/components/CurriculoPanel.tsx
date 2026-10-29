import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAlumnos, useCuentos, useProgresos } from '@/api';
import { EncabezadoPagina, Hoja } from '@/features/docente/components/Hoja';
import { EJES_CURRICULARES, NOMBRE_JUEGO } from '@/shared/config/curriculo';
import { NIVELES_CAMINO } from '@/shared/config/niveles';

/** Cobertura curricular: qué objetivos de Lenguaje Verbal trabaja cada nivel y cuánto del curso ya lo recorrió. */
export const CurriculoPanel: React.FC = () => {
  const alumnos = useAlumnos();
  const cuentos = useCuentos();
  const progresos = useProgresos();
  if (!alumnos || !cuentos || !progresos) return <p className="text-secondary font-semibold">Cargando…</p>;

  const publicados = cuentos.filter((c) => c.estado === 'publicado');
  const completados = new Set(progresos.filter((p) => p.completado).map((p) => `${p.alumnoId}|${p.cuentoId}`));

  return (
    <>
      <EncabezadoPagina
        etiqueta="Kínder A · Lenguaje Verbal"
        titulo="Cobertura curricular"
        descripcion="Qué objetivos de aprendizaje trabaja cada parte de la aplicación y cuánto del curso ya la ha recorrido."
      />

      <p className="flex items-start gap-2 rounded-control border border-statusWarn bg-statusWarn-bg px-4 py-3 text-sm leading-relaxed text-statusWarn">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
        <span>
          <strong>Propuesta por verificar.</strong> Solo el texto del OA 3 está comprobado con una fuente oficial. El resto son descripciones del eje con
          nuestras palabras: el equipo del PIE debe confirmarlas y ponerles su número de OA según las Bases Curriculares de la Educación Parvularia
          (curriculumnacional.cl).
        </span>
      </p>

      <ul className="flex flex-col gap-5">
        {EJES_CURRICULARES.map((eje) => {
          const delEje = publicados.filter((c) => eje.niveles.includes(c.nivelId));
          const posibles = delEje.length * alumnos.length;
          const hechos = delEje.reduce((t, c) => t + alumnos.filter((a) => completados.has(`${a.id}|${c.id}`)).length, 0);
          const porcentaje = posibles > 0 ? Math.round((hechos / posibles) * 100) : 0;
          return (
            <li key={eje.id}>
              <Hoja>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-secondary">
                      {eje.oa ? `${eje.oa} · Lenguaje Verbal` : 'Lenguaje Verbal · número de OA por confirmar'}
                    </p>
                    <h2 className="font-display text-2xl font-semibold text-primary">{eje.eje}</h2>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-0.5 text-xs font-semibold ${eje.verificado ? 'bg-statusOk-bg text-statusOk' : 'bg-statusWarn-bg text-statusWarn'}`}
                  >
                    {eje.verificado ? <CheckCircle2 className="w-4 h-4" aria-hidden /> : <AlertTriangle className="w-4 h-4" aria-hidden />}
                    {eje.verificado ? 'Texto oficial' : 'Por verificar'}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-primary">{eje.texto}</p>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-secondary">Dónde se trabaja</p>
                    <ul className="mt-1.5 flex flex-wrap gap-2">
                      {eje.niveles.map((id) => {
                        const nivel = NIVELES_CAMINO.find((n) => n.id === id);
                        const cantidad = publicados.filter((c) => c.nivelId === id).length;
                        return (
                          <li key={id} className="rounded-sm bg-app border border-borderCustom px-2.5 py-1 text-sm font-semibold text-primary">
                            Nivel {nivel?.letra} · {nivel?.nombre} <span className="font-normal text-secondary">({cantidad})</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-secondary">Juegos</p>
                    <ul className="mt-1.5 flex flex-wrap gap-2">
                      {eje.juegos.map((j) => (
                        <li key={j} className="rounded-sm bg-brand/10 px-2.5 py-1 text-sm font-semibold text-brand">
                          {NOMBRE_JUEGO[j]}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-secondary">Avance del curso</p>
                    <span
                      role="progressbar"
                      aria-label={`${porcentaje} % del curso ha recorrido ${eje.eje}`}
                      aria-valuenow={porcentaje}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="mt-2.5 block h-3 rounded-md bg-borderCustom overflow-hidden"
                    >
                      <span className="block h-full bg-brand" style={{ width: `${porcentaje}%` }} />
                    </span>
                    <p className="mt-1 text-sm text-secondary">
                      <strong className="text-primary">{porcentaje} %</strong> · {hechos} de {posibles} lecturas
                    </p>
                  </div>
                </div>
              </Hoja>
            </li>
          );
        })}
      </ul>
    </>
  );
};
