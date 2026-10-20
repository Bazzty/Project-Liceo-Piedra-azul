import { create } from 'zustand';
import type { Pictograma } from '@/types';

export type SAACCategoria = 'necesidades' | 'emociones' | 'personas' | 'acciones' | 'objetos';

export interface SAACState {
  categoriaActiva: SAACCategoria;
  fraseSecuencia: Pictograma[];
  isReadingSentence: boolean;

  setCategoriaActiva: (categoria: SAACCategoria) => void;
  agregarPictograma: (pictograma: Pictograma) => void;
  eliminarUltimoPictograma: () => void;
  limpiarFrase: () => void;
  setIsReadingSentence: (isReading: boolean) => void;
}

export const useSAACStore = create<SAACState>()((set) => ({
  categoriaActiva: 'necesidades',
  fraseSecuencia: [],
  isReadingSentence: false,
  setCategoriaActiva: (categoria) => set({ categoriaActiva: categoria }),
  agregarPictograma: (pictograma) =>
    set((state) => ({
      fraseSecuencia: [...state.fraseSecuencia, pictograma],
    })),
  eliminarUltimoPictograma: () =>
    set((state) => ({
      fraseSecuencia: state.fraseSecuencia.slice(0, -1),
    })),
  limpiarFrase: () => set({ fraseSecuencia: [] }),
  setIsReadingSentence: (isReading) => set({ isReadingSentence: isReading }),
}));