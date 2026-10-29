import { useEffect } from 'react';
import { useAjustesStore } from '@/shared/store/useAjustesStore';
import { useThemeStore } from '@/shared/store/useThemeStore';

/** Aplica la paleta (data-theme) y el ajuste de movimiento (data-motion). Usar en toda pantalla que no pase por MainLayout. */
export const useAplicarTema = () => {
  const currentTheme = useThemeStore((s) => s.currentTheme);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const movimiento = useAjustesStore((s) => s.movimiento);
  useEffect(() => {
    document.documentElement.setAttribute('data-motion', movimiento ? 'on' : 'off');
  }, [movimiento]);
};
