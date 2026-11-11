import { describe, expect, it } from 'vitest';
import { catalogo } from '@/features/tablero/catalogoDePrueba';
import { CATEGORIAS_INICIALES, construirPlantillaGeneral, PALABRAS_NUCLEO } from '@/features/tablero/plantillaGeneral';
import { resolverTableroDelNino } from '@/features/tablero/useTableroDelNino';
import type { Tablero } from '@/types';

const plantilla = construirPlantillaGeneral(catalogo);
const resolver = (principal = plantilla[0], todos = plantilla) => resolverTableroDelNino(principal, todos, catalogo, CATEGORIAS_INICIALES);
const palabras = (celdas: { celda: { textoMostrado: string } }[]) => celdas.map((c) => c.celda.textoMostrado);

describe('resolverTableroDelNino', () => {
  it('separa las palabras núcleo del resto del principal, sin repetirlas', () => {
    const t = resolver();
    expect(t.nucleo.map((c) => c.celda.pictogramaId)).toEqual(PALABRAS_NUCLEO);
    expect(t.principal.celdas.some((c) => c.celda.esNucleo)).toBe(false);
  });

  it('el principal deja solo las palabras sueltas y las carpetas van aparte, en su orden y con dibujo', () => {
    const t = resolver();
    expect(palabras(t.principal.celdas)).toEqual(['hola']);
    expect(palabras(t.listaCarpetas)).toEqual(['Necesidades', 'Emociones', 'Personas', 'Acciones', 'Objetos']);
    expect(t.listaCarpetas.map((c) => c.pic?.id)).toEqual(['pic-agua', 'pic-feliz', 'pic-mama', 'pic-jugar', 'pic-libro']);
  });

  it('cada carpeta trae sus palabras, ordenadas, con dibujo y el color de su categoría', () => {
    const t = resolver();
    const acciones = t.carpetas.get('plantilla-general-acciones');
    expect(acciones?.nombre).toBe('Acciones');
    expect(palabras(acciones?.celdas ?? [])).toEqual(['abrazo', 'jugar']);
    expect(acciones?.celdas.every((c) => c.pic && c.franja === 'bg-btnHablar-bg')).toBe(true);
  });

  it('el color sale de la categoría de la celda y, si no existe, usa uno por defecto', () => {
    const t = resolver();
    expect(t.listaCarpetas.find((c) => c.celda.id === 'carpeta-necesidades')?.franja).toBe('bg-statusDanger');
    const huerfana: Tablero = { ...plantilla[0], celdas: [{ id: 'x', tipo: 'palabra', pictogramaId: 'pic-hola', textoMostrado: 'hola', categoriaId: 'inventada' }] };
    expect(resolver(huerfana, [huerfana]).principal.celdas[0].franja).toBe('bg-btnAprender-bg');
  });

  it('una palabra sin dibujo en el catálogo se omite, no rompe', () => {
    const rota: Tablero = { ...plantilla[0], celdas: [{ id: 'x', tipo: 'palabra', pictogramaId: 'pic-borrado', textoMostrado: 'borrado', categoriaId: 'objetos' }] };
    expect(resolver(rota, [rota]).principal.celdas).toEqual([]);
  });

  it('una carpeta que apunta a un tablero que no existe no aparece como abrible', () => {
    const rota: Tablero = { ...plantilla[0], celdas: [{ id: 'c', tipo: 'carpeta', textoMostrado: 'Rota', categoriaId: 'objetos', destinoTableroId: 'no-existe' }] };
    const t = resolver(rota, [rota]);
    expect(t.carpetas.size).toBe(0);
    expect(t.listaCarpetas).toEqual([]);
  });

  it('una carpeta sin dibujo se puede abrir igual', () => {
    const sinDibujo: Tablero = { ...plantilla[0], celdas: plantilla[0].celdas.map((c) => ({ ...c, pictogramaId: c.tipo === 'carpeta' ? undefined : c.pictogramaId })) };
    const t = resolver(sinDibujo);
    expect(t.listaCarpetas).toHaveLength(5);
    expect(t.listaCarpetas.every((c) => !c.pic)).toBe(true);
  });

  it('un solo nivel: las carpetas dentro de una carpeta no se muestran', () => {
    const interna = plantilla.find((t) => t.id === 'plantilla-general-acciones') as Tablero;
    const conSubcarpeta: Tablero = {
      ...interna,
      celdas: [...interna.celdas, { id: 'sub', tipo: 'carpeta', textoMostrado: 'Sub', categoriaId: 'acciones', destinoTableroId: 'plantilla-general-objetos' }],
    };
    const t = resolver(plantilla[0], plantilla.map((x) => (x.id === interna.id ? conSubcarpeta : x)));
    expect(palabras(t.carpetas.get(interna.id)?.celdas ?? [])).toEqual(['abrazo', 'jugar']);
  });

  it('volver al principal al elegir es lo normal y se puede desactivar', () => {
    expect(resolver().volverAlElegir).toBe(true);
    expect(resolver({ ...plantilla[0], volverAlElegir: false }).volverAlElegir).toBe(false);
  });
});
