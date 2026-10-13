import React from 'react';
import { BookOpen, MessageSquare, Palette, Star } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { MainLayout } from '../layouts/MainLayout';
import { CharacterGuide } from '../components/common/CharacterGuide';

interface VistaPrincipalProps {
  onNavigateToAprender: () => void;
  onOpenHablar: () => void;
  onSessionTimeoutRedirect?: () => void;
}

export const VistaPrincipal: React.FC<VistaPrincipalProps> = ({
  onNavigateToAprender,
  onOpenHablar,
  onSessionTimeoutRedirect,
}) => {
  const { activeStudentId } = useAuthStore();
  const nombreAlumno = activeStudentId ? 'Mateo' : 'Amigo';

  return (
    <MainLayout onSessionTimeoutRedirect={onSessionTimeoutRedirect} allowScroll={false}>
      <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-4xl mx-auto my-auto h-full justify-center">
        
        {/* Personaje Guía Central */}
        <div className="w-full bg-surface/90 backdrop-blur-md rounded-3xl p-4 sm:p-6 shadow-xl border-2 border-borderCustom shrink-0">
          <CharacterGuide 
            mensaje={`¡Hola ${nombreAlumno}! ¿Qué te gustaría hacer hoy? Selecciona una opción para comenzar.`}
          />
        </div>

        {/* Grilla 2x2: Ocupa exactamente el espacio sin desbordar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full flex-1 max-h-[60vh]">
          
          {/* 1. APRENDER */}
          <button
            onClick={onNavigateToAprender}
            style={{
              backgroundColor: 'var(--btn-aprender-bg)',
              color: 'var(--btn-aprender-text)',
              borderColor: 'var(--btn-aprender-border)',
            }}
            className="p-3 sm:p-4 rounded-3xl border-4 shadow-lg hover:opacity-90 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 sm:gap-2 w-full h-full cursor-pointer"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-wide">APRENDER</span>
          </button>

          {/* 2. HABLAR */}
          <button
            onClick={onOpenHablar}
            style={{
              backgroundColor: 'var(--btn-hablar-bg)',
              color: 'var(--btn-hablar-text)',
              borderColor: 'var(--btn-hablar-border)',
            }}
            className="p-3 sm:p-4 rounded-3xl border-4 shadow-lg hover:opacity-90 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 sm:gap-2 w-full h-full cursor-pointer"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-wide">HABLAR</span>
          </button>

          {/* 3. COLORES */}
          <button
            onClick={() => alert('Ajusta los colores desde el botón de opciones en el encabezado')}
            style={{
              backgroundColor: 'var(--btn-colores-bg)',
              color: 'var(--btn-colores-text)',
              borderColor: 'var(--btn-colores-border)',
            }}
            className="p-3 sm:p-4 rounded-3xl border-4 shadow-lg hover:opacity-90 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 sm:gap-2 w-full h-full cursor-pointer"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Palette className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-wide">COLORES</span>
          </button>

          {/* 4. LOGROS */}
          <button
            onClick={() => alert('¡Aquí verás tus estrellas!')}
            style={{
              backgroundColor: 'var(--btn-logros-bg)',
              color: 'var(--btn-logros-text)',
              borderColor: 'var(--btn-logros-border)',
            }}
            className="p-3 sm:p-4 rounded-3xl border-4 shadow-lg hover:opacity-90 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 sm:gap-2 w-full h-full cursor-pointer"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Star className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-wide">LOGROS</span>
          </button>

        </div>
      </div>
    </MainLayout>
  );
};