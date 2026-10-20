import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PasoAgenda = 'leer' | 'hablar' | 'estrellas';

export interface AjustesState {
  /** Sonidos suaves y voz. Apagado = pantalla en silencio. */
  sonido: boolean;
  /** Animaciones. Apagado = pantalla quieta (además se respeta el ajuste del sistema). */
  movimiento: boolean;
  /** Voz más lenta, para niños que necesitan más tiempo. */
  vozLenta: boolean;
  /** Agenda visual "Primero – Después" que deja la docente. */
  agenda: [PasoAgenda, PasoAgenda];
  setSonido: (v: boolean) => void;
  setMovimiento: (v: boolean) => void;
  setVozLenta: (v: boolean) => void;
  setAgenda: (a: [PasoAgenda, PasoAgenda]) => void;
}

export const useAjustesStore = create<AjustesState>()(
  persist(
    (set) => ({
      sonido: true,
      movimiento: true,
      vozLenta: false,
      agenda: ['leer', 'hablar'],
      setSonido: (sonido) => set({ sonido }),
      setMovimiento: (movimiento) => set({ movimiento }),
      setVozLenta: (vozLenta) => set({ vozLenta }),
      setAgenda: (agenda) => set({ agenda }),
    }),
    { name: 'ajustes-estudiante' },
  ),
);
