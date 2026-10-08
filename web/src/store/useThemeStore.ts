import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeId = 'calma-azul' | 'alto-contraste' | 'verde-bosque';

interface ThemeState {
  currentTheme: ThemeId;
  showCharacterBackground: boolean;
  selectedCharacterId: string | null; // ej: 'dinosaurio', 'auto', 'estrella'
  
  // Acciones
  setTheme: (theme: ThemeId) => void;
  toggleCharacterBackground: () => void;
  setSelectedCharacter: (characterId: string | null) => void;
}

export const useThemeStore = create