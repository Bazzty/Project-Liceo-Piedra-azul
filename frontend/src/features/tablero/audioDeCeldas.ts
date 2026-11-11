import { audioDeTexto } from '@/shared/audio/audioDeTexto';
import type { CeldaTablero, Pictograma } from '@/types';

/** Lo que dice la celda al tocarla: lo que la docente pidió o, si no, lo que se ve. */
export const textoHablado = (celda: CeldaTablero): string => (celda.textoHablado ?? celda.textoMostrado).trim();

/** El audio generado para la celda, solo si sigue siendo del texto que dice ahora. */
export const audioVigente = (celda: CeldaTablero): string | undefined =>
  celda.audioUrl && celda.audioTexto === textoHablado(celda) ? celda.audioUrl : undefined;

/**
 * Si hay que generar el audio de la celda: no lo necesita si ya tiene uno vigente, si el texto tiene una grabación de
 * la app (índice de audios) o si dice la misma palabra que su pictograma y este ya trae su grabación.
 */
export function necesitaAudio(celda: CeldaTablero, pic?: Pictograma): boolean {
  const texto = textoHablado(celda);
  if (!texto || audioVigente(celda) || audioDeTexto(texto)) return false;
  const esLaPalabraDelDibujo = celda.tipo === 'palabra' && !celda.textoHablado && texto.toLowerCase() === pic?.palabra.toLowerCase();
  return !(esLaPalabraDelDibujo && pic?.audioUrl);
}
