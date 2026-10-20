import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeId = 'calma-azul' | 'alto-contraste' | 'verde-bosque';
export type AdminThemeMode = 'light' | 'dark';

export interface ThemeState {
  currentTheme: ThemeId;
  showCharacterBackground: boolean;
  selectedCharacterId: string | null;
  adminThemeMode: AdminThemeMode;
  setTheme: (theme: ThemeId) => void;
  toggleCharacterBackground: () => void;
  setSelectedCharacter: (characterId: string | null) => void;
  toggleAdminTheme: () => void;
  setAdminThemeMode: (mode: AdminThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      currentTheme: 'calma-azul',
      showCharacterBackground: true,
      selectedCharacterId: 'dinosaurio',
      adminThemeMode: 'light',
      setTheme: (theme) => set({ currentTheme: theme }),
      toggleCharacterBackground: () =>
        set((state) => ({ showCharacterBackground: !state.showCharacterBackground })),
      setSelectedCharacter: (characterId) =>
        set({ selectedCharacterId: characterId }),
      toggleAdminTheme: () =>
        set((state) => {
          const actual = state.adminThemeMode === 'dark' ? 'light' : 'dark';
          return { adminThemeMode: actual };
        }),
      setAdminThemeMode: (mode) => set({ adminThemeMode: mode }),
    }),
    {
      name: 'theme-storage',
    }
  )
);