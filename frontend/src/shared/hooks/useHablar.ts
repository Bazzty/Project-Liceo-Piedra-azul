import { useCallback } from 'react';
import { AUDIOS_INTERFAZ, type ClaveAudio } from '@/shared/config/audiosInterfaz';
import { usePlayerStore } from '@/shared/store/usePlayerStore';
import { useAjustesStore } from '@/shared/store/useAjustesStore';

const hablarConVozDelNavegador = (texto: string) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const { vozLenta } = useAjustesStore.getState();
  window.speechSynthesis.cancel();
  const voz = new SpeechSynthesisUtterance(texto);
  voz.lang = 'es-CL';
  voz.rate = vozLenta ? 0.65 : 0.85;
  voz.pitch = 1.1;
  window.speechSynthesis.speak(voz);
};

/**
 * Dice algo en voz alta. Si se indica `clave`, usa la grabación de la voz del proyecto (la suave).
 * Solo si esa grabación no existe, lee el texto con la voz del navegador como respaldo.
 */
export const useHablar = () =>
  useCallback((texto: string, clave?: ClaveAudio) => {
    if (typeof window === 'undefined' || !useAjustesStore.getState().sonido) return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    const url = clave ? AUDIOS_INTERFAZ[clave] : undefined;
    if (url) usePlayerStore.getState().playAudio(url, { alFallar: () => hablarConVozDelNavegador(texto) });
    else hablarConVozDelNavegador(texto);
  }, []);
