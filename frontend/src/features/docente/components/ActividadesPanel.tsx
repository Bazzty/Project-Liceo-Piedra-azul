import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardList, Trash2 } from 'lucide-react';
import { useAlumnos, useCuentos, useRegistros } from '@/api';
import { EtiquetaTarea } from '@/features/docente/components/BloquesActividad';
import { EncabezadoPagina, Hoja } from '@/features/docente/components/Hoja';
import { palabrasDificiles, resultadosDeRegistros } from '@/features/docente/components/resultados';
import { destinatarios, estadoTarea, formatearLimite, resultadoDeTarea } from '@/features/tareas/estadoTarea';
import { useAsignacionesStore } from '@/features/tareas/useAsignacionesStore';
import { Button } from '@/shared/ui';
import type { Cuento } from '@/types';

const CAMPO = 'w-full min-h-12 rounded-control border border-borderStrong bg-surface px-3 text-sm text-primary';

const palabrasDe = (c: Cuento) => new Set(c.paginas.flatMap((p) => p.palabras.map((w) => w.texto.toLowerCase())));

/** Actividades: dejar un cuento con sus juegos como tarea, ver cómo va cada niño y qué palabras cuestan más. */
export const ActividadesPanel: React.FC = () => {
  const alumnos = useAlumnos();
  const cuentos = useCuentos();
  const registros = useRegistros();
  const { asignaciones, asignar, quitar } = useAsignacionesStore();
  const [params] = useSearchParams();
  const refuerzoDe = params.get('alumno');

  const publicados = useMemo(() => (cuentos ?? []).filter((c) => c.estado === 'publicado'), [cuentos]);

  // Si viene de «Asignar refuerzo», se sugieren los cuentos que traen las palabras que le cuestan
  const sugeridos = useMemo(() => {
    if (!refuerzoDe || !registros || !cuentos) return { palabras: [] as string[], cuentos: new Map<string, string[]>() };
    const palabras = palabrasDificiles(resultadosDeRegistros(registros.filter((r) => r.alumnoId === refuerzoDe), cuentos), 6).map((d) => d.palabra.toLowerCase());
    const mapa = new Map<string, string[]>();
    publicados.forEach((c) => {
      const propias = palabrasDe(c);
      const coinciden = palabras.filter((p) => propias.has(p));
      if (c.id && coinciden.length > 0) mapa.set(c.id, coinciden);
    });
    return { palabras, cuentos: mapa };
  }, [refuerzoDe, registros, cuentos, publicados]);

  const [cuentoElegido, setCuentoElegido] = useState<string | null>(null);
  const [destino, setDestino] = useState<'todos' | 'algunos'>(refuerzoDe ? 'algunos' : 'todos');
  const [seleccion, setSeleccion] = useState<string[]>(refuerzoDe ? [refuerzoDe] : []);
  const [limite, setLimite] = useState('');
  const [nota, setNota] = useState('');
  const [aviso, setAviso] = useState('');

  // Por defecto, el cuento que más palabras difíciles incluye
  const masAdecuado = [...sugeridos.cuentos.entries()].sort((a, b) => b[1].length - a[1].length)[0]?.[0];
  const cuentoId = cuentoElegido ?? masAdecuado ?? publicados[0]?.id ?? '';
  const todosLosIds = (alumnos ?? []).map((a) => a.id ?? '').filter(Boolean);
  const nombreDe = (id: string) => alumnos?.find((a) => a.id === id)?.nombre ?? 'Estudiante';

  const dificultadCurso = useMemo(
    () => (registros && cuentos ? palabrasDificiles(resultadosDeRegistros(registros, cuentos), 8) : []),
    [registros, cuentos],
  );

  const puedeAsignar = !!cuentoId && (destino === 'todos' || seleccion.length > 0);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeAsignar) return;
    asignar({
      cuentoId,
      alumnos: destino === 'todos' ? 'todos' : seleccion,
      ...(limite ? { limite } : {}),
      ...(nota.trim() ? { nota: nota.trim() } : {}),
    });
    setNota('');
    setAviso(destino === 'todos' ? 'Tarea asignada a todo el curso.' : `Tarea asignada a ${seleccion.length} ${seleccion.length === 1 ? 'estudiante' : 'estudiantes'}.`);
    setTimeout(() => setAviso(''), 3500);
  };

  const alternar = (id: string) => setSeleccion((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  if (!alumnos || !cuentos || !registros) return <p className="text-secondary font-semibold">Cargando actividades…</p>;

  return (
    <>
      <EncabezadoPagina
        etiqueta="Kínder A"
        titulo="Actividades"
        descripcion="Deja un cuento con sus juegos como tarea para todo el curso o para algunos niños, y mira quién la hizo y cómo le fue."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Hoja>
          <h2 className="font-display text-2xl font-semibold text-primary">Asignar tarea</h2>
          {refuerzoDe && (
            <p className="mt-2 rounded-control border border-statusInfo bg-statusInfo-bg px-3 py-2 text-sm text-statusInfo">
              Refuerzo para <strong>{nombreDe(refuerzoDe)}</strong>.{' '}
              {sugeridos.palabras.length > 0
                ? `Le cuestan: ${sugeridos.palabras.join(', ')}. ${sugeridos.cuentos.size > 0 ? 'Los cuentos marcados con ★ las incluyen.' : ''}`
                : 'Aún no hay palabras que le cuesten registradas.'}
            </p>
          )}
          <form onSubmit={enviar} className="mt-3 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="tarea-cuento" className="text-sm font-semibold text-primary">Cuento y juegos</label>
              <select id="tarea-cuento" value={cuentoId} onChange={(e) => setCuentoElegido(e.target.value)} className={CAMPO}>
                {publicados.map((c) => (
                  <option key={c.id} value={c.id}>
                    {sugeridos.cuentos.has(c.id ?? '') ? '★ ' : ''}
                    {c.titulo} · Nivel {c.nivelId.replace('nivel-', '').toUpperCase()}
                    {sugeridos.cuentos.has(c.id ?? '') ? ` · incluye: ${sugeridos.cuentos.get(c.id ?? '')?.join(', ')}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-semibold text-primary">¿Para quién?</legend>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 min-h-10 text-sm cursor-pointer">
                  <input type="radio" name="destino" checked={destino === 'todos'} onChange={() => setDestino('todos')} className="w-4 h-4 accent-[var(--brand)]" />
                  Todo el curso
                </label>
                <label className="inline-flex items-center gap-2 min-h-10 text-sm cursor-pointer">
                  <input type="radio" name="destino" checked={destino === 'algunos'} onChange={() => setDestino('algunos')} className="w-4 h-4 accent-[var(--brand)]" />
                  Algunos estudiantes
                </label>
              </div>
              {destino === 'algunos' && (
                <ul className="flex flex-wrap gap-2" aria-label="Estudiantes">
                  {alumnos.map((a) => {
                    const activo = a.id ? seleccion.includes(a.id) : false;
                    return (
                      <li key={a.id}>
                        <label className={`inline-flex items-center gap-2 min-h-10 rounded-control border px-3 text-sm font-semibold cursor-pointer ${activo ? 'border-brand bg-brand/10 text-brand' : 'border-borderStrong text-primary'}`}>
                          <input type="checkbox" checked={activo} onChange={() => a.id && alternar(a.id)} className="w-4 h-4 accent-[var(--brand)]" />
                          {a.nombre}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tarea-limite" className="text-sm font-semibold text-primary">Para el día (opcional)</label>
                <input id="tarea-limite" type="date" value={limite} onChange={(e) => setLimite(e.target.value)} className={CAMPO} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tarea-nota" className="text-sm font-semibold text-primary">Nota (opcional)</label>
                <input id="tarea-nota" value={nota} onChange={(e) => setNota(e.target.value)} maxLength={80} placeholder="Ej.: Refuerzo de vocales" className={CAMPO} />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              {aviso && <span role="status" className="text-sm font-semibold text-statusOk">✓ {aviso}</span>}
              <Button type="submit" size="lg" disabled={!puedeAsignar}>
                <ClipboardList className="w-5 h-5" aria-hidden /> Asignar tarea
              </Button>
            </div>
          </form>
        </Hoja>

        <Hoja>
          <h2 className="font-display text-2xl font-semibold text-primary">Lo que más cuesta al curso</h2>
          <p className="text-xs text-secondary">Palabras en las que los niños pidieron ayuda en los juegos</p>
          {dificultadCurso.length === 0 ? (
            <p className="mt-3 text-sm text-secondary">Todavía no hay datos de juegos.</p>
          ) : (
            <ol className="mt-3 flex flex-col gap-2">
              {dificultadCurso.map((p, i) => (
                <li key={p.palabra} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3">
                  <span className="font-display text-xl font-semibold text-secondary">{i + 1}</span>
                  <span className="text-base font-bold text-primary">{p.palabra}</span>
                  <span className="text-sm text-secondary">{p.veces} {p.veces === 1 ? 'vez' : 'veces'}</span>
                </li>
              ))}
            </ol>
          )}
        </Hoja>
      </div>

      <Hoja aria-label="Tareas asignadas">
        <h2 className="font-display text-2xl font-semibold text-primary">Tareas asignadas</h2>
        {asignaciones.length === 0 ? (
          <p className="mt-3 text-sm text-secondary">Aún no has asignado tareas.</p>
        ) : (
          <ul className="mt-2 flex flex-col">
            {asignaciones.map((a) => {
              const titulo = cuentos.find((c) => c.id === a.cuentoId)?.titulo ?? 'Cuento';
              const ids = destinatarios(a, todosLosIds);
              const filas = ids.map((id) => ({ id, estado: estadoTarea(a, id, registros), resultado: resultadoDeTarea(a, id, registros) }));
              const hechas = filas.filter((f) => f.estado === 'hecha').length;
              const porcentaje = ids.length > 0 ? Math.round((hechas / ids.length) * 100) : 0;
              return (
                <li key={a.id} className="border-t border-borderCustom py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-xl font-semibold text-primary">{titulo}</p>
                      <p className="text-sm text-secondary">
                        {a.alumnos === 'todos' ? 'Todo el curso' : ids.map(nombreDe).join(', ')}
                        {a.limite ? ` · Para el ${formatearLimite(a.limite)}` : ' · Sin fecha límite'}
                        {a.nota ? ` · ${a.nota}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-primary">{hechas} de {ids.length} hechas</p>
                      <button
                        type="button"
                        onClick={() => window.confirm(`¿Quitar la tarea «${titulo}»? Los niños ya no la verán.`) && quitar(a.id)}
                        aria-label={`Quitar la tarea ${titulo}`}
                        className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-control text-secondary hover:text-statusDanger hover:bg-statusDanger-bg cursor-pointer"
                      >
                        <Trash2 className="w-5 h-5" aria-hidden />
                      </button>
                    </div>
                  </div>
                  <span role="progressbar" aria-label={`${porcentaje} % de la tarea ${titulo} hecha`} aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100} className="mt-2 block h-2.5 rounded-md bg-borderCustom overflow-hidden">
                    <span className="block h-full bg-brand" style={{ width: `${porcentaje}%` }} />
                  </span>
                  <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2" aria-label="Estado por estudiante">
                    {filas.map((f) => (
                      <li key={f.id} className="inline-flex items-center gap-2 text-sm">
                        <span className="font-semibold text-primary">{nombreDe(f.id)}</span>
                        <EtiquetaTarea estado={f.estado} />
                        {f.resultado && f.resultado.total ? (
                          <span className="text-xs text-secondary">{f.resultado.aciertos} de {f.resultado.total}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </Hoja>
    </>
  );
};
