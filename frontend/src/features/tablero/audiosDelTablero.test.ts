import { describe, expect, it } from 'vitest';
import { audioDeTexto } from '@/shared/audio/audioDeTexto';

// Las palabras núcleo del tablero «Hablar» se siembran en src/mocks/seed.ts (sembrarPalabrasNucleo) y llevan su
// audio por archivo; esto comprueba además que el texto exacto resuelva, que es lo que usa decirSecuencia como respaldo.
const NUCLEO = ['sí', 'no', 'más', 'terminado', 'gracias', 'abrazo'];

describe('tablero Hablar: el osito dice cada palabra con su grabación', () => {
  it.each(NUCLEO)('«%s» tiene audio', (palabra) => {
    expect(audioDeTexto(palabra)).toMatch(/^\/audio\/.+\.mp3$/);
  });

  it('el botón de ayuda tiene su propia frase grabada, distinta de la palabra suelta', () => {
    expect(audioDeTexto('Necesito ayuda')).toBe('/audio/textos/necesito_ayuda.mp3');
    expect(audioDeTexto('ayuda')).not.toBe(audioDeTexto('Necesito ayuda'));
  });

  it('un texto como «constructor» no devuelve una propiedad heredada', () => {
    expect(audioDeTexto('constructor')).toBeUndefined();
  });
});
