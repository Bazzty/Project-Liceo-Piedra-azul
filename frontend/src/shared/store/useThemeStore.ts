import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeId = 'suave' | 'alto-contraste' | 'calida' | 'monocromatica';

const TEMAS_VALIDOS: ThemeId[] = ['suave', 'alto-contraste', 'calida', 'monocromatica'];

export interface ThemeState {
  currentTheme: ThemeId;
  showCharacterBackground: boolean;
  selectedCharacterId: string | null;
  setTheme: (theme: ThemeId) => void;
  toggleCharacterBackground: () => void;
  setSelectedCharacter: (characterId: string | null) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      currentTheme: 'suave',
      showCharacterBackground: true,
      selectedCharacterId: null,

      setTheme: (theme) => 
        set({ currentTheme: theme }),

      toggleCharacterBackground: () => 
        set((state) => ({ showCharacterBackground: !state.showCharacterBackground })),

      setSelectedCharacter: (characterId) => 
        set({ selectedCharacterId: characterId }),
    }),
    {
      name: 'theme-storage', // Llave para persistencia en localStorage
      version: 2,
      // Si el tema guardado ya no existe (p. ej. 'calma-azul'), vuelve al tema por defecto
      migrate: (estado) => {
        const guardado = estado as Partial<ThemeState>;
        const valido = TEMAS_VALIDOS.includes(guardado.currentTheme as ThemeId);
        return { ...guardado, currentTheme: valido ? guardado.currentTheme : 'suave' } as ThemeState;
      },
    }
  )
);