import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BarridoUnBoton } from '@/shared/components/BarridoUnBoton';
import { AUDIOS_INTERFAZ } from '@/shared/config/audiosInterfaz';
import { useAjustesStore } from '@/shared/store/useAjustesStore';
import { usePlayerStore } from '@/shared/store/usePlayerStore';

const Pantalla = () => {
  const raiz = useRef<HTMLDivElement>(null);
  return (
    <div ref={raiz}>
      <div role="dialog">
        <button type="button">Cerrar</button>
        <div data-barrido-esperar>
          <button type="button" data-autofoco>
            Entendido
          </button>
        </div>
      </div>
      <BarridoUnBoton raiz={raiz} />
    </div>
  );
};

describe('BarridoUnBoton con instrucciones en pantalla', () => {
  const voz = { speaking: true, cancel: vi.fn(), speak: vi.fn() };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('speechSynthesis', voz);
    vi.stubGlobal('SpeechSynthesisUtterance', class {});
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 10, height: 10 } as DOMRect);
    HTMLElement.prototype.scrollIntoView = vi.fn(); // jsdom no lo implementa
    useAjustesStore.setState({ sonido: true, barridoVelocidad: 'normal' });
    voz.speaking = true;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('espera a que termine la voz y luego marca primero la acción principal', () => {
    render(<Pantalla />);

    act(() => void vi.advanceTimersByTime(4000));
    expect(screen.getByText('Entendido')).not.toHaveAttribute('data-barrido-activo');
    expect(voz.cancel).not.toHaveBeenCalled();

    voz.speaking = false;
    act(() => void vi.advanceTimersByTime(1800));
    expect(screen.getByText('Entendido')).toHaveAttribute('data-barrido-activo');
    expect(screen.getByText('Cerrar')).not.toHaveAttribute('data-barrido-activo');
  });
});

describe('BarridoUnBoton con data-clave-voz', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('dice el elemento marcado con su grabación (voz del osito) y no con la voz del navegador', () => {
    vi.useFakeTimers();
    const playAudio = vi.fn();
    usePlayerStore.setState({ playAudio });
    vi.stubGlobal('speechSynthesis', { speaking: false, cancel: vi.fn(), speak: vi.fn() });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 10, height: 10 } as DOMRect);
    HTMLElement.prototype.scrollIntoView = vi.fn();
    useAjustesStore.setState({ sonido: true, barridoVelocidad: 'normal' });
    const Con = () => {
      const raiz = useRef<HTMLDivElement>(null);
      return (
        <div ref={raiz}>
          <main>
            <button type="button" data-clave-voz="guardar_cuento">
              Guardar en mis cuentos
            </button>
          </main>
          <BarridoUnBoton raiz={raiz} />
        </div>
      );
    };
    render(<Con />);

    act(() => void vi.advanceTimersByTime(1800));

    expect(playAudio).toHaveBeenCalledWith(AUDIOS_INTERFAZ.guardar_cuento, expect.anything());
  });
});
