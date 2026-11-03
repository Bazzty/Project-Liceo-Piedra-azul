import { describe, expect, it } from 'vitest';
import { ordenDeStickers, STICKERS } from '@/features/estrellas/stickers';

describe('ordenDeStickers', () => {
  it('cada niño recibe todos los stickers una vez, en un orden propio y estable', () => {
    const ana = ordenDeStickers('alumno-ana');

    expect([...ana].sort((a, b) => a - b)).toEqual(STICKERS.map((_, i) => i));
    expect(ordenDeStickers('alumno-ana')).toEqual(ana);
    expect(ordenDeStickers('alumno-beto')).not.toEqual(ana);
  });

  it('los stickers tienen id único', () => {
    expect(new Set(STICKERS.map((s) => s.id)).size).toBe(STICKERS.length);
  });
});
