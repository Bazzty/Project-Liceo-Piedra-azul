import { describe, expect, it } from 'vitest';
import { audioVigente, necesitaAudio } from '@/features/tablero/audioDeCeldas';
import type { CeldaTablero, Pictograma } from '@/types';

const celda = (extra: Partial<CeldaTablero> = {}): CeldaTablero => ({ id: 'c', tipo: 'palabra', textoMostrado: 'zapallito', categoriaId: 'x', ...extra });
const pic = (extra: Partial<Pictograma> = {}): Pictograma => ({ id: 'p', palabra: 'zapallito', categoria: 'x', imagenUrl: '', esFotoReal: false, ...extra });

describe('audioVigente', () => {
  it('vale mientras el texto sea el mismo para el que se generó', () => {
    expect(audioVigente(celda({ audioUrl: '/a.mp3', audioTexto: 'zapallito' }))).toBe('/a.mp3');
  });

  it('deja de valer si cambió lo que se muestra o lo que se dice', () => {
    expect(audioVigente(celda({ audioUrl: '/a.mp3', audioTexto: 'zapallito', textoMostrado: 'zapallitos' }))).toBeUndefined();
    expect(audioVigente(celda({ audioUrl: '/a.mp3', audioTexto: 'zapallito', textoHablado: 'Quiero zapallito' }))).toBeUndefined();
  });
});

describe('necesitaAudio', () => {
  it('una palabra nueva sin grabación necesita audio', () => {
    expect(necesitaAudio(celda(), pic())).toBe(true);
  });

  it('no si ya tiene uno vigente', () => {
    expect(necesitaAudio(celda({ audioUrl: '/a.mp3', audioTexto: 'zapallito' }), pic())).toBe(false);
  });

  it('sí si el audio que tenía era de otro texto', () => {
    expect(necesitaAudio(celda({ audioUrl: '/a.mp3', audioTexto: 'otra', textoHablado: 'Quiero zapallito' }), pic())).toBe(true);
  });

  it('no si la palabra ya tiene grabación en la app', () => {
    expect(necesitaAudio(celda({ textoMostrado: 'mesa' }), pic({ palabra: 'mesa' }))).toBe(false);
  });

  it('no si dice la palabra de su pictograma y este trae grabación, pero sí si dice otra cosa', () => {
    expect(necesitaAudio(celda(), pic({ audioUrl: '/p.mp3' }))).toBe(false);
    expect(necesitaAudio(celda({ textoHablado: 'Quiero zapallito' }), pic({ audioUrl: '/p.mp3' }))).toBe(true);
  });

  it('una carpeta sin grabación del nombre necesita audio, aunque su dibujo tenga el suyo', () => {
    expect(necesitaAudio(celda({ tipo: 'carpeta', textoMostrado: 'Zapallitos' }), pic({ palabra: 'Zapallitos', audioUrl: '/p.mp3' }))).toBe(true);
  });

  it('un texto vacío no necesita nada', () => {
    expect(necesitaAudio(celda({ textoMostrado: '  ' }), pic())).toBe(false);
  });
});
