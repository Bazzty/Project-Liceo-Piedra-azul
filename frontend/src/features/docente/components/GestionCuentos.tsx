import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { actualizarCuento, eliminarCuento, useCuentos, useNiveles } from '@/api';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { CuentoForm } from '@/features/docente/components/CuentoForm';
import { EstadoCuento } from '@/features/docente/components/EstadoCuento';
import { EncabezadoPagina, Hoja } from '@/features/docente/components/Hoja';
import { NivelesPanel } from '@/features/docente/components/NivelesPanel';
import { PictoImg } from '@/features/docente/components/widgets';
import { formatearFecha } from '@/features/docente/components/format';
import { Button } from '@/shared/ui';
import type { Cuento } from '@/types';

type Filtro = 'todos' | Cuento['estado'];

const FILTROS: { id: Filtro; etiqueta: string }[] = [
  { id: 'todos', etiqueta: 'Todos' },
  { id: 'borrador', etiqueta: 'Borrador' },
  { id: 'en_revision', etiqueta: 'En revisión' },
  { id: 'publicado', etiqueta: 'Validado' },
];

const PRIORIDAD: Record<Cuento['estado'], number> = { en_revision: 0, borrador: 1, publicado: 2 };

const LISTA_REVISION = [
  'Los pictogramas corresponden al texto',
  'Escuché el audio y se entiende bien',
  'Lenguaje simple y apropiado para el nivel',
];

/** Un cuento enviado a revisión: el revisor lo aprueba o lo devuelve con un comentario. */
const TarjetaRevision: React.FC<{ cuento: Cuento; puedeRevisar: boolean; abierta: boolean; onAbrir: () => void }> = ({
  cuento,
  puedeRevisar,
  abierta,
  onAbrir,
}) => {
  const [marcas, setMarcas] = useState<boolean[]>(LISTA_REVISION.map(() => false));
  const [comentario, setComentario] = useState('');
  const primera = cuento.paginas[0]?.textoCompleto;

  if (!abierta) {
    return (
      <article className="flex items-center justify-between gap-3 rounded-control border border-borderCustom px-4 py-3">
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold text-primary truncate">{cuento.titulo}</p>
          <p className="text-xs text-secondary">{cuento.paginas.length} páginas · enviado {formatearFecha(cuento.fechaCambio ?? cuento.fechaCreacion)}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onAbrir}>
          Abrir
        </Button>
      </article>
    );
  }

  const resolver = async (aprobar: boolean) => {
    if (!cuento.id) return;
    await actualizarCuento(cuento.id, {
      estado: aprobar ? 'publicado' : 'borrador',
      comentarioRevision: aprobar ? undefined : comentario.trim() || 'Revisar y volver a enviar.',
      fechaCambio: new Date().toISOString(),
    });
  };

  return (
    <article className="flex flex-col gap-3 rounded-control border-2 border-brand px-4 py-4">
      <div>
        <p className="font-display text-xl font-semibold text-primary">{cuento.titulo}</p>
        <p className="text-xs text-secondary">
          Enviado por la docente · {formatearFecha(cuento.fechaCambio ?? cuento.fechaCreacion)} · {cuento.paginas.length}{' '}
          {cuento.paginas.length === 1 ? 'página' : 'páginas'}
        </p>
      </div>

      {primera && (
        <div className="rounded-control bg-app border border-borderCustom px-3 py-2.5 text-sm leading-relaxed">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.05em] text-secondary mb-1">Página 1</p>
          {primera}
        </div>
      )}

      <fieldset className="border-0 p-0 m-0 flex flex-col gap-1.5">
        <legend className="mb-1 text-xs font-semibold text-secondary">Lista de revisión</legend>
        {LISTA_REVISION.map((texto, i) => (
          <label key={texto} className="flex items-center gap-2.5 min-h-8 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={marcas[i]}
              disabled={!puedeRevisar}
              onChange={() => setMarcas(marcas.map((m, j) => (j === i ? !m : m)))}
              className="w-4 h-4 accent-[var(--brand-primary)]"
            />
            {texto}
          </label>
        ))}
      </fieldset>

      <label className="flex flex-col gap-1 text-xs font-semibold text-secondary">
        Comentario para la docente (opcional)
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          disabled={!puedeRevisar}
          rows={2}
          className="rounded-control border border-borderStrong bg-surface p-2.5 text-sm font-normal text-primary resize-none disabled:opacity-60"
        />
      </label>

      {puedeRevisar ? (
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={() => resolver(false)}>
            Devolver
          </Button>
          <Button fullWidth onClick={() => resolver(true)}>
            Aprobar
          </Button>
        </div>
      ) : (
        <p className="rounded-control bg-statusInfo-bg px-3 py-2 text-xs font-semibold text-statusInfo">
          Solo el revisor puede aprobar o devolver. Ingresa como Revisor para probarlo.
        </p>
      )}
    </article>
  );
};

