import React, { useEffect } from 'react';
import { Header } from '../components/common/Header';
import { useThemeStore } from '../store/useThemeStore';
import { useSessionTimeout } from '../hooks/useSessionTimeout';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { currentTheme, showCharacterBackground } = useThemeStore();

  // Si la sesión de 1.5 horas expira mientras el niño lee, recarga para ir al Mosaico
  useSessionTimeout(() => {
    alert('⏱️ La sesión de laboratorio (1.5h) ha finalizado.');
    window.location.reload();
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  return (
    <div className="min-h-screen bg-app text-primary flex flex-col font-sans transition-colors duration-300 relative overflow-x-hidden">
      <Header />
      
      {showCharacterBackground && (
        <div className="pointer-events-none fixed bottom-6 left-6 right-6 z-30 flex justify-between items-end">
          <div className="bg-surface/90 border-4 border-borderCustom p-4 rounded-full shadow-2xl text-5xl sm:text-6xl animate-bounce">
            🦕
          </div>
          <div className="bg-surface/90 border-4 border-borderCustom p-4 rounded-full shadow-2xl text-5xl sm:text-6xl animate-pulse">
            ⭐
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 z-10 pb-4">
        {children}
      </main>
    </div>
  );
};