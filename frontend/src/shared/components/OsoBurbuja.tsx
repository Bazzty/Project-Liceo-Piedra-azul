import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { OsoCabeza } from '@/shared/components/OsoCabeza';
import { useBocaHabla } from '@/shared/hooks/useBocaHabla';
import { useHablar } from '@/shared/hooks/useHablar';
import type { ClaveAudio } from '@/shared/config/audiosInterfaz';
import { usePlayerStore } from '@/shared/store/usePlayerStore';

export interface OsoBurbujaProps {
  /** Texto de la burbuja; también es lo que se lee en voz alta al tocar al osito. */
  mensaje: string;
  /** Audio grabado a reproducir en lugar de la voz del navegador. */
  audioUrl?: string;
  /** Clave de la grabación de la voz del proyecto (ver audiosInterfaz.ts). */
  clave?: ClaveAudio;
  size?: 'md' | 'lg' | 'xl';
  /** Lo que dice en voz alta, si es distinto del texto de la burbuja. */
  voz?: string;
  /** Sin texto visible en la burbuja (solo voz), para quienes aún no leen. */
  className?: string;
}

const TAMANOS = {
  md: 'w-32 h-32 sm:w-40 sm:h-40',
  lg: 'w-28 h-28 sm:w-44 sm:h-44 lg:w-52 lg:h-52',
  xl: 'w-36 h-36 sm:w-[min(13rem,26vh)] sm:h-[min(13rem,26vh)] sm:portrait:w-[min(40vw,21rem)] sm:portrait:h-[min(40vw,21rem)] lg:w-[min(19rem,36vh)] lg:h-[min(19rem,36vh)]',
};

/** Osito guía con burbuja: al tocarlo dice el mensaje en voz alta. Pensado para quien aún no lee. */
export const OsoBurbuja: React.FC<OsoBurbujaProps> = ({ mensaje, audioUrl, clave, size = 'md', voz, className = '' }) => {
  const hablar = useHablar();
  const playAudio = usePlayerStore((s) => s.playAudio);

  const { boca, iniciar } = useBocaHabla();
  const [saltando, setSaltando] = useState(false);

  const escuchar = () => {
    setSaltando(false);
    // Reinicia la animación aunque se toque varias veces seguidas
    requestAnimationFrame(() => setSaltando(true));
    if (audioUrl) playAudio(audioUrl);
    else hablar(voz ?? mensaje, clave);
    iniciar(voz ?? mensaje);
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative animate-aparecer bg-surface text-primary rounded-card shadow-card px-5 py-2 sm:px-6 sm:py-3 text-center max-w-xs" role="status" aria-live="polite">
        <p className="text-xl sm:text-2xl font-black">{mensaje}</p>
        <span className="absolute left-1/2 -bottom-2 w-4 h-4 -translate-x-1/2 rotate-45 bg-surface" aria-hidden />
      </div>
      <button
        type="button"
        onClick={escuchar}
        aria-label={`Escuchar al osito: ${mensaje}`}
        className={`relative rounded-full cursor-pointer active:scale-95 ${saltando ? 'animate-saltito' : 'animate-respirar'}`}
        onAnimationEnd={() => setSaltando(false)}
      >
        <span className={`${TAMANOS[size]} block bg-surface rounded-full border-4 border-onBrand/60 p-2 overflow-hidden`}>
          <OsoCabeza boca={boca === 'NEUTRAL' ? 'HAPPY' : boca} />
        </span>
        <span
          className="absolute -bottom-1 -right-1 w-11 h-11 sm:w-14 sm:h-14 rounded-full animate-pulso bg-accent text-onAccent border-4 border-surface flex items-center justify-center shadow-card"
          aria-hidden
        >
          <Volume2 className="w-7 h-7" />
        </span>
      </button>
    </div>
  );
};