/** Cuentos: tabla por estado y bandeja de revisión; los niveles se administran en la otra pestaña. */
export const GestionCuentos: React.FC = () => {
  const cuentos = useCuentos();
  const niveles = useNiveles();
  const puedeRevisar = useAuthStore((s) => s.user?.role === 'revisor');
  const [pestana, setPestana] = useState<'cuentos' | 'niveles'>('cuentos');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [formulario, setFormulario] = useState<'nuevo' | Cuento | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);

  if (!cuentos || !niveles) return <p className="text-secondary font-semibold">Cargando cuentos…</p>;

  const codigoNivel = (id: string) => niveles.find((n) => n.id === id)?.codigo ?? '–';
  const cuenta = (f: Filtro) => (f === 'todos' ? cuentos.length : cuentos.filter((c) => c.estado === f).length);
  const visibles = cuentos
    .filter((c) => filtro === 'todos' || c.estado === filtro)
    // Primero lo que espera revisión, luego borradores y al final lo validado (lo más reciente arriba)
    .sort(
      (a, b) =>
        PRIORIDAD[a.estado] - PRIORIDAD[b.estado] ||
        (b.fechaCambio ?? b.fechaCreacion).localeCompare(a.fechaCambio ?? a.fechaCreacion),
    );
  const enRevision = cuentos.filter((c) => c.estado === 'en_revision');
  const abiertoId = abierto ?? enRevision[0]?.id ?? null;

  const eliminar = async (c: Cuento) => {
    if (!c.id || !window.confirm(`¿Eliminar «${c.titulo}»? También se borrará el avance de los alumnos en este cuento.`)) return;
    await eliminarCuento(c.id);
  };

  return (
    <>
      <EncabezadoPagina
        etiqueta="Contenidos"
        titulo="Cuentos"
        descripcion="Crea, edita y envía a revisión. Un cuento llega a los niños solo cuando está validado."
        acciones={
          pestana === 'cuentos' && !formulario ? (
            <Button size="lg" onClick={() => setFormulario('nuevo')}>
              <Plus className="w-5 h-5" aria-hidden /> Nuevo cuento
            </Button>
          ) : undefined
        }
      />

      <div role="tablist" aria-label="Sección de contenidos" className="flex gap-2 border-b border-borderCustom">
        {(['cuentos', 'niveles'] as const).map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={pestana === p}
            onClick={() => setPestana(p)}
            className={`min-h-12 px-4 -mb-px text-sm font-semibold cursor-pointer border-b-[3px] ${
              pestana === p ? 'border-brand text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            {p === 'cuentos' ? 'Cuentos y revisión' : 'Niveles'}
          </button>
        ))}
      </div>

      {pestana === 'niveles' && (
        <Hoja className="p-6">
          <NivelesPanel />
        </Hoja>
      )}

      {pestana === 'cuentos' && formulario && (
        <Hoja className="p-5">
          <CuentoForm
            key={formulario === 'nuevo' ? 'nuevo' : formulario.id}
            cuento={formulario === 'nuevo' ? undefined : formulario}
            onGuardado={() => setFormulario(null)}
            onCancelar={() => setFormulario(null)}
          />
        </Hoja>
      )}

      {pestana === 'cuentos' && !formulario && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <Hoja className="overflow-x-auto">
            <div role="tablist" aria-label="Filtrar por estado" className="flex flex-wrap gap-1.5 mb-3">
              {FILTROS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={filtro === f.id}
                  onClick={() => setFiltro(f.id)}
                  className={`min-h-10 px-3.5 rounded-control text-sm font-semibold cursor-pointer border ${
                    filtro === f.id ? 'bg-brand text-onBrand border-brand' : 'bg-surface text-primary border-borderStrong hover:border-brand'
                  }`}
                >
                  {f.etiqueta} · {cuenta(f.id)}
                </button>
              ))}
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-secondary">
                  <th className="py-2 pr-3 font-semibold">Título</th>
                  <th className="py-2 pr-3 font-semibold">Nivel</th>
                  <th className="py-2 pr-3 font-semibold">Páginas</th>
                  <th className="py-2 pr-3 font-semibold">Estado</th>
                  <th className="py-2 pr-3 font-semibold">Cambio</th>
                  <th className="py-2 font-semibold">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((c) => (
                  <tr key={c.id} className={`border-t border-borderCustom ${c.id === abiertoId && c.estado === 'en_revision' ? 'bg-brand/5' : ''}`}>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <PictoImg src={c.portadaUrl} alt="" className="w-10 h-10" />
                        <div className="min-w-0">
                          <p className="font-display text-lg font-semibold text-primary leading-tight">{c.titulo}</p>
                          {c.comentarioRevision && (
                            <p className="text-xs text-statusWarn">Devuelto: {c.comentarioRevision}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-sm font-semibold">{codigoNivel(c.nivelId)}</td>
                    <td className="py-3 pr-3 text-sm">{c.paginas.length}</td>
                    <td className="py-3 pr-3">
                      <EstadoCuento estado={c.estado} />
                    </td>
                    <td className="py-3 pr-3 text-xs text-secondary whitespace-nowrap">{formatearFecha(c.fechaCambio ?? c.fechaCreacion)}</td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setFormulario(c)}
                          aria-label={`Editar ${c.titulo}`}
                          className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-control border border-borderStrong text-primary cursor-pointer hover:border-brand"
                        >
                          <Pencil className="w-4 h-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminar(c)}
                          aria-label={`Eliminar ${c.titulo}`}
                          className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-control border border-borderStrong text-statusDanger cursor-pointer hover:border-statusDanger"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibles.length === 0 && <p className="py-6 text-sm text-secondary">No hay cuentos en este estado.</p>}
            <p className="mt-3 text-xs leading-relaxed text-secondary">
              El audio de cada página se genera con la voz del proyecto al guardar el cuento; mientras tanto la app usa la voz del navegador.
            </p>
          </Hoja>

          <Hoja aria-label="Bandeja de revisión" className="flex flex-col gap-3 self-start">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-primary">Bandeja de revisión</h2>
              <span className="px-2.5 py-0.5 rounded-sm bg-statusWarn text-onStatus text-xs font-bold">{enRevision.length}</span>
            </div>
            {enRevision.length === 0 ? (
              <p className="text-sm text-secondary">No hay cuentos esperando revisión.</p>
            ) : (
              enRevision.map((c) => (
                <TarjetaRevision key={c.id} cuento={c} puedeRevisar={puedeRevisar} abierta={c.id === abiertoId} onAbrir={() => setAbierto(c.id ?? null)} />
              ))
            )}
          </Hoja>
        </div>
      )}
    </>
  );
};
