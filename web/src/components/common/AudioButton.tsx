import React from 'react';
import { Volume2, Square } from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';

interface AudioButtonProps {
  audioUrl?: string;
  label?: string;
  size?: 'md' | 'lg' | 'xl';
  className?: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  audioUrl,
  label,
  size = 'lg',
  className = '',
}) => {
  const { playAudio, stopAudio, isPlaying, currentAudioUrl } = usePlayerStore();
  const isThisPlaying = isPlaying && currentAudioUrl === audioUrl;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita disparar otros eventos si está dentro de una tarjeta
    if (!audioUrl) return;
    
    if (isThisPlaying) {
      stopAudio();
    } else {
      playAudio(audioUrl);
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={label ? `Escuchar: ${label}` : 'Reproducir audio'}
      className={`inline-flex items-center gap-2 rounded-2xl font-bold bg-brand text-white hover:bg-brand-hover p-3 min-w-[48px] min-h-[48px] justify-center transition-transform active:scale-90 shadow-md ${className}`}
    >
      {isThisPlaying ? (
        <Square className="w-6 h-6 animate-pulse text-yellow-300" />
      ) : (
        <Volume2 className="w-6 h-6" />
      )}
      {label && <span>{label}</span>}
    </button>
  );
};