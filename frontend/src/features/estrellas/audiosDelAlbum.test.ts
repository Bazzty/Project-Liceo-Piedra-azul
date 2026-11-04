import { describe, expect, it } from 'vitest';
import { PAGINAS, STICKERS } from '@/features/estrellas/stickers';
import { claveDeTexto } from '@/shared/audio/claveDeTexto';
import AUDIO_POR_TEXTO from '@/shared/config/audiosPorTexto.json';

const INDICE: Record<string, string> = AUDIO_POR_TEXTO;
const sinAudio = (textos: string[]) => textos.filter((t) => !Object.hasOwn(INDICE, claveDeTexto(t)));

describe('álbum de estrellas: el osito dice cada nombre con su grabación', () => {
  it('todo sticker tiene su audio (si falla: agrégalo al manifiesto y corre npm run audios)', () => {
    expect(sinAudio(STICKERS.map((s) => s.nombre))).toEqual([]);
  });

  it('toda página del álbum tiene su audio', () => {
    expect(sinAudio(PAGINAS.map((p) => p.nombre))).toEqual([]);
  });

  it('cada día de la semana y su «jugaste» tienen audio', () => {
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

    expect(sinAudio([...dias, ...dias.map((d) => `${d}: ¡jugaste!`), 'Todavía no lo tienes. ¡Sigue jugando!'])).toEqual([]);
  });
});
