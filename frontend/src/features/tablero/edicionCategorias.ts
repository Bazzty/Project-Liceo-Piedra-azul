import { nuevoId } from '@/features/tablero/edicionTablero';
import type { CategoriaTablero, ColorTablero, Tablero } from '@/types';

/** Cuántas celdas usan cada categoría, entre todos los tableros (plantillas y niños). */
export function usoDeCategorias(tableros: Tablero[]): Map<string, number> {
  const uso = new Map<string, number>();
  for (const t of tableros) for (const c of t.celdas) uso.set(c.categoriaId, (uso.get(c.categoriaId) ?? 0) + 1);
  return uso;
}

const reordenar = (categorias: CategoriaTablero[]): CategoriaTablero[] => categorias.map((c, i) => ({ ...c, orden: i + 1 }));

/** Agrega una categoría al final. Un nombre vacío no agrega nada. */
export function agregarCategoria(categorias: CategoriaTablero[], nombre: string, color: ColorTablero): CategoriaTablero[] {
  const limpio = nombre.trim();
  return limpio ? reordenar([...categorias, { id: nuevoId('categoria'), nombre: limpio, color, orden: categorias.length + 1 }]) : categorias;
}

export function renombrarCategoria(categorias: CategoriaTablero[], id: string, nombre: string): CategoriaTablero[] {
  const limpio = nombre.trim();
  return limpio ? categorias.map((c) => (c.id === id ? { ...c, nombre: limpio } : c)) : categorias;
}

export const cambiarColorDeCategoria = (categorias: CategoriaTablero[], id: string, color: ColorTablero): CategoriaTablero[] =>
  categorias.map((c) => (c.id === id ? { ...c, color } : c));

/** Una posición antes (−1) o después (+1). */
export function moverCategoria(categorias: CategoriaTablero[], id: string, paso: -1 | 1): CategoriaTablero[] {
  const i = categorias.findIndex((c) => c.id === id);
  const j = i + paso;
  if (i < 0 || j < 0 || j >= categorias.length) return categorias;
  const copia = [...categorias];
  [copia[i], copia[j]] = [copia[j], copia[i]];
  return reordenar(copia);
}

/** Una categoría se puede quitar solo si ninguna celda la usa y no es la última: toda celda necesita una. */
export const puedeQuitarCategoria = (categorias: CategoriaTablero[], id: string, uso: Map<string, number>): boolean =>
  categorias.length > 1 && categorias.some((c) => c.id === id) && !uso.get(id);

export const quitarCategoria = (categorias: CategoriaTablero[], id: string, uso: Map<string, number>): CategoriaTablero[] =>
  puedeQuitarCategoria(categorias, id, uso) ? reordenar(categorias.filter((c) => c.id !== id)) : categorias;
