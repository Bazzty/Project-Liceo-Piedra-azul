import { create } from 'zustand';
import { useAjustesStore } from '@/shared/store/useAjustesStore';

export interface PlayerState {
  currentAudioUrl: string | null;
  isPlaying: boolean;
  playbackRate: number;
  selectedVoice: 'catalina-cl' | 'profesora-clonada';
  activeAudioInstance: HTMLAudioElement | null;
  /** `alFallar` se llama si el archivo no existe o no se puede reproducir (p. ej. para usar otra voz). */
  playAudio: (audioUrl: string, opciones?: { alFallar?: () => void }) => void;
  stopAudio: () => void;
  setPlaybackRate: (rate: number) => void;
  setSelectedVoice: (voice: 'catalina-cl' | 'profesora-clonada') => void;
}

export const usePlayerStore = create<PlayerState>()((set, get) => ({
  currentAudioUrl: null,
  isPlaying: false,
  playbackRate: 1.0, // 1.0x por defecto
  selectedVoice: 'catalina-cl',
  activeAudioInstance: null,
  playAudio: (audioUrl: string, opciones) => {
    if (!useAjustesStore.getState().sonido) return;
    const { activeAudioInstance, playbackRate } = get();
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel(); // evita que se pisen dos voces
    // 1. Detener y limpiar cualquier instancia de audio que esté sonando previamente
    if (activeAudioInstance) {
      activeAudioInstance.pause();
      activeAudioInstance.currentTime = 0;
    }
    // 2. Crear la nueva instancia de audio nativa
    const newAudio = new Audio(audioUrl);
    newAudio.playbackRate = playbackRate * (useAjustesStore.getState().vozLenta ? 0.8 : 1);
    // 3. Configurar eventos para actualizar el estado del store de Zustand
    newAudio.onplay = () => {
      set({ isPlaying: true, currentAudioUrl: audioUrl });
    };
    newAudio.onended = () => {
      set({ isPlaying: false, currentAudioUrl: null, activeAudioInstance: null });
    };
    newAudio.onerror = () => {
      if (!opciones?.alFallar) console.error(`❌ Error al cargar o reproducir el archivo de audio: ${audioUrl}`);
      set({ isPlaying: false, currentAudioUrl: null, activeAudioInstance: null });
      opciones?.alFallar?.();
    };
    // 4. Guardar la instancia y reproducir
    set({ activeAudioInstance: newAudio });
    newAudio.play().catch((err) => {
      if (opciones?.alFallar) return; // onerror ya avisa cuando el archivo no existe
      console.error('❌ Error al iniciar la reproducción automática:', err);
    });
  },
  stopAudio: () => {
    const { activeAudioInstance } = get();
    if (activeAudioInstance) {
      activeAudioInstance.pause();
      activeAudioInstance.currentTime = 0;
    }
    set({ isPlaying: false, currentAudioUrl: null, activeAudioInstance: null });
  },
  setPlaybackRate: (rate: number) => {
    const { activeAudioInstance } = get();
    if (activeAudioInstance) {
      activeAudioInstance.playbackRate = rate;
    }
    set({ playbackRate: rate });
  },
  setSelectedVoice: (voice: 'catalina-cl' | 'profesora-clonada') => {
    set({ selectedVoice: voice });
  },
}));