import { create } from 'zustand';

/** Zona de calma: cualquier pantalla puede abrirla (p. ej. el osito cuando el niño se frustra). */
interface CalmaState {
  abierta: boolean;
  abrir: () => void;
  cerrar: () => void;
}

export const useCalmaStore = create<CalmaState>()((set) => ({
  abierta: false,
  abrir: () => set({ abierta: true }),
  cerrar: () => set({ abierta: false }),
}));
