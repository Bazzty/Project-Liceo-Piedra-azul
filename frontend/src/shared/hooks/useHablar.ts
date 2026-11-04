import { useCallback } from 'react';
import { audioDeTexto } from '@/shared/audio/audioDeTexto';
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

/** Corta lo que se esté diciendo, grabación o voz del navegador. */
export const callar = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  usePlayerStore.getState().stopAudio();
};

/**
 * Dice algo en voz alta con la voz del osito. Busca primero la grabación: la de la `clave` si se indica
 * (ver audiosInterfaz.ts) y, si no, la que tenga ese mismo texto (una palabra, un número, el nombre de un
 * sticker…; ver audiosPorTexto.json). Solo si no hay ninguna, lee el texto con la voz del navegador.
 */
export const useHablar = () =>
  useCallback((texto: string, clave?: ClaveAudio) => {
    if (typeof window === 'undefined' || !useAjustesStore.getState().sonido) return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    const url = (clave ? AUDIOS_INTERFAZ[clave] : undefined) ?? audioDeTexto(texto);
    if (url) usePlayerStore.getState().playAudio(url, { alFallar: () => hablarConVozDelNavegador(texto) });
    else hablarConVozDelNavegador(texto);
  }, []);
