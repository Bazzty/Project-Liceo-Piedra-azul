import { create } from 'zustand';
import type { Pictograma } from '@/types';
import { useAuthStore } from '@/shared/store/useAuthStore';

interface TableroState {
  abierto: boolean;
  /** Lo que el niño va armando. Vive aquí (no en el componente) para no perderse al cerrar el tablero o cambiar de página. */
  frase: Pictograma[];
  abrir: () => void;
  cerrar: () => void;
  setFrase: (frase: Pictograma[] | ((anterior: Pictograma[]) => Pictograma[])) => void;
}

export const useTableroStore = create<TableroState>()((set) => ({
  abierto: false,
  frase: [],
  abrir: () => set({ abierto: true }),
  cerrar: () => set({ abierto: false }),
  setFrase: (frase) => set((s) => ({ frase: typeof frase === 'function' ? frase(s.frase) : frase })),
}));

/** Al cambiar de niño o terminar la sesión, la frase y el tablero abierto no pasan a la persona siguiente. */
useAuthStore.subscribe((estado, anterior) => {
  if (estado.activeStudentId !== anterior.activeStudentId || estado.role !== anterior.role) {
    useTableroStore.setState({ abierto: false, frase: [] });
  }
});
