import React, { useEffect } from 'react';
import { Header } from '../components/common/Header';
import { useThemeStore } from '../store/useThemeStore';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { SessionTimeoutModal } from '../components/common/SessionTimeoutModal';

export interface MainLayoutProps {
  children: React.ReactNode;
  onSessionTimeoutRedirect?: () => void;
  allowScroll?: boolean; // Permite habilitar scroll solo en vistas con mucho contenido
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  onSessionTimeoutRedirect,
  allowScroll = false,
}) => {
  const { currentTheme, showCharacterBackground } = useThemeStore();

  useSessionTimeout();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  return (
    <div className="min-h-screen h-screen bg-app text-primary flex flex-col relative overflow-hidden transition-colors duration-300">
      
      {/* Header Fijo */}
      <Header />

      {/* Área Principal: Sin scroll por defecto, o con scroll si allowScroll es true */}
      <main className={`flex-1 flex flex-col p-4 sm:p-6 max-w-7xl mx-auto w-full z-10 ${allowScroll ? 'overflow-y-auto' : 'h-[calc(100vh-4rem)] overflow-hidden'}`}>
        {children}
      </main>

      {/* Personajes flotantes en las esquinas inferiores sin interferir con los clics */}
      {showCharacterBackground && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
          {/* Personaje Izquierdo */}
          <div className="absolute bottom-6 left-6 text-6xl animate-bounce select-none opacity-40">
            🦕
          </div>
          
          {/* Personaje Derecho */}
          <div className="absolute bottom-6 right-6 text-6xl animate-pulse select-none opacity-40">
            ⭐
          </div>
        </div>
      )}

      {/* Modal de Expiración de Sesión */}
      <SessionTimeoutModal 
        onClose={() => {
          if (onSessionTimeoutRedirect) {
            onSessionTimeoutRedirect();
          }
        }}
      />
    </div>
  );
};