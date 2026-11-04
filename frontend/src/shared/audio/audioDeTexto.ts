import { claveDeTexto } from '@/shared/audio/claveDeTexto';
import AUDIO_POR_TEXTO from '@/shared/config/audiosPorTexto.json';

const AUDIOS_POR_TEXTO: Record<string, string> = AUDIO_POR_TEXTO;

/**
 * Grabación con la voz del osito de un texto exacto (una palabra, un número, un sticker…), o `undefined`.
 * Solo claves propias: un texto como «constructor» no debe devolver una propiedad heredada del objeto.
 */
export const audioDeTexto = (texto: string): string | undefined => {
  const clave = claveDeTexto(texto);
  return Object.hasOwn(AUDIOS_POR_TEXTO, clave) ? AUDIOS_POR_TEXTO[clave] : undefined;
};
