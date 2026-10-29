import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Eye, Palette, Printer, Volume2 } from 'lucide-react';
import { actualizarAlumno } from '@/api';
import { ROUTES } from '@/app/routes';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { useTarjetasStore } from '@/features/acceso/useTarjetasStore';
import { ApoyosAlumno } from '@/features/docente/components/ApoyosAlumno';
import { BarrasPorDia } from '@/features/docente/components/BarrasPorDia';
import { ResultadosActividades, TareasDelAlumno } from '@/features/docente/components/BloquesActividad';
import { GraficoEvolucion } from '@/features/docente/components/GraficoEvolucion';
import { EncabezadoPagina, Hoja } from '@/features/docente/components/Hoja';
import { LibroDelCurso } from '@/features/docente/components/LibroDelCurso';
import { formatearFecha } from '@/features/docente/components/format';
import { useFichaAlumno } from '@/features/docente/components/useFichaAlumno';
import { useLibroCurso } from '@/features/docente/components/useLibroCurso';
import { THEMES_CONFIG } from '@/shared/config/themes';
import { VOCES_CONFIG, VOZ_POR_DEFECTO } from '@/shared/config/voces';
import { Button, OptionButton } from '@/shared/ui';
import type { VozId } from '@/types';

const Dato: React.FC<{ etiqueta: string; valor: React.ReactNode; nota?: string }> = ({ etiqueta, valor, nota }) => (
  <div className="px-5 py-3.5">
    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-secondary">{etiqueta}</p>
    <p className="mt-1 font-display text-4xl font-semibold leading-none text-primary">{valor}</p>
    {nota && <p className="mt-1 text-xs text-secondary">{nota}</p>}
  </div>
);

