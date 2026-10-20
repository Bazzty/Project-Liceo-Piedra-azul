import React, { useState } from 'react';
import { MessageSquare, Settings, User as UserIcon, Sparkles } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Modal } from './Modal';
import { TableroSAAC } from '@/components/tablero/TableroSAAC';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore, type ThemeId } from '@/store/useThemeStore';
import { THEMES_CONFIG } from '@/config/themes';
import { db } from '@/db/db';

export const Header: React.FC = () => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isHablarOpen, setIsHablarOpen] = useState(false);

  const { activeStudentId } = useAuthStore();
  const { currentTheme, setTheme, showCharacterBackground, toggleCharacterBackground } = useThemeStore();

  // Consulta reactiva del alumno activo en IndexedDB
  const alumnoActivo = useLiveQuery(
    async () => {
      if (!activeStudentId) return null;
      return await db.alumnos.get(activeStudentId);
    },
    [activeStudentId]
  );

  return (
    <>
      <header className="bg-surface/90 backdrop-blur-md border-b-2 border-borderCustom px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        
        {/* 1. Identificador del Alumno Activo */}
        <div className="flex items-center gap-2.5 bg-app px-4 py-2 rounded-2xl border-2 border-borderCustom shadow-inner">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-brand/10 text-brand flex items-center justify-center border border-brand/30 shrink-0">
            {alumnoActivo?.avatarUrl ? (
              <img src={alumnoActivo.avatarUrl} alt={alumnoActivo.nombre} className="w-full h-full object-cover" />
            ) : alumnoActivo?.nombre ? (
              <span className="font-black text-sm">{alumnoActivo.nombre.charAt(0).toUpperCase()}</span>
            ) : (
              <UserIcon className="w-4 h-4" />
            )}
          </div>
          <span className="text-sm font-extrabold text-primary tracking-wide">
            {alumnoActivo?.nombre || (activeStudentId ? 'Estudiante' : 'Invitado')}
          </span>
        </div>

        {/* 2. Acciones Principales */}
        <div className="flex items-center gap-2">
          {/* Botón Destacado "HABLAR" */}
          <button
            onClick={() => setIsHablarOpen(true)}
            aria-label="Abrir tablero de comunicación aumentativa SAAC"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer text-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>HABLAR</span>
          </button>

          {/* Opciones de Accesibilidad */}
          <button
            onClick={() => setIsOptionsOpen(true)}
            aria-label="Opciones de accesibilidad y paleta de colores"
            className="p-2.5 bg-app hover:bg-borderCustom/40 text-primary rounded-2xl border-2 border-borderCustom transition-colors cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

      </header>

      {/* Modal de Accesibilidad */}
      <Modal isOpen={isOptionsOpen} onClose={() => setIsOptionsOpen(false)} title="Opciones de Accesibilidad">
        <div className="flex flex-col gap-6 p-2">
          
          {/* Paleta de Colores */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-extrabold text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              <span>Paleta de Colores (Ley TEA)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {THEMES_CONFIG.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id as ThemeId)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-4 transition-all font-black text-sm cursor-pointer shadow text-left ${
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

          {/* Personajes de Fondo */}
          <div className="flex items-center justify-between p-4 bg-app rounded-2xl border-2 border-borderCustom">
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-primary">Personajes de Fondo</span>
              <span className="text-xs text-secondary">Mostrar ilustración suave en las esquinas de la pantalla</span>
            </div>
            <button
              onClick={toggleCharacterBackground}
              className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                showCharacterBackground
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-surface border border-borderCustom text-secondary'
              }`}
            >
              {showCharacterBackground ? 'Desactivar' : 'Activar'}
            </button>
          </div>

        </div>
      </Modal>

      {/* Modal del Tablero SAAC */}
      <Modal isOpen={isHablarOpen} onClose={() => setIsHablarOpen(false)} title="Tablero de Comunicación (SAAC)" size="full">
        <TableroSAAC />
      </Modal>
    </>
  );
};