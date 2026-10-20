import React from 'react';
import { Check, Delete } from 'lucide-react';

export interface TecladoCodigoProps {
  onDigito: (digito: string) => void;
  onBorrar: () => void;
  onEntrar: () => void;
  /** Habilita el botón "Entrar" (código completo). */
  puedeEntrar: boolean;
  disabled?: boolean;
}

const DIGITOS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

const TECLA =
  'min-h-[4rem] [@media(max-height:820px)]:min-h-[3.25rem] rounded-control border-2 font-black text-3xl flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

/** Teclado numérico grande en pantalla para escribir el código de la tarjeta. */
export const TecladoCodigo: React.FC<TecladoCodigoProps> = ({ onDigito, onBorrar, onEntrar, puedeEntrar, disabled = false }) => (
  <div role="group" aria-label="Teclado numérico" className="grid grid-cols-3 gap-3 w-full max-w-sm mx-auto">
    {DIGITOS.map((d) => (
      <button
        key={d}
        type="button"
        disabled={disabled}
        onClick={() => onDigito(d)}
        className={`${TECLA} bg-surface border-borderStrong text-primary hover:border-brand hover:bg-app`}
      >
        {d}
      </button>
    ))}
    <button
      type="button"
      disabled={disabled}
      onClick={onBorrar}
      aria-label="Borrar el último número"
      className={`${TECLA} bg-app border-borderStrong text-secondary hover:border-brand`}
    >
      <Delete className="w-8 h-8" aria-hidden />
    </button>
    <button
      type="button"
      disabled={disabled}
      onClick={() => onDigito('0')}
      className={`${TECLA} bg-surface border-borderStrong text-primary hover:border-brand hover:bg-app`}
    >
      0
    </button>
    <button
      type="button"
      disabled={disabled || !puedeEntrar}
      onClick={onEntrar}
      aria-label="Entrar"
      className={`${TECLA} bg-brand border-brand text-onBrand hover:bg-brand-hover`}
    >
      <Check className="w-9 h-9" aria-hidden />
    </button>
  </div>
);
