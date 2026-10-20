import { useEffect } from 'react';
import { useThemeStore } from '@/shared/store/useThemeStore';

/** Aplica la paleta elegida al atributo data-theme global. Usar en toda pantalla que no pase por MainLayout. */
export const useAplicarTema = () => {
  const currentTheme = useThemeStore((s) => s.currentTheme);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);
};
