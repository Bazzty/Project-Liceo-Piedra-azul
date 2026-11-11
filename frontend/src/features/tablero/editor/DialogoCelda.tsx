import React, { useId, useState } from 'react';
import { SelectorPictograma } from '@/features/tablero/editor/SelectorPictograma';
import { Button, Modal } from '@/shared/ui';
import type { CategoriaTablero, CeldaTablero, Pictograma } from '@/types';

/** Lo que la docente completa al agregar o editar una palabra o una carpeta. */
export interface DatosDeCelda {
  textoMostrado: string;
  textoHablado?: string;
  categoriaId: string;
  pictogramaId?: string;
  esNucleo: boolean;
}

interface Props {
  tipo: 'palabra' | 'carpeta';
  /** La celda que se edita; sin ella, se está agregando una nueva. */
  celda?: CeldaTablero;
  categorias: CategoriaTablero[];
  pictogramas: Pictograma[];
  /** Solo en el tablero principal una palabra puede quedar siempre a la vista (núcleo). */
  puedeSerNucleo: boolean;
  /** Categoría y núcleo con que parte una celda nueva. */
  inicial?: { categoriaId?: string; esNucleo?: boolean };
  alGuardar: (datos: DatosDeCelda) => void;
  alCerrar: () => void;
}

const CAMPO = 'w-full min-h-12 rounded-control border border-borderStrong bg-surface px-3 text-base text-primary';

/** Formulario para agregar o editar una celda. Se monta al abrirse, así que parte siempre con los datos de la celda. */
export const DialogoCelda: React.FC<Props> = ({ tipo, celda, categorias, pictogramas, puedeSerNucleo, inicial, alGuardar, alCerrar }) => {
  const id = useId();
  const esCarpeta = tipo === 'carpeta';
  const [texto, setTexto] = useState(celda?.textoMostrado ?? '');
  const [hablado, setHablado] = useState(celda?.textoHablado ?? '');
  const [categoriaId, setCategoriaId] = useState(celda?.categoriaId ?? inicial?.categoriaId ?? categorias[0]?.id ?? '');
  const [esNucleo, setEsNucleo] = useState(celda?.esNucleo ?? inicial?.esNucleo ?? false);
  const [pic, setPic] = useState<Pictograma | undefined>(pictogramas.find((p) => p.id === celda?.pictogramaId));

  const valido = texto.trim().length > 0 && (esCarpeta || Boolean(pic));
  const titulo = `${celda ? 'Editar' : 'Agregar'} ${esCarpeta ? 'carpeta' : 'palabra'}`;

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valido) return;
    const habladoLimpio = hablado.trim();
    alGuardar({
      textoMostrado: texto.trim(),
      textoHablado: !esCarpeta && habladoLimpio && habladoLimpio !== texto.trim() ? habladoLimpio : undefined,
      categoriaId,
      pictogramaId: pic?.id,
      esNucleo: !esCarpeta && puedeSerNucleo && esNucleo,
    });
  };

  return (
    <Modal isOpen onClose={alCerrar} title={titulo} size="lg">
      <form onSubmit={enviar} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-texto`} className="text-sm font-semibold text-primary">
            {esCarpeta ? 'Nombre de la carpeta' : 'Palabra'}
          </label>
          <input id={`${id}-texto`} data-autofoco value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={30} required className={CAMPO} />
        </div>

        {!esCarpeta && (
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-hablado`} className="text-sm font-semibold text-primary">
              Lo que dice el tablero <span className="font-normal text-secondary">(opcional, si es distinto)</span>
            </label>
            <p className="text-xs text-secondary">El texto se envía a un servicio de voz para generar el audio: no escribas nombres de niños.</p>
            <input id={`${id}-hablado`} value={hablado} onChange={(e) => setHablado(e.target.value)} maxLength={60} placeholder={texto ? `Ej.: Quiero ${texto.toLowerCase()}` : ''} className={CAMPO} />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-categoria`} className="text-sm font-semibold text-primary">
            Categoría <span className="font-normal text-secondary">(define el color)</span>
          </label>
          <select id={`${id}-categoria`} value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className={CAMPO}>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {!esCarpeta && puedeSerNucleo && (
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={esNucleo} onChange={(e) => setEsNucleo(e.target.checked)} className="mt-1 w-5 h-5 accent-[var(--brand)]" />
            <span className="text-sm">
              <span className="block font-semibold text-primary">Siempre a la vista</span>
              <span className="block text-secondary">Se muestra en la fila de arriba, también dentro de las carpetas.</span>
            </span>
          </label>
        )}

        <fieldset className="flex flex-col gap-2 min-w-0">
          <legend className="text-sm font-semibold text-primary mb-1">
            Dibujo {esCarpeta && <span className="font-normal text-secondary">(recomendado: que represente la carpeta)</span>}
          </legend>
          <SelectorPictograma consulta={texto} elegido={pic} alElegir={setPic} />
        </fieldset>

        <div className="flex justify-end gap-3 pt-2 border-t border-borderCustom">
          <Button type="button" variant="secondary" onClick={alCerrar}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={!valido}>
            {celda ? 'Guardar cambios' : 'Agregar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
