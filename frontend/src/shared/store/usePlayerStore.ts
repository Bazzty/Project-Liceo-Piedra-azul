import { create } from 'zustand';
import type { VozId } from '@/types';
import { useAjustesStore } from '@/shared/store/useAjustesStore';

export interface PlayerState {
  currentAudioUrl: string | null;
  isPlaying: boolean;
  playbackRate: number;
  selectedVoice: VozId;
  activeAudioInstance: HTMLAudioElement | null;
  /** `alFallar` se llama si el archivo no existe o no se puede reproducir (p. ej. para usar otra voz). */
  playAudio: (audioUrl: string, opciones?: { alFallar?: () => void }) => void;
  stopAudio: () => void;
  setPlaybackRate: (rate: number) => void;
  setSelectedVoice: (voice: VozId) => void;
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
    // Una instancia reemplazada no debe tocar el estado de la que suena ahora
    const esVigente = () => get().activeAudioInstance === newAudio;
    newAudio.onended = () => {
      if (esVigente()) set({ isPlaying: false, currentAudioUrl: null, activeAudioInstance: null });
    };
    let fallo = false;
    const fallar = () => {
      if (fallo || !esVigente()) return;
      fallo = true;
      set({ isPlaying: false, currentAudioUrl: null, activeAudioInstance: null });
      opciones?.alFallar?.();
    };
    newAudio.onerror = () => {
      if (!opciones?.alFallar) console.error(`❌ Error al cargar o reproducir el archivo de audio: ${audioUrl}`);
      fallar();
    };
    // 4. Guardar la instancia y reproducir
    set({ activeAudioInstance: newAudio });
    newAudio.play().catch((err) => {
      if (err?.name === 'AbortError') return; // se detuvo o reemplazó antes de empezar
      if (!opciones?.alFallar) console.error('❌ Error al iniciar la reproducción automática:', err);
      fallar(); // p. ej. autoplay bloqueado: usar el respaldo
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
  setSelectedVoice: (voice: VozId) => {
    set({ selectedVoice: voice });
  },
}));