import { useMemo } from 'react';
import { useCategorias, usePictogramas, useTablerosDe } from '@/api';
import { franjaDeColor } from '@/features/tablero/coloresTablero';
import type { CategoriaTablero, CeldaTablero, Pictograma, Tablero } from '@/types';

/** Una celda lista para mostrar: su dibujo (si es palabra) y el color de su categoría. */
export interface CeldaResuelta {
  celda: CeldaTablero;
  pic?: Pictograma;
  franja: string;
}

export interface VistaTablero {
  id: string;
  nombre: string;
  celdas: CeldaResuelta[];
}

export interface TableroDelNino {
  /** Palabras núcleo: se ven siempre, en el principal y dentro de las carpetas. */
  nucleo: CeldaResuelta[];
  /** Las palabras del tablero de entrada, sin las núcleo (esas van aparte) ni las carpetas. */
  principal: VistaTablero;
  /** Las carpetas del principal, en su orden: se ven en una columna aparte, siempre. */
  listaCarpetas: CeldaResuelta[];
  /** Los tableros que abren las carpetas, por id. */
  carpetas: Map<string, VistaTablero>;
  /** Si al elegir una palabra dentro de una carpeta se vuelve solo al principal (por defecto, sí). */
  volverAlElegir: boolean;
}

/** Une cada celda con su dibujo y su color, y deja el tablero listo para dibujar y navegar. */
export function resolverTableroDelNino(
  principal: Tablero,
  todos: Tablero[],
  pictogramas: Pictograma[],
  categorias: CategoriaTablero[],
): TableroDelNino {
  const pics = new Map(pictogramas.map((p) => [p.id, p]));
  const colores = new Map(categorias.map((c) => [c.id, c.color]));

  const resolver = (celdas: CeldaTablero[]): CeldaResuelta[] =>
    celdas.flatMap((celda) => {
      const franja = franjaDeColor(colores.get(celda.categoriaId) ?? 'aprender');
      const pic = celda.pictogramaId ? pics.get(celda.pictogramaId) : undefined;
      if (celda.tipo === 'carpeta') return [{ celda, pic, franja }]; // la carpeta se puede abrir aunque no tenga dibujo
      return pic ? [{ celda, pic, franja }] : []; // una palabra sin dibujo no se puede mostrar ni decir
    });

  const porId = new Map(todos.map((t) => [t.id, t]));
  const propias = resolver(principal.celdas);
  const carpetas = new Map<string, VistaTablero>();
  for (const { celda } of propias) {
    const destino = celda.tipo === 'carpeta' && celda.destinoTableroId ? porId.get(celda.destinoTableroId) : undefined;
    // Un solo nivel: dentro de una carpeta no se muestran otras carpetas
    if (destino) {
      carpetas.set(destino.id, { id: destino.id, nombre: destino.nombre, celdas: resolver(destino.celdas).filter((c) => c.celda.tipo === 'palabra') });
    }
  }

  return {
    nucleo: propias.filter((c) => c.celda.esNucleo),
    principal: { id: principal.id, nombre: principal.nombre, celdas: propias.filter((c) => !c.celda.esNucleo && c.celda.tipo === 'palabra') },
    listaCarpetas: propias.filter((c) => c.celda.tipo === 'carpeta' && c.celda.destinoTableroId && carpetas.has(c.celda.destinoTableroId)),
    carpetas,
    volverAlElegir: principal.volverAlElegir !== false,
  };
}

/** El tablero del niño (o la plantilla general si no hay niño) listo para dibujar y navegar. */
export function useTableroDelNino(alumnoId: string | null): TableroDelNino | undefined {
  const tableros = useTablerosDe(alumnoId);
  const pictogramas = usePictogramas();
  const categorias = useCategorias();

  return useMemo(
    () => (tableros && pictogramas && categorias ? resolverTableroDelNino(tableros.principal, tableros.todos, pictogramas, categorias) : undefined),
    [tableros, pictogramas, categorias],
  );
}
