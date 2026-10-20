import { useCallback } from 'react';
import { useAjustesStore } from '@/shared/store/useAjustesStore';

/**
 * Lee un texto en voz alta con la voz del navegador (español).
 * Para mensajes que no tienen un audio grabado; los audios del proyecto se reproducen con usePlayerStore.
 */
export const useHablar = () =>
  useCallback((texto: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const { sonido, vozLenta } = useAjustesStore.getState();
    if (!sonido) return;
    window.speechSynthesis.cancel();
    const voz = new SpeechSynthesisUtterance(texto);
    voz.lang = 'es-CL';
    voz.rate = vozLenta ? 0.65 : 0.85;
    voz.pitch = 1.1;
    window.speechSynthesis.speak(voz);
  }, []);
