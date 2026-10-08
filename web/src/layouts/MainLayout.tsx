import React, { useEffect } from 'react';
import { Header } from '../components/common/Header';
import { useThemeStore } from '../store/useThemeStore';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { currentTheme, showCharacterBackground } = useThemeStore();

  // Asegura aplicar el atributo data-theme en el HTML al montar y cambiar el tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  return (
    <div className="min-h-screen bg-app text-primary flex flex-col font-sans transition-colors duration-300 relative overflow-x-hidden">
      {/* Header Fijo */}
      <Header />

      {/* Ilustración de Personajes de Fondo en las Esquinas Inferiores */}
      {showCharacterBackground && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-0 flex justify-between items-end p-6 md:p-12">
          <div className="text-7xl md:text-9xl select-none animate-bounce duration-1000">🦕</div>
          <div className="text-7xl md:text-9xl select-none animate-pulse">⭐</div>
        </div>
      )}

      {/* Contenido Principal de la Página */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 z-10 relative">
        {children}
      </main>
    </div>
  );
};