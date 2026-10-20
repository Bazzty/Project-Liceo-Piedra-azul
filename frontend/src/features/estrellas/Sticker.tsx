import React from 'react';
import { STICKERS } from '@/features/estrellas/stickers';

const TAMANOS = { sm: 'w-20 h-20 [&>svg]:w-10 [&>svg]:h-10', lg: 'w-36 h-36 [&>svg]:w-20 [&>svg]:h-20' };

export const Sticker: React.FC<{ indice: number; obtenido: boolean; size?: 'sm' | 'lg'; animar?: boolean }> = ({
  indice,
  obtenido,
  size = 'sm',
  animar = false,
}) => {
  const info = STICKERS[indice % STICKERS.length];
  return (
    <div
      role="img"
      aria-label={obtenido ? `Sticker de ${info.nombre}` : 'Sticker por ganar'}
      className={`${TAMANOS[size]} rounded-full flex items-center justify-center border-4 shadow-card ${
        obtenido ? `${info.fondo} border-surface ${animar ? 'animate-pop' : ''}` : 'bg-app text-borderStrong border-dashed border-borderStrong'
      }`}
    >
      {obtenido ? <info.Icono strokeWidth={1.8} aria-hidden /> : <span className="text-3xl font-black" aria-hidden>?</span>}
    </div>
  );
};
