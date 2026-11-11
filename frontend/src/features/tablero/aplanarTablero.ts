import type { CeldaTablero, Tablero } from '@/types';

/**
 * Las palabras de un tablero en el orden en que se ven: las del principal y, a continuación, las de cada
 * carpeta. Mientras el tablero del niño sea una sola grilla (sin navegar carpetas), se muestra esta lista.
 */
export function aplanarTablero(principal: Tablero, todos: Tablero[]): CeldaTablero[] {
  const porId = new Map(todos.map((t) => [t.id, t]));
  const palabras: CeldaTablero[] = [];
  const visitados = new Set<string>([principal.id]);
  const agregar = (tablero: Tablero) => {
    for (const celda of tablero.celdas) {
      if (celda.tipo === 'palabra') {
        palabras.push(celda);
        continue;
      }
      const destino = celda.destinoTableroId ? porId.get(celda.destinoTableroId) : undefined;
      if (destino && !visitados.has(destino.id)) {
        visitados.add(destino.id);
        agregar(destino);
      }
    }
  };
  agregar(principal);
  return palabras;
}
