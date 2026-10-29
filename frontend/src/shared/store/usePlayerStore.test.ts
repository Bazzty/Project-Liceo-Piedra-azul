import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlayerStore } from '@/shared/store/usePlayerStore';

class AudioFalso {
  static instancias: AudioFalso[] = [];
  playbackRate = 1;
  currentTime = 0;
  onplay: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  rechazo: Error | null = null;
  src: string;
  constructor(src: string) {
    this.src = src;
    AudioFalso.instancias.push(this);
  }
  pause() {}
  play() {
    return this.rechazo ? Promise.reject(this.rechazo) : Promise.resolve();
  }
}

const esperar = () => new Promise((r) => setTimeout(r, 0));

describe('usePlayerStore.playAudio', () => {
  beforeEach(() => {
    AudioFalso.instancias = [];
    vi.stubGlobal('Audio', AudioFalso);
    usePlayerStore.getState().stopAudio();
  });

  it('usa el respaldo si el navegador bloquea la reproducción automática', async () => {
    const alFallar = vi.fn();
    vi.spyOn(AudioFalso.prototype, 'play').mockRejectedValueOnce(Object.assign(new Error('bloqueado'), { name: 'NotAllowedError' }));
    usePlayerStore.getState().playAudio('a.mp3', { alFallar });
    await esperar();
    expect(alFallar).toHaveBeenCalledTimes(1);
    expect(usePlayerStore.getState().activeAudioInstance).toBeNull();
  });

  it('no llama al respaldo dos veces si además falla la carga', async () => {
    const alFallar = vi.fn();
    vi.spyOn(AudioFalso.prototype, 'play').mockRejectedValueOnce(new Error('x'));
    usePlayerStore.getState().playAudio('a.mp3', { alFallar });
    AudioFalso.instancias[0].onerror?.();
    await esperar();
    expect(alFallar).toHaveBeenCalledTimes(1);
  });

  it('un audio reemplazado no borra el estado del que suena', () => {
    usePlayerStore.getState().playAudio('a.mp3');
    usePlayerStore.getState().playAudio('b.mp3');
    const [viejo, nuevo] = AudioFalso.instancias;
    viejo.onerror?.();
    viejo.onended?.();
    expect(usePlayerStore.getState().activeAudioInstance).toBe(nuevo);
  });
});
