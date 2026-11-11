import React from 'react';
import { Delete, Volume2 } from 'lucide-react';
import { FILAS_DEL_TECLADO } from '@/features/tablero/teclado';

interface Props {
  alTecla: (tecla: string) => void;
  alEspacio: () => void;
  alBorrar: () => void;
  alEnter: () => void;
}

const TECLA = 'h-14 sm:h-16 lg:h-[4.5rem] rounded-2xl border-4 border-borderStrong bg-surface text-2xl sm:text-3xl font-black text-primary shadow-card cursor-pointer transition-transform hover:border-brand active:scale-90';

/** El teclado del niño: QWERTY simple, con teclas grandes. Cada letra suena al tocarla. */
export const TecladoNino: React.FC<Props> = ({ alTecla, alEspacio, alBorrar, alEnter }) => (
  <div role="group" aria-label="Teclado" className="flex flex-col gap-2 sm:gap-3 mx-auto w-full max-w-4xl">
    {FILAS_DEL_TECLADO.map((fila) => (
      <div key={fila.join('')} className="flex justify-center gap-1.5 sm:gap-3">
        {fila.map((tecla) => (
          <button
            key={tecla}
            type="button"
            onClick={() => alTecla(tecla)}
            aria-label={/^[0-9]$/.test(tecla) ? `Número ${tecla}` : `Letra ${tecla.toUpperCase()}`}
            className={`${TECLA} flex-1 min-w-0 max-w-[5.5rem]`}
          >
            <span aria-hidden>{tecla.toUpperCase()}</span>
          </button>
        ))}
      </div>
    ))}

    <div className="flex gap-2 sm:gap-3">
      <button type="button" onClick={alEspacio} aria-label="Espacio" className={`${TECLA} flex-[5] text-lg sm:text-xl`}>
        <span aria-hidden>espacio</span>
      </button>
      <button type="button" onClick={alBorrar} aria-label="Borrar" className={`${TECLA} flex-[2] flex items-center justify-center`}>
        <Delete className="w-8 h-8 sm:w-10 sm:h-10" aria-hidden />
      </button>
      <button type="button" onClick={alEnter} aria-label="Enter: que el osito diga lo escrito" className={`${TECLA} flex-[2] flex items-center justify-center bg-accent text-onAccent hover:bg-accent-hover`}>
        <Volume2 className="w-8 h-8 sm:w-10 sm:h-10" aria-hidden />
      </button>
    </div>
  </div>
);
