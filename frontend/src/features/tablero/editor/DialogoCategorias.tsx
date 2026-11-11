import React, { useId, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import {
  agregarCategoria,
  cambiarColorDeCategoria,
  moverCategoria,
  puedeQuitarCategoria,
  quitarCategoria,
  renombrarCategoria,
} from '@/features/tablero/edicionCategorias';
import { COLORES_TABLERO } from '@/features/tablero/coloresTablero';
import { Button, Modal } from '@/shared/ui';
import type { CategoriaTablero, ColorTablero } from '@/types';

interface Props {
  categorias: CategoriaTablero[];
  /** Cuántas celdas usa cada categoría: una en uso no se puede quitar. */
  uso: Map<string, number>;
  /** Cada cambio se guarda al instante: el que llama recibe la lista nueva. */
  alCambiar: (categorias: CategoriaTablero[]) => void;
  alCerrar: () => void;
}

const COLORES = Object.keys(COLORES_TABLERO) as ColorTablero[];
const CAMPO = 'min-h-11 rounded-control border border-borderStrong bg-surface px-3 text-base text-primary';
const BOTON = 'min-h-11 min-w-11 flex items-center justify-center rounded-control border border-borderStrong bg-surface text-primary cursor-pointer hover:border-brand disabled:opacity-35 disabled:cursor-not-allowed';

const SelectorColor: React.FC<{ valor: ColorTablero; etiqueta: string; alCambiar: (c: ColorTablero) => void }> = ({ valor, etiqueta, alCambiar }) => (
  <span className="flex items-center gap-2">
    <span className={`w-5 h-5 rounded-full border-2 border-borderStrong shrink-0 ${COLORES_TABLERO[valor].franja}`} aria-hidden />
    <select aria-label={etiqueta} value={valor} onChange={(e) => alCambiar(e.target.value as ColorTablero)} className={CAMPO}>
      {COLORES.map((c) => (
        <option key={c} value={c}>
          {COLORES_TABLERO[c].etiqueta}
        </option>
      ))}
    </select>
  </span>
);

/** Cada categoría con su nombre editable. Se guarda al salir del campo, para no guardar letra por letra. */
const Fila: React.FC<{ categoria: CategoriaTablero; indice: number; total: number; enUso: number; alCambiar: Props['alCambiar']; categorias: CategoriaTablero[]; uso: Map<string, number> }> = ({ categoria, indice, total, enUso, alCambiar, categorias, uso }) => {
  const [nombre, setNombre] = useState(categoria.nombre);
  const quitable = puedeQuitarCategoria(categorias, categoria.id, uso);
  const motivo = enUso > 0 ? `En uso en ${enUso} ${enUso === 1 ? 'celda' : 'celdas'}` : total <= 1 ? 'Debe quedar al menos una' : '';

  return (
    <li className="flex flex-wrap items-center gap-2 py-2 border-t border-borderCustom first:border-t-0">
      <input
        aria-label={`Nombre de la categoría ${categoria.nombre}`}
        value={nombre}
        maxLength={24}
        onChange={(e) => setNombre(e.target.value)}
        onBlur={() => (nombre.trim() ? alCambiar(renombrarCategoria(categorias, categoria.id, nombre)) : setNombre(categoria.nombre))}
        className={`${CAMPO} grow min-w-36`}
      />
      <SelectorColor valor={categoria.color} etiqueta={`Color de ${categoria.nombre}`} alCambiar={(c) => alCambiar(cambiarColorDeCategoria(categorias, categoria.id, c))} />
      <button type="button" className={BOTON} disabled={indice === 0} aria-label={`Subir la categoría ${categoria.nombre}`} onClick={() => alCambiar(moverCategoria(categorias, categoria.id, -1))}>
        <ArrowUp className="w-5 h-5" aria-hidden />
      </button>
      <button type="button" className={BOTON} disabled={indice === total - 1} aria-label={`Bajar la categoría ${categoria.nombre}`} onClick={() => alCambiar(moverCategoria(categorias, categoria.id, 1))}>
        <ArrowDown className="w-5 h-5" aria-hidden />
      </button>
      <button type="button" className={BOTON} disabled={!quitable} aria-label={`Quitar la categoría ${categoria.nombre}`} title={motivo} onClick={() => alCambiar(quitarCategoria(categorias, categoria.id, uso))}>
        <Trash2 className="w-5 h-5" aria-hidden />
      </button>
      {motivo && <span className="basis-full text-xs text-secondary">{motivo}: no se puede quitar.</span>}
    </li>
  );
};

/** Las categorías definen el color de cada palabra y carpeta. Aquí se crean, renombran, recolorean y ordenan. */
export const DialogoCategorias: React.FC<Props> = ({ categorias, uso, alCambiar, alCerrar }) => {
  const id = useId();
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState<ColorTablero>('info');

  return (
    <Modal isOpen onClose={alCerrar} title="Categorías" size="md">
      <div className="flex flex-col gap-5">
        <p className="text-sm text-secondary">Cada categoría tiene un color: las palabras y carpetas de esa categoría lo llevan en su franja. Los cambios se guardan al instante.</p>

        <ul aria-label="Categorías" className="flex flex-col">
          {categorias.map((c, i) => (
            <Fila key={c.id} categoria={c} indice={i} total={categorias.length} enUso={uso.get(c.id) ?? 0} alCambiar={alCambiar} categorias={categorias} uso={uso} />
          ))}
        </ul>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!nombre.trim()) return;
            alCambiar(agregarCategoria(categorias, nombre, color));
            setNombre('');
          }}
          className="flex flex-wrap items-end gap-2 pt-4 border-t border-borderCustom"
        >
          <div className="flex flex-col gap-1 grow min-w-36">
            <label htmlFor={`${id}-nueva`} className="text-sm font-semibold text-primary">
              Nueva categoría
            </label>
            <input id={`${id}-nueva`} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={24} placeholder="Ej.: Comida" className={CAMPO} />
          </div>
          <SelectorColor valor={color} etiqueta="Color de la nueva categoría" alCambiar={setColor} />
          <Button type="submit" variant="secondary" disabled={!nombre.trim()}>
            <Plus className="w-4 h-4" aria-hidden /> Agregar
          </Button>
        </form>

        <div className="flex justify-end pt-2 border-t border-borderCustom">
          <Button variant="primary" onClick={alCerrar}>
            Listo
          </Button>
        </div>
      </div>
    </Modal>
  );
};
