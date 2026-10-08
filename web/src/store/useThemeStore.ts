import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeId = 'calma-azul' | 'alto-contraste' | 'verde-bosque';

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
      currentTheme: 'calma-azul',
      showCharacterBackground: true,
      selectedCharacterId: 'dinosaurio',

      setTheme: (theme) => 
        set({ currentTheme: theme }),

      toggleCharacterBackground: () => 
        set((state) => ({ showCharacterBackground: !state.showCharacterBackground })),

      setSelectedCharacter: (characterId) => 
        set({ selectedCharacterId: characterId }),
    }),
    {
      name: 'theme-storage', // Llave para persistencia en localStorage
    }
  )
);