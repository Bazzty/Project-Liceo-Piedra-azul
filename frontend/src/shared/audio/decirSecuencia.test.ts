import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { decirSecuencia } from '@/shared/audio/decirSecuencia';
import { useAjustesStore } from '@/shared/store/useAjustesStore';
import { usePlayerStore } from '@/shared/store/usePlayerStore';

const voz = { speak: vi.fn(), cancel: vi.fn() };
const sonados: string[] = [];

/** Un reproductor falso: «/roto.mp3» falla (como un archivo que no existe) y el resto suena y termina. */
const playAudio = vi.fn((url: string, opciones?: { alFallar?: () => void }) => {
  if (url.includes('roto')) {
    usePlayerStore.setState({ activeAudioInstance: null });
    opciones?.alFallar?.();
    return;
  }
  sonados.push(url);
  const audio = new EventTarget() as unknown as HTMLAudioElement;
  usePlayerStore.setState({ activeAudioInstance: audio });
  setTimeout(() => audio.dispatchEvent(new Event('ended')), 0);
});

describe('decirSecuencia', () => {
  beforeEach(() => {
    sonados.length = 0;
    playAudio.mockClear();
    voz.speak.mockReset().mockImplementation((u: { onend?: () => void }) => u.onend?.());
    voz.cancel.mockReset();
    vi.stubGlobal('speechSynthesis', voz);
    vi.stubGlobal('SpeechSynthesisUtterance', class { text: string; lang = ''; rate = 1; pitch = 1; onend?: () => void; onerror?: () => void; constructor(texto: string) { this.text = texto; } });
    usePlayerStore.setState({ playAudio });
    useAjustesStore.setState({ sonido: true, vozLenta: false });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('usa la grabación del propio elemento', async () => {
    await decirSecuencia([{ texto: 'Gracias', audioUrl: '/audio/pictogramas/gracias.mp3' }]);

    expect(sonados).toEqual(['/audio/pictogramas/gracias.mp3']);
    expect(voz.speak).not.toHaveBeenCalled();
  });

  it('sin audioUrl busca la grabación que tenga ese texto, en vez de leer con el navegador', async () => {
    await decirSecuencia([{ texto: 'Gracias' }]);

    expect(sonados).toEqual(['/audio/pictogramas/gracias.mp3']);
    expect(voz.speak).not.toHaveBeenCalled();
  });

  it('si el audioUrl falla, prueba la grabación del texto antes de leer con el navegador', async () => {
    await decirSecuencia([{ texto: 'Gracias', audioUrl: '/roto.mp3' }]);

    expect(sonados).toEqual(['/audio/pictogramas/gracias.mp3']);
    expect(voz.speak).not.toHaveBeenCalled();
  });

  it('un texto sin ninguna grabación se lee con la voz del navegador', async () => {
    await decirSecuencia([{ texto: 'Palabra que nadie grabó' }]);

    expect(sonados).toEqual([]);
    expect(voz.speak).toHaveBeenCalledTimes(1);
  });

  it('dice una frase palabra por palabra, en orden', async () => {
    await decirSecuencia([{ texto: 'sí' }, { texto: 'más' }, { texto: 'terminado' }]);

    expect(sonados).toEqual(['/audio/pictogramas/si.mp3', '/audio/pictogramas/mas.mp3', '/audio/pictogramas/terminado.mp3']);
  });

  it('con el sonido apagado no reproduce nada', async () => {
    useAjustesStore.setState({ sonido: false });

    await decirSecuencia([{ texto: 'Gracias' }]);

    expect(playAudio).not.toHaveBeenCalled();
    expect(voz.speak).not.toHaveBeenCalled();
  });
});
