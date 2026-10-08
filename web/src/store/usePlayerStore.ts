import { create } from 'zustand';

export interface PlayerState {
  currentAudioUrl: string | null;
  isPlaying: boolean;
  playbackRate: number;
  selectedVoice: 'catalina-cl' | 'profesora-clonada';
  activeAudioInstance: HTMLAudioElement | null;

  playAudio: (audioUrl: string) => void;
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

  playAudio: (audioUrl: string) => {
    const { activeAudioInstance, playbackRate } = get();

    // 1. Detener y limpiar cualquier instancia de audio que esté sonando previamente
    if (activeAudioInstance) {
      activeAudioInstance.pause();
      activeAudioInstance.currentTime = 0;
    }

    // 2. Crear la nueva instancia de audio nativa
    const newAudio = new Audio(audioUrl);
    newAudio.playbackRate = playbackRate;

    // 3. Configurar eventos para actualizar el estado del store de Zustand
    newAudio.onplay = () => {
      set({ isPlaying: true, currentAudioUrl: audioUrl });
    };

    newAudio.onended = () => {
      set({ isPlaying: false, currentAudioUrl: null, activeAudioInstance: null });
    };

    newAudio.onerror = () => {
      console.error(`❌ Error al cargar o reproducir el archivo de audio: ${audioUrl}`);
      set({ isPlaying: false, currentAudioUrl: null, activeAudioInstance: null });
    };

    // 4. Guardar la instancia y reproducir
    set({ activeAudioInstance: newAudio });
    newAudio.play().catch((err) => {
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
    
    // Si hay un audio sonando en vivo, le cambiamos la velocidad inmediatamente
    if (activeAudioInstance) {
      activeAudioInstance.playbackRate = rate;
    }

    set({ playbackRate: rate });
  },

  setSelectedVoice: (voice: 'catalina-cl' | 'profesora-clonada') => {
    set({ selectedVoice: voice });
  },
}));