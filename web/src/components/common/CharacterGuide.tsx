import React from 'react';
import { Volume2 } from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';

interface CharacterGuideProps {
  mensaje: string;
  audioUrl?: string;
  className?: string;
}

export const CharacterGuide: React.FC<CharacterGuideProps> = ({
  mensaje,
  audioUrl,
  className = '',
}) => {
  const { playAudio } = usePlayerStore();

  const handleSpeak = () => {
    if (audioUrl) {
      playAudio(audioUrl);
    } else {
      // Síntesis de voz nativa del navegador si no hay archivo grabado
      const utterance = new SpeechSynthesisUtterance(mensaje);

      utterance.lang = 'es-CL';
      utterance.rate = 0.85;

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      onClick={handleSpeak}
      className={`bg-surface p-3 sm:p-4 rounded-3xl border-4 border-borderCustom shadow-md flex items-center gap-3 md:gap-4 cursor-pointer hover:border-brand transition-all active:scale-95 ${className}`}
      role="button"
      tabIndex={0}
      aria-label={`Guía dice: ${mensaje}. Toca para escuchar`}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleSpeak();
        }
      }}
    >
      {/* 🦕 Avatar del Personaje */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand/10 border-2 border-brand flex items-center justify-center text-4xl sm:text-5xl shrink-0 shadow-inner animate-bounce">
        🦕
      </div>

      {/* 💬 Bocadillo de Diálogo con Mensaje y Botón de Audio */}
      <div className="flex-1 flex items-center justify-between gap-2">
        <p className="text-base sm:text-xl font-black text-primary leading-tight">
          "{mensaje}"
        </p>

        <div className="p-2 sm:p-3 bg-brand text-white rounded-2xl shrink-0 shadow">
          <Volume2 className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};