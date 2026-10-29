import React from 'react';
import { inclinacion, STICKERS } from '@/features/estrellas/stickers';

const TAMANOS = { sm: 'w-20 h-20 [&>svg]:w-10 [&>svg]:h-10', lg: 'w-36 h-36 [&>svg]:w-20 [&>svg]:h-20' };

export const Sticker: React.FC<{ indice: number; obtenido: boolean; size?: 'sm' | 'lg'; animar?: boolean; inclinar?: boolean }> = ({
  indice,
  obtenido,
  size = 'sm',
  animar = false,
  inclinar = false,
}) => {
  const info = STICKERS[indice % STICKERS.length];
  return (
    <div
      role="img"
      aria-label={obtenido ? `Sticker de ${info.nombre}` : 'Sticker por ganar'}
      style={inclinar ? { transform: `rotate(${inclinacion(indice)}deg)` } : undefined}
      className={`${TAMANOS[size]} rounded-full flex items-center justify-center border-4 shadow-card ${
        obtenido ? `${info.fondo} border-surface ${animar ? 'animate-pop' : ''}` : 'bg-app text-borderStrong/60 border-dashed border-borderStrong'
      }`}
    >
      {/* Los que faltan se ven como silueta, para que el niño sepa qué puede ganar */}
      <info.Icono strokeWidth={obtenido ? 1.8 : 1.4} aria-hidden className={obtenido ? '' : 'opacity-40'} />
    </div>
  );
};
