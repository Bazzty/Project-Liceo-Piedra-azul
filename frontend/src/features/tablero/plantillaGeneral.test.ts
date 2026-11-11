import { describe, expect, it } from 'vitest';
import { aplanarTablero } from '@/features/tablero/aplanarTablero';
import { COLORES_TABLERO } from '@/features/tablero/coloresTablero';
import {
  CATEGORIAS_INICIALES,
  construirPlantillaGeneral,
  ID_PLANTILLA_GENERAL,
  PALABRAS_NUCLEO,
} from '@/features/tablero/plantillaGeneral';
import type { Pictograma, Tablero } from '@/types';

const pic = (id: string, palabra: string, categoria: Pictograma['categoria']): Pictograma => ({
  id: `pic-${id}`,
  palabra,
  categoria,
  imagenUrl: `/pictogramas/arasaac/${id}.png`,
  esFotoReal: false,
});

/** Un catálogo con una o más palabras de cada categoría, las 8 núcleo y alguna «básica» que no es núcleo. */
const catalogo: Pictograma[] = [
  pic('ayuda', 'ayuda', 'necesidades'),
  pic('agua', 'agua', 'necesidades'),
  pic('comer', 'comer', 'necesidades'),
  pic('feliz', 'feliz', 'emociones'),
  pic('triste', 'triste', 'emociones'),
  pic('yo', 'yo', 'personas'),
  pic('mama', 'mamá', 'personas'),
  pic('amigo', 'amigo', 'personas'),
  pic('quiero', 'quiero', 'acciones'),
  pic('jugar', 'jugar', 'acciones'),
  pic('abrazar', 'abrazo', 'acciones'),
  pic('libro', 'libro', 'objetos'),
  pic('azul', 'azul', 'objetos'),
  pic('mas', 'más', 'basicas'),
  pic('si', 'sí', 'basicas'),
  pic('no', 'no', 'basicas'),
  pic('terminado', 'terminado', 'basicas'),
  pic('gracias', 'gracias', 'basicas'),
  pic('hola', 'hola', 'basicas'),
];

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

describe('aplanarTablero', () => {
  const tableros = construirPlantillaGeneral(catalogo);

  it('devuelve primero el núcleo y luego las carpetas, como el tablero de una sola grilla de antes', () => {
    const palabras = aplanarTablero(tableros[0], tableros).map((c) => c.textoMostrado);
    expect(palabras).toEqual([
      'yo', 'quiero', 'más', 'sí', 'no', 'terminado', 'gracias', 'ayuda',
      'hola',
      'agua', 'comer',
      'feliz', 'triste',
      'amigo', 'mamá',
      'abrazo', 'jugar',
      'azul', 'libro',
    ]);
  });

  it('no repite palabras si dos carpetas abren el mismo tablero', () => {
    const principal: Tablero = {
      ...tableros[0],
      celdas: [
        ...tableros[0].celdas,
        { id: 'otra', tipo: 'carpeta', textoMostrado: 'Otra', categoriaId: 'acciones', destinoTableroId: 'plantilla-general-acciones' },
      ],
    };
    const palabras = aplanarTablero(principal, tableros).map((c) => c.pictogramaId);
    expect(new Set(palabras).size).toBe(palabras.length);
  });

  it('no se cuelga con carpetas que se apuntan entre sí ni falla con un destino que no existe', () => {
    const a: Tablero = { id: 'a', nombre: 'A', esPlantilla: false, principal: true, celdas: [{ id: 'ca', tipo: 'carpeta', textoMostrado: 'B', categoriaId: 'x', destinoTableroId: 'b' }, { id: 'rota', tipo: 'carpeta', textoMostrado: '?', categoriaId: 'x', destinoTableroId: 'no-existe' }] };
    const b: Tablero = { id: 'b', nombre: 'B', esPlantilla: false, principal: false, celdas: [{ id: 'cb', tipo: 'carpeta', textoMostrado: 'A', categoriaId: 'x', destinoTableroId: 'a' }, { id: 'p', tipo: 'palabra', pictogramaId: 'pic-1', textoMostrado: 'uno', categoriaId: 'x' }] };
    expect(aplanarTablero(a, [a, b]).map((c) => c.id)).toEqual(['p']);
  });
});
