import { audioDeTexto } from '@/shared/audio/audioDeTexto';
import type { ElementoDeVoz } from '@/shared/audio/decirSecuencia';

/** QWERTY simple: números y letras (con la Ñ). El espacio, borrar y Enter van aparte, en la fila de abajo. */
export const FILAS_DEL_TECLADO: string[][] = ['1234567890', 'qwertyuiop', 'asdfghjklñ', 'zxcvbnm'].map((fila) => [...fila]);

export type AccionDeTecla = 'espacio' | 'borrar' | 'enter';

/** Cuántos caracteres puede tener una palabra: más largas no caben en la burbuja y no las lee ningún niño de Kínder. */
export const MAXIMO_DE_CARACTERES = 20;

const esDigito = (tecla: string) => /^[0-9]$/.test(tecla);

/** Nombre del archivo de una letra; la Ñ no puede ir en el nombre de un archivo. */
const archivoDeLetra = (letra: string) => (letra === 'ñ' ? 'enie' : letra);

/**
 * Lo que suena al tocar una tecla: el **sonido** de la letra (/m/, no «eme») desde `public/audio/fonemas/`, o el número
 * dicho. Si falta la grabación de una letra, `decirSecuencia` usa la voz del navegador, que dirá su nombre: es solo un
 * respaldo hasta generar esos audios (ver docs/tablero-comunicacion.md).
 */
export function vozDeTecla(tecla: string): ElementoDeVoz {
  if (esDigito(tecla)) return { texto: tecla, audioUrl: audioDeTexto(tecla) };
  return { texto: tecla === 'ñ' ? 'eñe' : tecla, audioUrl: `/audio/fonemas/${archivoDeLetra(tecla)}.mp3` };
}

/** Lo que suena al terminar una palabra: su grabación si existe y, si no, la voz del navegador. */
export const vozDePalabra = (palabra: string): ElementoDeVoz => ({ texto: palabra, audioUrl: audioDeTexto(palabra) });

/**
 * Traduce una tecla del teclado físico a lo que hace en el tablero: una letra o número, o una acción.
 * `null` si no corresponde (flechas, F5, Escape…). Las vocales con tilde valen como la vocal.
 */
export function teclaDeEvento(key: string): string | AccionDeTecla | null {
  if (key === 'Backspace') return 'borrar';
  if (key === 'Enter') return 'enter';
  if (key === ' ') return 'espacio';
  if (key.length !== 1) return null;
  const minuscula = key.toLowerCase();
  if (minuscula === 'ñ') return 'ñ';
  const sinTilde = minuscula.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return /^[a-z0-9]$/.test(sinTilde) ? sinTilde : null;
}
