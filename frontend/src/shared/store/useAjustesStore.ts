import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VelocidadBarrido = 'lento' | 'normal' | 'rapido';

export type PasoAgenda = 'leer' | 'hablar' | 'estrellas';

export interface AjustesState {
  /** Sonidos suaves y voz. Apagado = pantalla en silencio. */
  sonido: boolean;
  /** Animaciones. Apagado = pantalla quieta (además se respeta el ajuste del sistema). */
  movimiento: boolean;
  /** Voz más lenta, para niños que necesitan más tiempo. */
  vozLenta: boolean;
  /** Control con un solo botón: las opciones se recorren solas y se elige la marcada. */
  barrido: boolean;
  barridoVelocidad: VelocidadBarrido;
  /** Juegos con solo dos opciones en vez de tres. */
  pocasOpciones: boolean;
  /** Agenda visual "Primero – Después" que deja la docente. */
  agenda: [PasoAgenda, PasoAgenda];
  setSonido: (v: boolean) => void;
  setMovimiento: (v: boolean) => void;
  setVozLenta: (v: boolean) => void;
  setBarrido: (v: boolean) => void;
  setBarridoVelocidad: (v: VelocidadBarrido) => void;
  setPocasOpciones: (v: boolean) => void;
  setAgenda: (a: [PasoAgenda, PasoAgenda]) => void;
}

export const useAjustesStore = create<AjustesState>()(
  persist(
    (set) => ({
      sonido: true,
      movimiento: true,
      vozLenta: false,
      barrido: false,
      barridoVelocidad: 'normal',
      pocasOpciones: false,
      agenda: ['leer', 'hablar'],
      setSonido: (sonido) => set({ sonido }),
      setMovimiento: (movimiento) => set({ movimiento }),
      setVozLenta: (vozLenta) => set({ vozLenta }),
      setBarrido: (barrido) => set({ barrido }),
      setBarridoVelocidad: (barridoVelocidad) => set({ barridoVelocidad }),
      setPocasOpciones: (pocasOpciones) => set({ pocasOpciones }),
      setAgenda: (agenda) => set({ agenda }),
    }),
    { name: 'ajustes-estudiante' },
  ),
);
