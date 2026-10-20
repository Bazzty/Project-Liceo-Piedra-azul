import React from 'react';

export interface CasillasCodigoProps {
  valor: string;
  largo: number;
  /** Muestra las casillas en tono de error (sin depender solo del color: el mensaje va aparte). */
  error?: boolean;
}

/** Casillas grandes que muestran el código que se va escribiendo. */
export const CasillasCodigo: React.FC<CasillasCodigoProps> = ({ valor, largo, error = false }) => (
  <div
    role="group"
    aria-label={`Código de tu tarjeta: ${valor ? valor.split('').join(' ') : 'vacío'}`}
    className="flex justify-center gap-2 sm:gap-3"
  >
    {Array.from({ length: largo }, (_, i) => {
      const lleno = i < valor.length;
      const activa = i === valor.length;
      return (
        <div
          key={i}
          aria-hidden
          className={`w-14 h-[4.5rem] sm:w-16 sm:h-20 rounded-control border-2 flex items-center justify-center text-4xl font-black text-primary transition-colors ${
            error
              ? 'border-statusDanger bg-statusDanger-bg'
              : activa
                ? 'border-brand bg-surface ring-4 ring-brand/20'
                : lleno
                  ? 'border-brand bg-surface'
                  : 'border-borderStrong bg-app'
          }`}
        >
          {lleno ? valor[i] : ''}
        </div>
      );
    })}
  </div>
);
