import { describe, expect, it } from 'vitest';
import { apareceEnTexto, esPalabraValida, leerPalabras } from '@/features/docente/components/palabrasParaPracticar';

describe('leerPalabras', () => {
  it('separa por comas, quita espacios y repetidas', () => {
    expect(leerPalabras(' casa,  Perro ,casa, mamá ')).toEqual({ palabras: ['casa', 'Perro', 'mamá'], error: null });
  });

  it('campo vacío no es error', () => {
    expect(leerPalabras('  ')).toEqual({ palabras: [], error: null });
  });

  it('avisa si hay más de seis', () => {
    expect(leerPalabras('aa,bb,cc,dd,ee,ff,gg').error).toMatch(/hasta 6/);
  });

  it('avisa qué palabra no sirve', () => {
    expect(leerPalabras('casa, ca5a').error).toMatch(/«ca5a»/);
    expect(leerPalabras('a').error).toMatch(/«a»/);
  });
});

describe('esPalabraValida', () => {
  it('acepta tildes, eñes y espacios; rechaza números y símbolos', () => {
    expect(esPalabraValida('niño')).toBe(true);
    expect(esPalabraValida('cuarto de baño')).toBe(true);
    expect(esPalabraValida('x1')).toBe(false);
    expect(esPalabraValida('a'.repeat(31))).toBe(false);
  });
});

describe('apareceEnTexto', () => {
  it('ignora mayúsculas, tildes y puntuación, pero exige la palabra completa', () => {
    expect(apareceEnTexto('Mamá, el PERRO corre.', 'mama')).toBe(true);
    expect(apareceEnTexto('Mamá, el PERRO corre.', 'perro')).toBe(true);
    expect(apareceEnTexto('Los gatos duermen', 'gato')).toBe(false);
    expect(apareceEnTexto('Voy al cuarto de baño hoy', 'cuarto de baño')).toBe(true);
  });
});
