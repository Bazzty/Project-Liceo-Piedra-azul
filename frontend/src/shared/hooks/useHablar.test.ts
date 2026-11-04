import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHablar } from '@/shared/hooks/useHablar';
import { useAjustesStore } from '@/shared/store/useAjustesStore';
import { usePlayerStore } from '@/shared/store/usePlayerStore';

const voz = { speak: vi.fn(), cancel: vi.fn() };
const playAudio = vi.fn();

const hablarCon = () => renderHook(() => useHablar()).result.current;

describe('useHablar', () => {
  beforeEach(() => {
    voz.speak.mockReset();
    voz.cancel.mockReset();
    playAudio.mockReset();
    vi.stubGlobal('speechSynthesis', voz);
    vi.stubGlobal('SpeechSynthesisUtterance', class { text: string; constructor(texto: string) { this.text = texto; } });
    usePlayerStore.setState({ playAudio });
    useAjustesStore.setState({ sonido: true });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('un texto que tiene grabación suena con ese archivo y no con la voz del navegador', () => {
    hablarCon()('Como');

    expect(playAudio).toHaveBeenCalledWith('/audio/textos/como.mp3', expect.any(Object));
    expect(voz.speak).not.toHaveBeenCalled();
  });

  it('encuentra la grabación aunque el texto traiga mayúsculas, puntuación o espacios de más', () => {
    hablarCon()('  ¡COMO!  ');

    expect(playAudio).toHaveBeenCalledWith('/audio/textos/como.mp3', expect.any(Object));
  });

  it('dice en voz alta los dígitos del ingreso con su grabación', () => {
    hablarCon()('3');

    expect(playAudio).toHaveBeenCalledWith('/audio/textos/tres.mp3', expect.any(Object));
  });

  it('un texto sin grabación se lee con la voz del navegador', () => {
    hablarCon()('Texto que nadie grabó');

    expect(playAudio).not.toHaveBeenCalled();
    expect(voz.speak).toHaveBeenCalledTimes(1);
  });

  it('la clave manda sobre el texto', () => {
    hablarCon()('Como', 'hola');

    expect(playAudio).toHaveBeenCalledWith('/audio/personaje/bienvenida.mp3', expect.any(Object));
  });

  it('un texto como «constructor» no confunde al índice con propiedades heredadas', () => {
    hablarCon()('constructor');

    expect(playAudio).not.toHaveBeenCalled();
    expect(voz.speak).toHaveBeenCalledTimes(1);
  });

  it('si el archivo no se puede reproducir, cae a la voz del navegador', () => {
    hablarCon()('Como');
    const { alFallar } = playAudio.mock.calls[0][1] as { alFallar: () => void };

    alFallar();

    expect(voz.speak).toHaveBeenCalledTimes(1);
  });

  it('con el sonido apagado no dice nada', () => {
    useAjustesStore.setState({ sonido: false });

    hablarCon()('Como');

    expect(playAudio).not.toHaveBeenCalled();
    expect(voz.speak).not.toHaveBeenCalled();
  });
});
