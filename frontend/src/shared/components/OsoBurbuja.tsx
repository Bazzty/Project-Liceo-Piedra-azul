import React from 'react';
import { Volume2 } from 'lucide-react';
import { useHablar } from '@/shared/hooks/useHablar';
import { usePlayerStore } from '@/shared/store/usePlayerStore';

const BASE = import.meta.env.BASE_URL || '/';

export interface OsoBurbujaProps {
  /** Texto de la burbuja; también es lo que se lee en voz alta al tocar al osito. */
  mensaje: string;
  /** Audio grabado a reproducir en lugar de la voz del navegador. */
  audioUrl?: string;
  size?: 'md' | 'lg';
  /** Sin texto visible en la burbuja (solo voz), para quienes aún no leen. */
  className?: string;
}

const TAMANOS = { md: 'w-32 h-32 sm:w-40 sm:h-40', lg: 'w-40 h-40 sm:w-52 sm:h-52' };

/** Osito guía con burbuja: al tocarlo dice el mensaje en voz alta. Pensado para quien aún no lee. */
export const OsoBurbuja: React.FC<OsoBurbujaProps> = ({ mensaje, audioUrl, size = 'md', className = '' }) => {
  const hablar = useHablar();
  const playAudio = usePlayerStore((s) => s.playAudio);

  const escuchar = () => (audioUrl ? playAudio(audioUrl) : hablar(mensaje));

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative bg-surface text-primary rounded-card shadow-card px-6 py-3 text-center max-w-xs" role="status" aria-live="polite">
        <p className="text-2xl font-black">{mensaje}</p>
        <span className="absolute left-1/2 -bottom-2 w-4 h-4 -translate-x-1/2 rotate-45 bg-surface" aria-hidden />
      </div>
      <button
        type="button"
        onClick={escuchar}
        aria-label={`Escuchar al osito: ${mensaje}`}
        className="relative rounded-full cursor-pointer transition-transform hover:scale-105 active:scale-95"
      >
        <img
          src={`${BASE}assets/personajes/oso/cabeza_base.png`.replace(/\/\//g, '/')}
          alt=""
          className={`${TAMANOS[size]} object-contain bg-surface rounded-full border-4 border-onBrand/60 p-2`}
        />
        <span
          className="absolute -bottom-1 -right-1 w-14 h-14 rounded-full bg-accent text-onAccent border-4 border-surface flex items-center justify-center shadow-card"
          aria-hidden
        >
          <Volume2 className="w-7 h-7" />
        </span>
      </button>
    </div>
  );
};
