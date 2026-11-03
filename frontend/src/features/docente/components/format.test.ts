import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatearFecha, normalizar, porcentajeAvance } from '@/features/docente/components/format';
import type { Cuento } from '@/types';

const cuento = { paginas: [{}, {}, {}, {}] } as unknown as Cuento;

describe('formato del panel docente', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 2, 12, 0));
  });
  afterEach(() => vi.useRealTimers());

  it('compara palabras sin tildes ni mayúsculas', () => {
    expect(normalizar('  Árbol ')).toBe('arbol');
    expect(normalizar('Ñandú')).toBe('nandu');
  });

  it('dice hoy, ayer o la fecha corta', () => {
    expect(formatearFecha(new Date(2026, 10, 2, 10, 40).toISOString())).toBe('Hoy, 10:40');
    expect(formatearFecha(new Date(2026, 10, 1, 18, 5).toISOString())).toBe('Ayer, 18:05');
    expect(formatearFecha(new Date(2026, 9, 12, 9, 30).toISOString())).toBe('12/10, 09:30');
  });

  it('calcula el avance sin pasar de 100', () => {
    expect(porcentajeAvance(undefined, cuento)).toBe(0);
    expect(porcentajeAvance({ paginaActual: 1 } as never, cuento)).toBe(25);
    expect(porcentajeAvance({ paginaActual: 9 } as never, cuento)).toBe(100);
    expect(porcentajeAvance({ paginaActual: 1, completado: true } as never, cuento)).toBe(100);
  });
});
