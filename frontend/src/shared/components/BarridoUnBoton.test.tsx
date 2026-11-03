import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BarridoUnBoton } from '@/shared/components/BarridoUnBoton';
import { useAjustesStore } from '@/shared/store/useAjustesStore';

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
