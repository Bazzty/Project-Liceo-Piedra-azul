import { describe, expect, it } from 'vitest';
import { generarRondas, primeraSilaba } from '@/features/aprender/actividades/generarRondas';
import { CUENTOS_KINDER } from '@/mocks/cuentosKinder';

describe('primeraSilaba', () => {
  it.each([
    ['mesa', 'me'],
    ['Sapo', 'sa'],
    ['árbol', 'á'],
    ['plato', 'pla'],
  ])('%s → %s', (palabra, silaba) => {
    expect(primeraSilaba(palabra)).toBe(silaba);
  });
});

describe('generarRondas', () => {
  const [cuento, ...otros] = CUENTOS_KINDER;

  it('arma a lo más 5 rondas, y siempre las mismas para el mismo cuento y vuelta', () => {
    const rondas = generarRondas(cuento, otros, 0);

    expect(rondas.length).toBeGreaterThan(0);
    expect(rondas.length).toBeLessThanOrEqual(5);
    expect(generarRondas(cuento, otros, 0)).toEqual(rondas);
    expect(generarRondas(cuento, otros, 1)).not.toEqual(rondas);
  });

  it('la respuesta correcta siempre está entre las opciones', () => {
    for (let vuelta = 0; vuelta < 10; vuelta += 1) {
      for (const r of generarRondas(cuento, otros, vuelta)) {
        if (r.tipo === 'escucha' || r.tipo === 'lee') expect(r.opciones.map((o) => o.texto)).toContain(r.meta.texto);
        if (r.tipo === 'sonido') expect(r.opciones).toContain(r.correcta);
        if (r.tipo === 'completa') expect(r.opciones.map((o) => o.texto)).toContain(r.palabras[r.hueco].texto);
      }
    }
  });

  it('sin palabras con imagen no inventa rondas', () => {
    const vacio = { ...cuento, paginas: [] };
    expect(generarRondas(vacio, [], 0)).toEqual([]);
  });
});
