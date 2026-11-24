import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEscritura } from '@/features/tablero/useEscritura';
import type { PalabraDeFrase } from '@/shared/store/useTableroStore';

const { sonarLleno } = vi.hoisted(() => ({ sonarLleno: vi.fn() }));
vi.mock('@/shared/audio/sonidos', () => ({ sonarLleno }));
vi.mock('@/shared/audio/decirSecuencia', () => ({ decirSecuencia: vi.fn(async () => {}) }));

const palabra = (n: number): PalabraDeFrase => ({ id: `p${n}`, palabra: `p${n}`, categoria: 'x', imagenUrl: '', esFotoReal: false });
const frase = (n: number) => Array.from({ length: n }, (_, i) => palabra(i));

beforeEach(() => sonarLleno.mockClear());

describe('useEscritura con la frase llena', () => {
  it('sin nada escrito, escribir no hace nada y suena el aviso', () => {
    const { result } = renderHook(() => useEscritura({ frase: frase(8), setFrase: vi.fn(), maximo: 8, cortar: vi.fn() }));
    expect(result.current.bloqueada).toBe(true);
    act(() => result.current.escribir('a'));
    expect(result.current.escribiendo).toBe('');
    expect(sonarLleno).toHaveBeenCalledTimes(1);
  });

  it('si la frase se llena con una palabra a medias, esa palabra se conserva y el espacio solo avisa', () => {
    const setFrase = vi.fn();
    const { result, rerender } = renderHook(({ f }) => useEscritura({ frase: f, setFrase, maximo: 8, cortar: vi.fn() }), {
      initialProps: { f: frase(7) },
    });
    act(() => result.current.escribir('h'));
    act(() => result.current.escribir('o'));
    rerender({ f: frase(8) });
    expect(result.current.llena).toBe(true);
    expect(result.current.bloqueada).toBe(false);
    act(() => result.current.espacio());
    expect(result.current.escribiendo).toBe('ho');
    expect(setFrase).not.toHaveBeenCalled();
    expect(sonarLleno).toHaveBeenCalledTimes(1);
  });

  it('al pedir que el osito la diga, la palabra se conserva sin sonar el aviso', () => {
    const { result, rerender } = renderHook(({ f }) => useEscritura({ frase: f, setFrase: vi.fn(), maximo: 8, cortar: vi.fn() }), {
      initialProps: { f: frase(7) },
    });
    act(() => result.current.escribir('h'));
    rerender({ f: frase(8) });
    let devuelta: PalabraDeFrase[] = [];
    act(() => {
      devuelta = result.current.cerrarPalabra({ avisar: false });
    });
    expect(devuelta).toHaveLength(8);
    expect(result.current.escribiendo).toBe('h');
    expect(sonarLleno).not.toHaveBeenCalled();
  });
});
