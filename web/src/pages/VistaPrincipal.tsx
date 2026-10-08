import React from 'react';
import {
  BookOpen,
  MessageSquare,
  Palette,
  Star,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { MainLayout } from '../layouts/MainLayout';
import { CharacterGuide } from '../components/common/CharacterGuide';

interface VistaPrincipalProps {
  onNavigateToAprender: () => void;
  onOpenHablar: () => void;
}

export const VistaPrincipal: React.FC<VistaPrincipalProps> = ({
  onNavigateToAprender,
  onOpenHablar,
}) => {
  const { activeStudentId } = useAuthStore();

  const nombreAlumno = activeStudentId ? 'Mateo' : 'Amigo';

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-110px)] flex flex-col justify-between gap-3 p-1">

        {/* ZONA SUPERIOR CENTRAL: Personaje Guía Fijo */}
        <CharacterGuide
          mensaje={`¡Hola ${nombreAlumno}! Toca APRENDER para leer un cuento juntos.`}
        />

        {/* GRILLA 2x2: Botones de Acción Accesibles */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-1">

          {/* 1. APRENDER */}
          <button
            onClick={onNavigateToAprender}
            className="bg-brand text-white p-4 rounded-3xl border-4 border-brand-hover shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center gap-2 group w-full h-full"
          >
            <BookOpen className="w-14 h-14 sm:w-16 sm:h-16" />

            <span className="text-xl sm:text-3xl font-black">
              APRENDER
            </span>
          </button>

          {/* 2. HABLAR */}
          <button
            onClick={onOpenHablar}
            className="bg-amber-400 text-amber-950 p-4 rounded-3xl border-4 border-amber-500 shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center gap-2 group w-full h-full"
          >
            <MessageSquare className="w-14 h-14 sm:w-16 sm:h-16" />

            <span className="text-xl sm:text-3xl font-black">
              HABLAR
            </span>
          </button>

          {/* 3. COLORES */}
          <button
            onClick={() =>
              alert('🎨 Ajusta los colores desde el botón ⚙️ arriba')
            }
            className="bg-emerald-500 text-white p-4 rounded-3xl border-4 border-emerald-600 shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center gap-2 group w-full h-full"
          >
            <Palette className="w-14 h-14 sm:w-16 sm:h-16" />

            <span className="text-xl sm:text-3xl font-black">
              COLORES
            </span>
          </button>

          {/* 4. LOGROS */}
          <button
            onClick={() => alert('⭐ ¡Tus logros!')}
            className="bg-purple-500 text-white p-4 rounded-3xl border-4 border-purple-600 shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center gap-2 group w-full h-full"
          >
            <Star className="w-14 h-14 sm:w-16 sm:h-16 fill-current" />

            <span className="text-xl sm:text-3xl font-black">
              LOGROS
            </span>
          </button>

        </div>
      </div>
    </MainLayout>
  );
};