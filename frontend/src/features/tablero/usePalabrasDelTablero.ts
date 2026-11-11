import { useMemo } from 'react';
import { useCategorias, usePictogramas, useTablerosDe } from '@/api';
import { aplanarTablero } from '@/features/tablero/aplanarTablero';
import { franjaDeColor } from '@/features/tablero/coloresTablero';
import type { CeldaTablero, Pictograma } from '@/types';

export interface PalabraDelTablero {
  celda: CeldaTablero;
  pic: Pictograma;
  /** Clase de color de la franja, según la categoría de la celda. */
  franja: string;
}

/** Las palabras del tablero del niño (o de la plantilla general si no hay niño) con su dibujo y su color. */
export function usePalabrasDelTablero(alumnoId: string | null): PalabraDelTablero[] | undefined {
  const tableros = useTablerosDe(alumnoId);
  const pictogramas = usePictogramas();
  const categorias = useCategorias();

  return useMemo(() => {
    if (!tableros || !pictogramas || !categorias) return undefined;
    const pics = new Map(pictogramas.map((p) => [p.id, p]));
    const colores = new Map(categorias.map((c) => [c.id, c.color]));
    return aplanarTablero(tableros.principal, tableros.todos).flatMap((celda) => {
      const pic = celda.pictogramaId ? pics.get(celda.pictogramaId) : undefined;
      if (!pic) return [];
      return [{ celda, pic, franja: franjaDeColor(colores.get(celda.categoriaId) ?? 'aprender') }];
    });
  }, [tableros, pictogramas, categorias]);
}
