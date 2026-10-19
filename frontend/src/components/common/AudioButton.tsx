import React from 'react';
import { Volume2 } from 'lucide-react';

export interface AudioButtonProps {
  texto: string;
  className?: string;
  onClick?: () => void;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  texto,
  className = '',
  onClick,
}) => {
  const handlePlayAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'es-CL';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <button
      type="button"
      onClick={handlePlayAudio}
      aria-label={`Escuchar audio: ${texto}`}
      className={`p-3 rounded-2xl bg-brand/10 text-brand hover:bg-brand/20 border-2 border-brand/30 transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-sm ${className}`}
    >
      <Volume2 className="w-5 h-5" />
    </button>
  );
};