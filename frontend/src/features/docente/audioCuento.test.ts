import { beforeEach, describe, expect, it, vi } from 'vitest';
import { conAudios, generarAudiosDeCuento } from '@/features/docente/audioCuento';
import type { CuentoPagina } from '@/types';

const { generarAudio } = vi.hoisted(() => ({ generarAudio: vi.fn() }));
vi.mock('@/api/servidor', () => ({ generarAudio }));

const pagina = (n: number, texto: string): CuentoPagina => ({ numeroPagina: n, textoCompleto: texto, palabras: [] });

describe('generarAudiosDeCuento', () => {
  beforeEach(() => {
    generarAudio.mockReset();
    generarAudio.mockImplementation(async (texto: string) => ({ url: `/audio-generado/${texto.length}.mp3`, voz: 'elevenlabs', enCache: false, respaldo: false }));
  });

  it('pide un audio por página, en orden, e informa el avance', async () => {
    const avance: Array<[number, number]> = [];

    const { urls } = await generarAudiosDeCuento([pagina(1, 'Hola'), pagina(2, 'El oso lee')], (h, t) => avance.push([h, t]));

    expect(generarAudio.mock.calls.map(([t]) => t)).toEqual(['Hola', 'El oso lee']);
    expect(urls).toEqual({ Hola: '/audio-generado/4.mp3', 'El oso lee': '/audio-generado/10.mp3' });
    expect(avance).toEqual([[0, 2], [1, 2], [2, 2]]);
  });

  it('entrega cada audio apenas existe, así que si una página falla las anteriores se conservan', async () => {
    const recibidos: Array<[string, string]> = [];
    generarAudio.mockReset();
    generarAudio.mockResolvedValueOnce({ url: '/uno.mp3', voz: 'piper', enCache: false, respaldo: false });
    generarAudio.mockRejectedValueOnce(new Error('sin voz'));

    await expect(
      generarAudiosDeCuento([pagina(1, 'Uno'), pagina(2, 'Dos')], undefined, (texto, url) => recibidos.push([texto, url])),
    ).rejects.toThrow('sin voz');

    expect(recibidos).toEqual([['Uno', '/uno.mp3']]);
  });

  it('no repite el pedido para frases iguales', async () => {
    await generarAudiosDeCuento([pagina(1, 'Hola'), pagina(2, 'Hola')]);

    expect(generarAudio).toHaveBeenCalledTimes(1);
  });

  it('avisa si alguna página salió con la voz de respaldo', async () => {
    generarAudio.mockResolvedValueOnce({ url: '/a.mp3', voz: 'elevenlabs', enCache: false, respaldo: false });
    generarAudio.mockResolvedValueOnce({ url: '/b.mp3', voz: 'piper', enCache: false, respaldo: true });

    expect((await generarAudiosDeCuento([pagina(1, 'Uno'), pagina(2, 'Dos')])).respaldo).toBe(true);
  });

  it('se detiene en la primera página que falla', async () => {
    generarAudio.mockResolvedValueOnce({ url: '/a.mp3', voz: 'piper', enCache: false, respaldo: false });
    generarAudio.mockRejectedValueOnce(new Error('sin voz'));

    await expect(generarAudiosDeCuento([pagina(1, 'Uno'), pagina(2, 'Dos'), pagina(3, 'Tres')])).rejects.toThrow('sin voz');
    expect(generarAudio).toHaveBeenCalledTimes(2);
  });
});

describe('generarAudiosDeCuento con señal de aborto', () => {
  it('no pide más páginas cuando la señal se aborta', async () => {
    const control = new AbortController();
    generarAudio.mockReset();
    generarAudio.mockResolvedValue({ url: '/a.mp3', voz: 'piper', enCache: false, respaldo: false });

    await generarAudiosDeCuento([pagina(1, 'Uno'), pagina(2, 'Dos')], undefined, () => control.abort(), control.signal);

    expect(generarAudio).toHaveBeenCalledTimes(1);
  });
});

describe('conAudios', () => {
  it('asigna cada audio a la página con ese texto y no toca las demás', () => {
    const resultado = conAudios([pagina(1, 'Hola'), pagina(2, 'Cambiada después')], { Hola: '/audio-generado/h.mp3' });

    expect(resultado[0].audioPaginaUrl).toBe('/audio-generado/h.mp3');
    expect(resultado[1].audioPaginaUrl).toBeUndefined();
  });
});
