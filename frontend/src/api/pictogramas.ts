import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { Pictograma } from '@/types';

export const listarPictogramas = () => db.pictogramas.toArray();
export const listarPictogramasPorCategoria = (categoria: Pictograma['categoria']) =>
  db.pictogramas.where('categoria').equals(categoria).toArray();
export const buscarPictogramaPorPalabra = (palabra: string) =>
  db.pictogramas.where('palabra').equalsIgnoreCase(palabra).first();

export const usePictogramas = () => useLiveQuery(() => listarPictogramas(), []);
export const usePictogramasPorCategoria = (categoria: Pictograma['categoria'] | 'todos') =>
  useLiveQuery(
    () => (categoria === 'todos' ? listarPictogramas() : listarPictogramasPorCategoria(categoria)),
    [categoria]
  );
export const usePictogramaPorPalabra = (palabra: string, habilitado = true) =>
  useLiveQuery(
    async () => (habilitado ? buscarPictogramaPorPalabra(palabra.toLowerCase().trim()) : null),
    [palabra, habilitado]
  );
