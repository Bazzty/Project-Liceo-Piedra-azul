import { afterEach, describe, expect, it, vi } from 'vitest';
import { idUnico } from '@/shared/idUnico';

describe('idUnico', () => {
  afterEach(() => vi.restoreAllMocks());

  it('entrega 32 caracteres hexadecimales distintos en cada llamada', () => {
    const primero = idUnico();
    expect(primero).toMatch(/^[0-9a-f]{32}$/);
    expect(idUnico()).not.toBe(primero);
  });

  it('funciona sin crypto.randomUUID, como en un navegador sin HTTPS', () => {
    vi.spyOn(crypto, 'randomUUID').mockImplementation(() => {
      throw new TypeError('crypto.randomUUID is not a function');
    });
    expect(idUnico()).toMatch(/^[0-9a-f]{32}$/);
  });
});
