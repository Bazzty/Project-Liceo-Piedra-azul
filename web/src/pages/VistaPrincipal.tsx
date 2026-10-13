import React, { useState } from 'react';
import { BookOpen, MessageSquare, Palette, Star } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore, type ThemeId } from '../store/useThemeStore';
import { THEMES_CONFIG } from '../config/themes';
import { MainLayout } from '../layouts/MainLayout';
import { CharacterGuide } from '../components/common/CharacterGuide';
import { Modal } from '../components/common/Modal';
import { TableroSAAC } from '../components/tablero/TableroSAAC';

export interface VistaPrincipalProps {
  onNavigateToAprender?: () => void;
  onOpenHablar?: () => void;
  onSessionTimeoutRedirect?: () => void;
}

export const VistaPrincipal: React.FC<VistaPrincipalProps> = ({
  onNavigateToAprender,
  onOpenHablar,
  onSessionTimeoutRedirect,
}) => {
  const { activeStudentId } = useAuthStore();
  const { currentTheme, setTheme } = useThemeStore();
  const [isHablarModalOpen, setIsHablarModalOpen] = useState(false);
  const [isColoresModalOpen, setIsColoresModalOpen] = useState(false);

  const nombreAlumno = activeStudentId ? 'Mateo' : 'Amigo';

  const handleAprenderClick = () => {
    if (typeof onNavigateToAprender === 'function') {
      onNavigateToAprender();
    }
  };

  const handleHablarClick = () => {
    if (typeof onOpenHablar === 'function') {
      onOpenHablar();
    } else {
      setIsHablarModalOpen(true);
    }
  };

  return (
    <MainLayout allowScroll={false}>
      <div className="flex flex-col h-full w-full max-w-5xl mx-auto p-4 sm:p-6 justify-between gap-4">
        
        {/* Personaje Guía Central (variant="compact") */}
        <div className="w-full shrink-0">
          <CharacterGuide 
            mensaje={`¡Hola, ${nombreAlumno}! ¿Qué te gustaría hacer hoy en tu clase de lectura?`}
            variant="compact"
          />
        </div>

        {/* Grilla 2x2 */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 flex-1 w-full max-h-[58vh]">
          
          {/* 1. APRENDER */}
          <button
            onClick={handleAprenderClick}
            style={{
              backgroundColor: 'var(--btn-aprender-bg)',
              color: 'var(--btn-aprender-text)',
              borderColor: 'var(--btn-aprender-border)',
            }}
            className="p-3 sm:p-6 rounded-3xl border-4 shadow-xl hover:opacity-90 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 sm:gap-3 w-full h-full cursor-pointer group"
          >
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-7 h-7 sm:w-10 sm:h-10" />
            </div>
            <span className="text-lg sm:text-2xl font-black tracking-wide">APRENDER</span>
          </button>

          {/* 2. HABLAR */}
          <button
            onClick={handleHablarClick}
            style={{
              backgroundColor: 'var(--btn-hablar-bg)',
              color: 'var(--btn-hablar-text)',
              borderColor: 'var(--btn-hablar-border)',
            }}
            className="p-3 sm:p-6 rounded-3xl border-4 shadow-xl hover:opacity-90 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 sm:gap-3 w-full h-full cursor-pointer group"
          >
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-7 h-7 sm:w-10 sm:h-10" />
            </div>
            <span className="text-lg sm:text-2xl font-black tracking-wide">HABLAR</span>
          </button>

          {/* 3. COLORES */}
          <button
            onClick={() => setIsColoresModalOpen(true)}
            style={{
              backgroundColor: 'var(--btn-colores-bg)',
              color: 'var(--btn-colores-text)',
              borderColor: 'var(--btn-colores-border)',
            }}
            className="p-3 sm:p-4 rounded-3xl border-4 shadow-lg hover:opacity-90 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 sm:gap-2 w-full h-full cursor-pointer group"
          >
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Palette className="w-7 h-7 sm:w-10 sm:h-10" />
            </div>
            <span className="text-lg sm:text-2xl font-black tracking-wide">COLORES</span>
          </button>

          {/* 4. LOGROS */}
          <button
            onClick={() => alert('¡Aquí verás tus estrellas y medallas de avance!')}
            style={{
              backgroundColor: 'var(--btn-logros-bg)',
              color: 'var(--btn-logros-text)',
              borderColor: 'var(--btn-logros-border)',
            }}
            className="p-3 sm:p-4 rounded-3xl border-4 shadow-lg hover:opacity-90 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 sm:gap-2 w-full h-full cursor-pointer group"
          >
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Star className="w-7 h-7 sm:w-10 sm:h-10 fill-current" />
            </div>
            <span className="text-lg sm:text-2xl font-black tracking-wide">LOGROS</span>
          </button>

        </div>

      </div>

      {/* Modal HABLAR (Tablero SAAC) */}
      <Modal isOpen={isHablarModalOpen} onClose={() => setIsHablarModalOpen(false)} title="Tablero de Comunicación (SAAC)" size="full">
        <TableroSAAC />
      </Modal>

      {/* Modal COLORES */}
      <Modal isOpen={isColoresModalOpen} onClose={() => setIsColoresModalOpen(false)} title="Elige tu Paleta de Colores">
        <div className="flex flex-col gap-4 p-2">
          <p className="text-sm font-bold text-secondary">
            Diseñado para cumplir con la Ley TEA 21.545 y bajo estímulo visual.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {THEMES_CONFIG.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setTheme(theme.id as ThemeId)}
                className={`flex items-center gap-3 p-4 rounded-2xl border-4 transition-all font-black text-sm cursor-pointer shadow text-left ${
                  currentTheme === theme.id
                    ? 'border-brand bg-brand/10 ring-2 ring-brand scale-[1.02] text-primary'
                    : 'border-borderCustom bg-surface hover:bg-app text-secondary'
                }`}
              >
                <span className="text-lg">🎨</span>
                <span>{theme.nombre}</span>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};