/** Ficha de un estudiante: avance por nivel, actividad, sesiones, observaciones y preferencias. */
const FichaAlumno: React.FC<{ alumnoId: string; onVolver: () => void }> = ({ alumnoId, onVolver }) => {
  const navigate = useNavigate();
  const ficha = useFichaAlumno(alumnoId);
  const iniciarSupervision = useAuthStore((s) => s.iniciarSupervision);
  const regenerar = useTarjetasStore((s) => s.regenerar);
  const [nota, setNota] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  // Texto de la nota: lo que escribe la docente o, si no ha escrito, lo guardado
  const notaGuardada = ficha?.alumno.notaDocente ?? '';

  if (!ficha) return <p className="text-secondary font-semibold">Cargando ficha…</p>;
  const { alumno } = ficha;
  const vozActual = VOCES_CONFIG.find((v) => v.id === alumno.vozId)?.id ?? VOZ_POR_DEFECTO;

  const entrarComoNino = () => {
    iniciarSupervision(alumnoId);
    navigate(ROUTES.menu);
  };

  const regenerarCodigo = () => {
    if (window.confirm(`Se creará un código nuevo para ${alumno.nombre}. El anterior dejará de funcionar. ¿Continuar?`)) {
      regenerar(alumnoId);
    }
  };

  const guardarNota = async () => {
    await actualizarAlumno(alumnoId, { notaDocente: nota ?? notaGuardada });
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  };

  return (
    <>
      <nav aria-label="Ruta" className="text-sm text-secondary">
        <button type="button" onClick={onVolver} className="inline-flex items-center gap-1.5 min-h-10 font-semibold text-brand hover:text-brand-hover cursor-pointer">
          <ArrowLeft className="w-4 h-4" aria-hidden /> Estudiantes
        </button>{' '}
        / <span className="font-semibold text-primary">{alumno.nombre}</span>
      </nav>

      <header className="flex flex-wrap items-center gap-4">
        <span
          className="w-16 h-16 rounded-full bg-brand/15 border-2 border-brand text-brand font-display text-3xl font-semibold flex items-center justify-center"
          aria-hidden
        >
          {alumno.nombre.charAt(0).toUpperCase()}
        </span>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-primary leading-tight">
            {alumno.nombre} {alumno.apellido}
          </h1>
          <p className="text-sm text-secondary">
            Kínder A · Última sesión: {ficha.ultimoAcceso ? formatearFecha(ficha.ultimoAcceso) : 'sin actividad'}
          </p>
        </div>
        <Button variant="secondary" size="lg" onClick={() => navigate(ROUTES.profesorInforme(alumnoId))}>
          <Printer className="w-5 h-5" aria-hidden /> Informe imprimible
        </Button>
        <Button variant="secondary" size="lg" onClick={() => navigate(`${ROUTES.profesorActividades}?alumno=${alumnoId}`)}>
          <ClipboardList className="w-5 h-5" aria-hidden /> Asignar tarea
        </Button>
        <Button variant="secondary" size="lg" onClick={regenerarCodigo}>
          Regenerar código
        </Button>
        <Button size="lg" onClick={entrarComoNino}>
          <Eye className="w-5 h-5" aria-hidden /> Entrar como este niño
        </Button>
      </header>

      <p className="rounded-control border border-statusInfo bg-statusInfo-bg px-4 py-3 text-sm leading-relaxed text-statusInfo">
        Al <strong>entrar como este niño</strong> verás su pantalla con un aviso visible de modo supervisión, para acompañar su sesión. Lo que hagas ahí
        no se cuenta como actividad del niño.
      </p>

      <Hoja padding={false} aria-label="Indicadores" className="grid grid-cols-2 lg:grid-cols-4 lg:divide-x divide-borderCustom">
        <Dato
          etiqueta="Cuentos leídos"
          valor={
            <>
              {ficha.cuentosCompletados}
              <span className="text-xl text-secondary"> de {ficha.cuentosPublicados}</span>
            </>
          }
        />
        <Dato etiqueta="Palabras escuchadas" valor={ficha.palabrasEscuchadas} />
        <Dato etiqueta="Sesiones esta semana" valor={ficha.sesionesSemana} />
        <Dato etiqueta="Momentos de calma" valor={ficha.calmaSemana} nota="en los últimos 7 días" />
      </Hoja>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5 min-w-0">
          <Hoja>
            <h2 className="font-display text-2xl font-semibold text-primary">Progreso por nivel</h2>
            <ul className="mt-3 flex flex-col gap-3.5">
              {ficha.niveles.map((n) => (
                <li key={n.id} className="grid grid-cols-[minmax(0,10.5rem)_minmax(0,1fr)_minmax(0,9rem)] items-center gap-3.5">
                  <span className={`text-sm font-semibold ${n.total === 0 ? 'text-secondary' : 'text-primary'}`}>{n.etiqueta}</span>
                  {n.total === 0 ? (
                    <span className="h-3 rounded-md bg-app border border-dashed border-borderStrong" aria-hidden />
                  ) : (
                    <span
                      role="progressbar"
                      aria-label={`Progreso en ${n.etiqueta}`}
                      aria-valuenow={n.porcentaje}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-3 rounded-md bg-borderCustom overflow-hidden"
                    >
                      <span className="block h-full bg-brand" style={{ width: `${n.porcentaje}%` }} />
                    </span>
                  )}
                  <span className="text-right text-sm text-secondary">
                    {n.total === 0 ? 'Sin contenido aún' : (
                      <>
                        <strong className="text-primary">{n.porcentaje} %</strong> · {n.hechos} de {n.total}
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Hoja>

          <Hoja>
            <h2 className="font-display text-2xl font-semibold text-primary">Su evolución</h2>
            <p className="text-xs text-secondary">Comparado consigo mismo, no con el curso</p>
            <div className="mt-3">
              <GraficoEvolucion evolucion={ficha.evolucion} />
            </div>
          </Hoja>

          <Hoja>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold text-primary">Juegos y actividades</h2>
              {ficha.sinAyuda !== null && (
                <p className="text-xs text-secondary">
                  Últimas sesiones: <strong className="text-primary">{ficha.sinAyuda} % sin ayuda</strong>
                </p>
              )}
            </div>
            <div className="mt-3">
              <ResultadosActividades resultados={ficha.resultados} palabras={ficha.palabrasDificiles} />
            </div>
          </Hoja>

          <Hoja>
            <h2 className="font-display text-2xl font-semibold text-primary">Actividad por día</h2>
            <p className="text-xs text-secondary">Lecturas y sesiones de los últimos 7 días</p>
            <BarrasPorDia datos={ficha.actividadPorDia} titulo="Actividad por día" />
          </Hoja>
        </div>

        <div className="flex flex-col gap-5 min-w-0">
          <Hoja>
            <h2 className="font-display text-2xl font-semibold text-primary">Tareas</h2>
            <div className="mt-3">
              <TareasDelAlumno tareas={ficha.tareas} />
            </div>
          </Hoja>

          <Hoja>
            <h2 className="font-display text-2xl font-semibold text-primary">Sesiones recientes</h2>
            {ficha.recientes.length === 0 ? (
              <p className="mt-2 text-sm text-secondary">Aún no hay actividad registrada.</p>
            ) : (
              <ol className="mt-3 flex flex-col gap-3.5">
                {ficha.recientes.map((r) => (
                  <li key={r.id} className="grid grid-cols-[0.9rem_minmax(0,1fr)] gap-3">
                    <span className="w-2.5 h-2.5 mt-1.5 rounded-full bg-brand" aria-hidden />
                    <div>
                      <p className="text-xs text-secondary">
                        {formatearFecha(r.fecha)} · {r.lugar === 'liceo' ? 'Liceo' : 'Casa'}
                      </p>
                      <p className="text-sm text-primary">{r.detalle}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Hoja>

          <Hoja className="flex flex-col gap-2">
            <h2 className="font-display text-2xl font-semibold text-primary">
              <label htmlFor="nota-docente">Observaciones de la docente</label>
            </h2>
            <p className="text-xs text-secondary">Visible solo para docentes y revisores.</p>
            <textarea
              id="nota-docente"
              value={nota ?? notaGuardada}
              onChange={(e) => setNota(e.target.value)}
              rows={4}
              className="w-full rounded-control border border-borderStrong bg-surface p-3 text-sm text-primary resize-none"
            />
            <div className="flex items-center justify-end gap-3">
              {guardado && <span role="status" className="text-sm font-semibold text-statusOk">✓ Nota guardada</span>}
              <Button variant="secondary" size="sm" onClick={guardarNota}>
                Guardar nota
              </Button>
            </div>
          </Hoja>
        </div>
      </div>

      <ApoyosAlumno alumno={alumno} />

      <Hoja aria-label="Preferencias del niño" className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-2xl font-semibold text-primary inline-flex items-center gap-2">
            <Palette className="w-5 h-5 text-brand" aria-hidden /> Color del niño
          </h2>
          <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Color del niño">
            {THEMES_CONFIG.map((t) => (
              <OptionButton
                key={t.id}
                selected={alumno.temaId === t.id}
                onClick={() => actualizarAlumno(alumnoId, { temaId: t.id })}
                className="flex items-center gap-2 px-3 py-2 font-semibold text-sm"
              >
                <span className="w-5 h-5 rounded-full border-2 border-borderStrong" style={{ backgroundColor: t.colorPreviewHex }} aria-hidden />
                {t.nombre}
              </OptionButton>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-2xl font-semibold text-primary inline-flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-brand" aria-hidden /> Voz del niño
          </h2>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Voz del niño">
            {VOCES_CONFIG.map((v) => (
              <OptionButton
                key={v.id}
                selected={vozActual === v.id}
                onClick={() => actualizarAlumno(alumnoId, { vozId: v.id as VozId })}
                className="text-left px-3 py-2"
              >
                <span className="block text-sm font-bold text-primary">{v.nombre}</span>
                <span className="block text-xs text-secondary">{v.descripcion}</span>
              </OptionButton>
            ))}
          </div>
        </div>
      </Hoja>
    </>
  );
};

/** Estudiantes: lista tipo libro del curso y, al abrir uno, su ficha (la URL guarda cuál: ?alumno=id). */
export const AlumnosPanel: React.FC = () => {
  const libro = useLibroCurso();
  const [params, setParams] = useSearchParams();
  const seleccionado = params.get('alumno');

  if (seleccionado) {
    return <FichaAlumno key={seleccionado} alumnoId={seleccionado} onVolver={() => setParams({})} />;
  }

  return (
    <>
      <EncabezadoPagina
        etiqueta="Kínder A"
        titulo="Estudiantes"
        descripcion="Abre la ficha de cada niño para ver su avance, acompañar su sesión o cambiar su color y voz."
      />
      {libro ? <LibroDelCurso filas={libro.filas} titulo="Estudiantes del curso" /> : <p className="text-secondary font-semibold">Cargando estudiantes…</p>}
    </>
  );
};
