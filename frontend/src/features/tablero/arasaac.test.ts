import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchArasaacPictogramId, getArasaacImageUrl } from '@/features/tablero/arasaac';

describe('ARASAAC', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('arma la URL de la imagen', () => {
    expect(getArasaacImageUrl(2432)).toBe('https://static.arasaac.org/pictograms/2432/2432_500.png');
  });

  it('busca sin tildes y toma el primer resultado', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ _id: 11, keywords: [] }, { _id: 22, keywords: [] }] });
    vi.stubGlobal('fetch', fetch);

    expect(await fetchArasaacPictogramId('  Árbol ')).toBe(11);
    expect(fetch).toHaveBeenCalledWith('https://api.arasaac.org/v1/pictograms/es/search/arbol');
  });

  it('usa las excepciones sin llamar a la API y no se cae si falla', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('sin red'));
    vi.stubGlobal('fetch', fetch);

    expect(await fetchArasaacPictogramId('Dama')).toBe(2432);
    expect(fetch).not.toHaveBeenCalled();
    expect(await fetchArasaacPictogramId('sapo')).toBeNull();
    expect(await fetchArasaacPictogramId('   ')).toBeNull();
  });
});
