import { describe, expect, it } from 'vitest';
import { letraDeNivel, NIVELES_CAMINO } from '@/shared/config/niveles';

describe('NIVELES_CAMINO', () => {
  it('empieza por sílabas y sigue con vocales', () => {
    expect(NIVELES_CAMINO.map((n) => n.nombre)).toEqual(['Sílabas', 'Vocales', 'Palabras', 'Cuentos', 'Historias']);
    expect(letraDeNivel('nivel-a')).toBe('A');
    expect(letraDeNivel('nivel-vocales')).toBe('B');
  });

  it('cada nivel trae instrucciones para que el osito las diga', () => {
    for (const nivel of NIVELES_CAMINO) expect(nivel.instrucciones.trim().length).toBeGreaterThan(0);
  });
});
