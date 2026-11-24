import { describe, expect, it } from 'vitest';
import {
  agregarCategoria,
  cambiarColorDeCategoria,
  moverCategoria,
  puedeQuitarCategoria,
  quitarCategoria,
  renombrarCategoria,
  usoDeCategorias,
} from '@/features/tablero/edicionCategorias';
import { catalogo } from '@/features/tablero/catalogoDePrueba';
import { CATEGORIAS_INICIALES, construirPlantillaGeneral } from '@/features/tablero/plantillaGeneral';

const nombres = (cs: { nombre: string }[]) => cs.map((c) => c.nombre);

describe('usoDeCategorias', () => {
  it('cuenta las celdas de cada categoría en todos los tableros', () => {
    const uso = usoDeCategorias(construirPlantillaGeneral(catalogo));
    expect(uso.get('necesidades')).toBe(4); // «ayuda», la carpeta «Necesidades», «agua» y «comer»
    expect(uso.get('inexistente')).toBeUndefined();
  });
});

describe('agregarCategoria', () => {
  it('agrega al final con id propio y le da su orden', () => {
    const c = agregarCategoria(CATEGORIAS_INICIALES, '  Comida  ', 'info');
    expect(c).toHaveLength(7);
    expect(c.at(-1)).toMatchObject({ nombre: 'Comida', color: 'info', orden: 7 });
    expect(c.at(-1)?.id).toMatch(/^categoria-/);
  });

  it('un nombre vacío no agrega nada', () => {
    expect(agregarCategoria(CATEGORIAS_INICIALES, '   ', 'info')).toBe(CATEGORIAS_INICIALES);
  });

  it('no modifica la lista original', () => {
    const antes = JSON.stringify(CATEGORIAS_INICIALES);
    agregarCategoria(CATEGORIAS_INICIALES, 'X', 'info');
    expect(JSON.stringify(CATEGORIAS_INICIALES)).toBe(antes);
  });
});

describe('renombrar y cambiar de color', () => {
  it('cambia solo la categoría pedida', () => {
    const c = renombrarCategoria(CATEGORIAS_INICIALES, 'acciones', ' Qué hago ');
    expect(c.find((x) => x.id === 'acciones')?.nombre).toBe('Qué hago');
    expect(nombres(c).filter((n) => n === 'Qué hago')).toHaveLength(1);
  });

  it('un nombre vacío deja todo igual', () => {
    expect(renombrarCategoria(CATEGORIAS_INICIALES, 'acciones', '  ')).toBe(CATEGORIAS_INICIALES);
  });

  it('cambia el color sin tocar el nombre', () => {
    const c = cambiarColorDeCategoria(CATEGORIAS_INICIALES, 'objetos', 'alerta');
    expect(c.find((x) => x.id === 'objetos')).toMatchObject({ nombre: 'Objetos', color: 'alerta' });
  });
});

describe('moverCategoria', () => {
  it('intercambia con la vecina y renumera', () => {
    const c = moverCategoria(CATEGORIAS_INICIALES, 'emociones', -1);
    expect(nombres(c).slice(0, 2)).toEqual(['Emociones', 'Necesidades']);
    expect(c.map((x) => x.orden)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('en los extremos no hace nada', () => {
    expect(moverCategoria(CATEGORIAS_INICIALES, 'necesidades', -1)).toBe(CATEGORIAS_INICIALES);
    expect(moverCategoria(CATEGORIAS_INICIALES, 'basicas', 1)).toBe(CATEGORIAS_INICIALES);
    expect(moverCategoria(CATEGORIAS_INICIALES, 'no-existe', 1)).toBe(CATEGORIAS_INICIALES);
  });
});

describe('quitarCategoria', () => {
  const uso = new Map([['acciones', 4]]);

  it('quita una categoría que nadie usa y renumera', () => {
    const c = quitarCategoria(CATEGORIAS_INICIALES, 'objetos', uso);
    expect(c.some((x) => x.id === 'objetos')).toBe(false);
    expect(c.map((x) => x.orden)).toEqual([1, 2, 3, 4, 5]);
  });

  it('no quita una categoría en uso', () => {
    expect(puedeQuitarCategoria(CATEGORIAS_INICIALES, 'acciones', uso)).toBe(false);
    expect(quitarCategoria(CATEGORIAS_INICIALES, 'acciones', uso)).toBe(CATEGORIAS_INICIALES);
  });

  it('no quita la última categoría ni una que no existe', () => {
    const una = [CATEGORIAS_INICIALES[0]];
    expect(puedeQuitarCategoria(una, una[0].id, new Map())).toBe(false);
    expect(puedeQuitarCategoria(CATEGORIAS_INICIALES, 'no-existe', new Map())).toBe(false);
  });
});
