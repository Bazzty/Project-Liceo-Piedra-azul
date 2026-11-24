import { describe, expect, it } from 'vitest';
import { FILAS_DEL_TECLADO, teclaDeEvento, vozDeTecla, vozDePalabra } from '@/features/tablero/teclado';

describe('FILAS_DEL_TECLADO', () => {
  const todas = FILAS_DEL_TECLADO.flat();

  it('trae los diez números, las 26 letras del alfabeto y la Ñ, cada una una sola vez', () => {
    expect(todas).toHaveLength(37);
    expect(new Set(todas).size).toBe(37);
    for (const c of '0123456789abcdefghijklmnopqrstuvwxyzñ') expect(todas).toContain(c);
  });

  it('es QWERTY: las filas empiezan como en un teclado', () => {
    expect(FILAS_DEL_TECLADO.map((f) => f.slice(0, 3).join(''))).toEqual(['123', 'qwe', 'asd', 'zxc']);
  });
});

describe('vozDeTecla', () => {
  it('una letra suena con su sonido grabado, no con su nombre', () => {
    expect(vozDeTecla('m')).toEqual({ texto: 'm', audioUrl: '/audio/fonemas/m.mp3' });
    expect(vozDeTecla('a').audioUrl).toBe('/audio/fonemas/a.mp3');
  });

  it('la Ñ usa un nombre de archivo sin Ñ y, si falta, la voz dice «eñe»', () => {
    expect(vozDeTecla('ñ')).toEqual({ texto: 'eñe', audioUrl: '/audio/fonemas/enie.mp3' });
  });

  it('un número suena con la grabación del número', () => {
    expect(vozDeTecla('1')).toEqual({ texto: '1', audioUrl: '/audio/textos/uno.mp3' });
    expect(vozDeTecla('0').audioUrl).toBe('/audio/textos/cero.mp3');
  });

  it('todos los números tienen grabación', () => {
    for (const n of '0123456789') expect(vozDeTecla(n).audioUrl).toMatch(/^\/audio\/textos\/.+\.mp3$/);
  });
});

describe('vozDePalabra', () => {
  it('usa la grabación si la palabra la tiene y, si no, deja la voz del navegador', () => {
    expect(vozDePalabra('mesa').audioUrl).toMatch(/^\/audio\/.+mesa\.mp3$/);
    expect(vozDePalabra('zzzz').audioUrl).toBeUndefined();
  });
});

describe('teclaDeEvento', () => {
  it('traduce letras y números, sin importar mayúsculas', () => {
    expect(teclaDeEvento('a')).toBe('a');
    expect(teclaDeEvento('M')).toBe('m');
    expect(teclaDeEvento('7')).toBe('7');
  });

  it('la Ñ se conserva y las vocales con tilde valen como la vocal', () => {
    expect(teclaDeEvento('ñ')).toBe('ñ');
    expect(teclaDeEvento('Ñ')).toBe('ñ');
    expect(teclaDeEvento('á')).toBe('a');
    expect(teclaDeEvento('ü')).toBe('u');
  });

  it('reconoce las tres acciones', () => {
    expect(teclaDeEvento('Backspace')).toBe('borrar');
    expect(teclaDeEvento('Enter')).toBe('enter');
    expect(teclaDeEvento(' ')).toBe('espacio');
  });

  it('ignora lo demás: flechas, Escape, símbolos', () => {
    for (const k of ['Escape', 'ArrowLeft', 'Tab', 'F5', 'Shift', '.', '-', '@']) expect(teclaDeEvento(k)).toBeNull();
  });
});
