import React from 'react';
import { Copy, Palette, Pencil, Plus, RotateCcw, Trash2, Undo2, Users, Volume2 } from 'lucide-react';
import { ID_PLANTILLA_GENERAL } from '@/features/tablero/plantillaGeneral';
import type { Destino } from '@/features/tablero/gestionTableros';
import { Button } from '@/shared/ui';
import type { Alumno, Tablero } from '@/types';

const claveDestino = (d: Destino) => (d.tipo === 'plantilla' ? `plantilla:${d.id}` : `alumno:${d.alumnoId}`);

interface Props {
  destino: Destino;
  plantillas: Tablero[];
  alumnos: Alumno[];
  nombreAlumno: string;
  copiaPropia: boolean;
  hayDeshacer: boolean;
  alCambiarDestino: (clave: string) => void;
  alNuevaPlantilla: () => void;
  alRenombrar: () => void;
  alAsignar: () => void;
  alEliminar: () => void;
  alRestablecerFabrica: () => void;
  alGuardarComoPlantilla: () => void;
  alRestablecerNino: () => void;
  alCategorias: () => void;
  alDeshacer: () => void;
  /** Cuántas palabras y carpetas de este tablero aún no tienen audio con la voz del proyecto. */
  faltanAudios: number;
  generandoAudios: boolean;
  alGenerarAudios: () => void;
}

/** Elegir qué tablero se edita y las acciones sobre plantillas, niños y categorías. */
export const BarraDeTableros: React.FC<Props> = (p) => {
  const esPlantilla = p.destino.tipo === 'plantilla';
  const esGeneral = p.destino.tipo === 'plantilla' && p.destino.id === ID_PLANTILLA_GENERAL;

  const explicacion = esGeneral
    ? 'Los cambios a la plantilla general los reciben los niños que aún no tienen tablero propio.'
    : esPlantilla
      ? 'Los niños que ya recibieron esta plantilla tienen su propia copia: lo que cambies aquí no se las modifica.'
      : p.copiaPropia
        ? `${p.nombreAlumno} tiene su propio tablero: lo que cambies aquí solo lo ve él o ella.`
        : `${p.nombreAlumno} usa la plantilla general. Al hacer el primer cambio se le crea su propio tablero.`;

  return (
    <section aria-label="Qué tablero editar" className="bg-surface border border-borderCustom rounded-card px-5 py-4 flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1 min-w-0 grow sm:grow-0">
          <label htmlFor="destino-tablero" className="text-sm font-semibold text-primary">
            ¿Qué tablero quieres editar?
          </label>
          <select id="destino-tablero" value={claveDestino(p.destino)} onChange={(e) => p.alCambiarDestino(e.target.value)} className="min-h-12 rounded-control border border-borderStrong bg-surface px-3 text-base text-primary sm:min-w-72">
            <optgroup label="Plantillas">
              {p.plantillas.map((t) => (
                <option key={t.id} value={`plantilla:${t.id}`}>
                  {t.id === ID_PLANTILLA_GENERAL ? `${t.nombre} (la que trae la app)` : t.nombre}
                </option>
              ))}
            </optgroup>
            <optgroup label="Tablero de cada niño">
              {p.alumnos.map((a) => (
                <option key={a.id} value={`alumno:${a.id}`}>
                  {`${a.nombre} ${a.apellido}`.trim()}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <p className="text-sm text-secondary grow min-w-60">{explicacion}</p>
      </div>

      <div role="group" aria-label="Acciones sobre el tablero" className="flex flex-wrap gap-2">
        {esPlantilla && (
          <>
            <Button variant="secondary" size="sm" onClick={p.alNuevaPlantilla}>
              <Plus className="w-4 h-4" aria-hidden /> Nueva plantilla
            </Button>
            {!esGeneral && (
              <Button variant="secondary" size="sm" onClick={p.alRenombrar}>
                <Pencil className="w-4 h-4" aria-hidden /> Cambiar nombre
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={p.alAsignar}>
              <Users className="w-4 h-4" aria-hidden /> Asignar a niños
            </Button>
            {esGeneral ? (
              <Button variant="secondary" size="sm" onClick={p.alRestablecerFabrica}>
                <RotateCcw className="w-4 h-4" aria-hidden /> Restablecer de fábrica
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={p.alEliminar}>
                <Trash2 className="w-4 h-4" aria-hidden /> Eliminar plantilla
              </Button>
            )}
          </>
        )}
        {!esPlantilla && (
          <>
            <Button variant="secondary" size="sm" onClick={p.alAsignar}>
              <Users className="w-4 h-4" aria-hidden /> Cambiar de plantilla
            </Button>
            {p.copiaPropia && (
              <>
                <Button variant="secondary" size="sm" onClick={p.alGuardarComoPlantilla}>
                  <Copy className="w-4 h-4" aria-hidden /> Guardar como plantilla
                </Button>
                <Button variant="secondary" size="sm" onClick={p.alRestablecerNino}>
                  <RotateCcw className="w-4 h-4" aria-hidden /> Restablecer a la plantilla
                </Button>
              </>
            )}
          </>
        )}
        <Button variant="secondary" size="sm" onClick={p.alCategorias}>
          <Palette className="w-4 h-4" aria-hidden /> Categorías
        </Button>
        <Button variant="secondary" size="sm" onClick={p.alGenerarAudios} disabled={p.faltanAudios === 0 || p.generandoAudios}>
          <Volume2 className="w-4 h-4" aria-hidden /> {p.generandoAudios ? 'Generando audios…' : `Generar audios que faltan (${p.faltanAudios})`}
        </Button>
        <Button variant="secondary" size="sm" onClick={p.alDeshacer} disabled={!p.hayDeshacer}>
          <Undo2 className="w-4 h-4" aria-hidden /> Deshacer
        </Button>
      </div>
    </section>
  );
};
