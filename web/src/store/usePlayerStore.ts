import { create } from 'zustand';

interface PlayerState {
  currentAudioUrl: string | null;
  isPlaying: boolean;
  playbackRate: number;              // 0.8x (despacio - recomendado TEA), 1.0x, 1.2x
  selectedVoice: 'catalina-cl' | 'profesora-clonada';
  activeAudioInstance: HTMLAudioElement | null;

  // Acciones
  playAudio: (audioUrl: string) => void;
  stopAudio: () => void;
  setPlaybackRate: (rate: number) => void;
  setSelectedVoice: (voice: 'catalina-cl' | 'profesora-clonada') => void;
}

export const usePlayerStore = create