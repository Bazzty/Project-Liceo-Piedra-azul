import React from 'react';

export interface InterruptorProps {
  activo: boolean;
  onChange: (activo: boolean) => void;
  icono: React.ReactNode;
  etiqueta: string;
}

/** Interruptor grande (encendido/apagado) con ícono y una sola palabra, pensado para tocar con el dedo. */
export const Interruptor: React.FC<InterruptorProps> = ({ activo, onChange, icono, etiqueta }) => (
  <button
    type="button"
    role="switch"
    aria-checked={activo}
    onClick={() => onChange(!activo)}
    className="w-full min-h-16 flex items-center justify-between gap-4 px-4 py-2 rounded-control border-2 border-borderStrong bg-surface text-primary cursor-pointer hover:border-brand transition-colors"
  >
    <span className="flex items-center gap-3 text-xl font-extrabold [&>svg]:w-8 [&>svg]:h-8" aria-hidden={false}>
      {icono}
      {etiqueta}
    </span>
    <span
      className={`relative w-16 h-9 shrink-0 rounded-full transition-colors ${activo ? 'bg-brand' : 'bg-borderStrong'}`}
      aria-hidden
    >
      <span
        className={`absolute top-1 w-7 h-7 rounded-full bg-surface shadow-card transition-all ${activo ? 'left-8' : 'left-1'}`}
      />
    </span>
    <span className="sr-only">{activo ? 'Encendido' : 'Apagado'}</span>
  </button>
);
