import React, { useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, FolderOpen, Pencil, Trash2 } from 'lucide-react';
import type { CeldaTablero, Pictograma } from '@/types';

export type Orientacion = 'horizontal' | 'vertical';

interface Props {
  celda: CeldaTablero;
  pic?: Pictograma;
  franja: string;
  /** Posición entre las celdas que se ven juntas, para no ofrecer mover donde no se puede. */
  esPrimera: boolean;
  esUltima: boolean;
  /** Una carpeta del lateral se «selecciona» para editar lo que tiene dentro. */
  seleccionada?: boolean;
  orientacion?: Orientacion;
  alAbrir: () => void;
  alEditar: () => void;
  alQuitar: () => void;
  alMover: (paso: -1 | 1) => void;
  alEmpezarArrastre: () => void;
  alSoltarAqui: () => void;
}

const BOTON = 'min-h-11 w-full flex items-center justify-center rounded-control border border-borderStrong bg-surface text-primary cursor-pointer hover:border-brand disabled:opacity-35 disabled:cursor-not-allowed';

/**
 * El dibujo y el nombre de la celda. Una carpeta es un botón (se abre para editar lo que tiene dentro); una palabra es
 * solo para mirar, y se edita con el lápiz: así cada acción tiene un único control con su nombre.
 */
const Cuerpo: React.FC<{ esCarpeta: boolean; seleccionada: boolean; texto: string; alAbrir: () => void; className: string; children: React.ReactNode }> = ({ esCarpeta, seleccionada, texto, alAbrir, className, children }) =>
  esCarpeta ? (
    <button type="button" onClick={alAbrir} aria-label={`Abrir la carpeta «${texto}» para editar lo que tiene dentro`} aria-pressed={seleccionada} className={className}>
      {children}
    </button>
  ) : (
    <div className={className}>{children}</div>
  );

/** Una celda del tablero en modo edición: se ve como la verá el niño, con controles para mover, editar y quitar. */
export const CeldaEditable: React.FC<Props> = ({
  celda,
  pic,
  franja,
  esPrimera,
  esUltima,
  seleccionada = false,
  orientacion = 'horizontal',
  alAbrir,
  alEditar,
  alQuitar,
  alMover,
  alEmpezarArrastre,
  alSoltarAqui,
}) => {
  const [encima, setEncima] = useState(false);
  const esCarpeta = celda.tipo === 'carpeta';
  const texto = celda.textoMostrado;
  const Antes = orientacion === 'horizontal' ? ArrowLeft : ArrowUp;
  const Despues = orientacion === 'horizontal' ? ArrowRight : ArrowDown;

  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', celda.id);
        alEmpezarArrastre();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setEncima(true);
      }}
      onDragLeave={() => setEncima(false)}
      onDrop={(e) => {
        e.preventDefault();
        setEncima(false);
        alSoltarAqui();
      }}
      className={`flex flex-col gap-2 min-w-0 rounded-card border-2 bg-surface p-2 ${encima ? 'border-brand ring-4 ring-accent/50' : 'border-borderCustom'} ${seleccionada ? 'ring-4 ring-accent/70 border-brand' : ''}`}
    >
      <Cuerpo
        esCarpeta={esCarpeta}
        seleccionada={seleccionada}
        texto={texto}
        alAbrir={alAbrir}
        className={`relative flex flex-col items-center overflow-hidden rounded-control border-2 bg-app ${esCarpeta ? 'border-dashed border-borderStrong cursor-pointer hover:border-brand' : 'border-borderCustom'}`}
      >
        <span className={`h-2 w-full ${franja}`} aria-hidden />
        <span className="flex items-center justify-center p-2">
          {pic ? <img src={pic.imagenUrl} alt="" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" /> : esCarpeta ? <FolderOpen className="w-16 h-16 text-secondary" aria-hidden /> : <span className="w-16 h-16 flex items-center justify-center text-3xl font-black text-secondary">{texto.charAt(0).toUpperCase()}</span>}
        </span>
        <span className="flex items-center gap-1 pb-2 px-2 max-w-full text-base font-black leading-tight">
          {esCarpeta && <FolderOpen className="w-4 h-4 shrink-0" aria-hidden />}
          <span className="truncate">{texto}</span>
        </span>
      </Cuerpo>
      {celda.textoHablado && <p className="text-xs text-secondary text-center truncate" title={celda.textoHablado}>Dice: «{celda.textoHablado}»</p>}

      <div role="group" aria-label={`Acciones de ${texto}`} className="grid grid-cols-2 gap-1">
        <button type="button" onClick={() => alMover(-1)} disabled={esPrimera} aria-label={`Mover «${texto}» antes`} className={BOTON}>
          <Antes className="w-5 h-5" aria-hidden />
        </button>
        <button type="button" onClick={() => alMover(1)} disabled={esUltima} aria-label={`Mover «${texto}» después`} className={BOTON}>
          <Despues className="w-5 h-5" aria-hidden />
        </button>
        <button type="button" onClick={alEditar} aria-label={esCarpeta ? `Editar la carpeta «${texto}»` : `Editar «${texto}»`} className={BOTON}>
          <Pencil className="w-5 h-5" aria-hidden />
        </button>
        <button type="button" onClick={alQuitar} aria-label={`Quitar «${texto}»`} className={`${BOTON} hover:border-statusDanger`}>
          <Trash2 className="w-5 h-5" aria-hidden />
        </button>
      </div>
    </li>
  );
};
