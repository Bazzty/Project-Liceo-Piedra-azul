import { describe, expect, it } from 'vitest';
import { COLORES_TABLERO } from '@/features/tablero/coloresTablero';
import {
  CATEGORIAS_INICIALES,
  conImagenesDeCarpeta,
  construirPlantillaGeneral,
  IMAGEN_CARPETA,
  ID_PLANTILLA_GENERAL,
  PALABRAS_NUCLEO,
} from '@/features/tablero/plantillaGeneral';
import { catalogo } from '@/features/tablero/catalogoDePrueba';

describe('construirPlantillaGeneral', () => {
  const tableros = construirPlantillaGeneral(catalogo);
  const principal = tableros[0];

  it('el primer tablero es el principal y todos son plantilla', () => {
    expect(principal).toMatchObject({ id: ID_PLANTILLA_GENERAL, principal: true, esPlantilla: true });
    expect(tableros.slice(1).every((t) => t.esPlantilla && !t.principal && !t.alumnoId)).toBe(true);
  });

  it('las palabras núcleo van primero, en su orden, marcadas como núcleo', () => {
    const nucleo = principal.celdas.slice(0, PALABRAS_NUCLEO.length);
    expect(nucleo.map((c) => c.pictogramaId)).toEqual(PALABRAS_NUCLEO);
    expect(nucleo.every((c) => c.esNucleo)).toBe(true);
    expect(principal.celdas.slice(PALABRAS_NUCLEO.length).some((c) => c.esNucleo)).toBe(false);
  });

  it('hay una carpeta por categoría, en orden, y cada una abre un tablero que existe', () => {
    const carpetas = principal.celdas.filter((c) => c.tipo === 'carpeta');
    expect(carpetas.map((c) => c.categoriaId)).toEqual(['necesidades', 'emociones', 'personas', 'acciones', 'objetos']);
    const ids = new Set(tableros.map((t) => t.id));
    expect(carpetas.every((c) => c.destinoTableroId && ids.has(c.destinoTableroId))).toBe(true);
  });

  it('las palabras de cada carpeta van ordenadas y son de su categoría', () => {
    const acciones = tableros.find((t) => t.nombre === 'Acciones');
    expect(acciones?.celdas.map((c) => c.textoMostrado)).toEqual(['abrazo', 'jugar']);
    expect(acciones?.celdas.every((c) => c.categoriaId === 'acciones')).toBe(true);
  });

  it('cada pictograma del catálogo aparece una sola vez en toda la plantilla', () => {
    const usados = tableros.flatMap((t) => t.celdas).filter((c) => c.tipo === 'palabra').map((c) => c.pictogramaId);
    expect(new Set(usados).size).toBe(usados.length);
    expect([...usados].sort()).toEqual(catalogo.map((p) => p.id).sort());
  });

  it('una palabra «básica» que no es núcleo queda suelta en el principal y no se pierde', () => {
    expect(principal.celdas.some((c) => c.pictogramaId === 'pic-hola' && c.tipo === 'palabra')).toBe(true);
  });

  it('los ids de tablero y de celda son únicos y toda categoría usada existe', () => {
    const idsTablero = tableros.map((t) => t.id);
    expect(new Set(idsTablero).size).toBe(idsTablero.length);
    const celdas = tableros.flatMap((t) => t.celdas);
    expect(new Set(celdas.map((c) => c.id)).size).toBe(celdas.length);
    const categorias = new Set(CATEGORIAS_INICIALES.map((c) => c.id));
    expect(celdas.every((c) => categorias.has(c.categoriaId))).toBe(true);
  });

  it('si falta una palabra núcleo en el catálogo, se omite sin romper nada', () => {
    const sinSi = construirPlantillaGeneral(catalogo.filter((p) => p.id !== 'pic-si'));
    expect(sinSi[0].celdas.some((c) => c.pictogramaId === 'pic-si')).toBe(false);
    expect(sinSi[0].celdas.filter((c) => c.esNucleo)).toHaveLength(PALABRAS_NUCLEO.length - 1);
  });

  it('una categoría sin palabras no genera carpeta vacía', () => {
    const sinObjetos = construirPlantillaGeneral(catalogo.filter((p) => p.categoria !== 'objetos'));
    expect(sinObjetos.some((t) => t.nombre === 'Objetos')).toBe(false);
    expect(sinObjetos[0].celdas.some((c) => c.categoriaId === 'objetos' && c.tipo === 'carpeta')).toBe(false);
  });

  it('cada categoría trae un color válido de la paleta', () => {
    expect(CATEGORIAS_INICIALES.every((c) => c.color in COLORES_TABLERO)).toBe(true);
  });
});

describe('dibujo de las carpetas', () => {
  const principal = construirPlantillaGeneral(catalogo)[0];
  const carpetas = principal.celdas.filter((c) => c.tipo === 'carpeta');

  it('cada carpeta trae el dibujo de su categoría, tomado del catálogo', () => {
    expect(carpetas.map((c) => c.pictogramaId)).toEqual(Object.values(IMAGEN_CARPETA));
    const ids = new Set(catalogo.map((p) => p.id));
    expect(carpetas.every((c) => c.pictogramaId && ids.has(c.pictogramaId))).toBe(true);
  });

  it('si el dibujo no está en el catálogo, la carpeta se crea sin él', () => {
    const sinAgua = construirPlantillaGeneral(catalogo.filter((p) => p.id !== 'pic-agua'))[0];
    expect(sinAgua.celdas.find((c) => c.id === 'carpeta-necesidades')?.pictogramaId).toBeUndefined();
  });

  const sinDibujo = { ...principal, celdas: principal.celdas.map((c) => (c.tipo === 'carpeta' ? { ...c, pictogramaId: undefined } : c)) };

  it('conImagenesDeCarpeta rellena las carpetas guardadas antes de tener dibujo', () => {
    const completo = conImagenesDeCarpeta(sinDibujo, catalogo);
    expect(completo.celdas.filter((c) => c.tipo === 'carpeta').map((c) => c.pictogramaId)).toEqual(Object.values(IMAGEN_CARPETA));
  });

  it('no pisa el dibujo que la docente eligió', () => {
    const elegida = { ...sinDibujo, celdas: sinDibujo.celdas.map((c) => (c.id === 'carpeta-acciones' ? { ...c, pictogramaId: 'pic-propio' } : c)) };
    const completo = conImagenesDeCarpeta(elegida, catalogo);
    expect(completo.celdas.find((c) => c.id === 'carpeta-acciones')?.pictogramaId).toBe('pic-propio');
  });

  it('devuelve el mismo tablero si no hay nada que rellenar', () => {
    expect(conImagenesDeCarpeta(principal, catalogo)).toBe(principal);
  });
});
