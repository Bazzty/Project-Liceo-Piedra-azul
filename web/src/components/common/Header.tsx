import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, Settings, User as UserIcon } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { THEMES_CONFIG } from '../../config/themes';

export const Header: React.FC = () => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isHablarOpen, setIsHablarOpen] = useState(false);
  const { activeStudentId } = useAuthStore();
  const { currentTheme, setTheme, showCharacterBackground, toggleCharacterBackground } = useThemeStore();

  const handleBack = () => {
    window.history.back();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface border-b-4 border-borderCustom px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* 1. Botón Volver */}
          <Button variant="secondary" onClick={handleBack} aria-label="Volver atrás">
            <ArrowLeft className="w-6 h-6 mr-1" />
            <span className="hidden sm:inline">Atrás</span>
          </Button>

          {/* 2. Identificador del Alumno Activo */}
          <div className="flex items-center gap-2 bg-app px-4 py-2 rounded-2xl border-2 border-borderCustom">
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white font-bold">
              <UserIcon className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-primary text-sm sm:text-base">
              {activeStudentId ? 'Mateo' : 'Invitado'}
            </span>
          </div>

          {/* 3. Acciones de la Derecha */}
          <div className="flex items-center gap-2">
            {/* Botón Destacado "HABLAR" */}
            <Button
              variant="accent"
              onClick={() => setIsHablarOpen(true)}
              aria-label="Abrir tablero de comunicación"
              className="text-yellow-950 font-black animate-pulse"
            >
              <MessageSquare className="w-6 h-6 mr-1 sm:mr-2" />
              <span>HABLAR</span>
            </Button>

            {/* Engranaje de Opciones */}
            <Button
              variant="secondary"
              onClick={() => setIsOptionsOpen(true)}
              aria-label="Opciones de accesibilidad"
            >
              <Settings className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Modal de Opciones de Accesibilidad */}
      <Modal
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        title="Opciones de Accesibilidad"
      >
        <div className="space-y-6">
          {/* Selector de Temas */}
          <div>
            <h3 className="text-lg font-bold text-primary mb-3">Paleta de Colores (Ley TEA)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {THEMES_CONFIG.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id as any)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all font-bold ${
                    currentTheme === theme.id
                      ? 'border-brand bg-brand/10 ring-2 ring-brand'
                      : 'border-borderCustom bg-surface hover:bg-app'
                  }`}
                >
                  <span
                    className="w-6 h-6 rounded-full border border-black/20 shadow-inner"
                    style={{ backgroundColor: theme.colorPreviewHex }}
                  />
                  <span className="text-primary">{theme.nombre}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Personajes de Fondo */}
          <div className="pt-4 border-t-2 border-borderCustom flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-primary">Personajes de Fondo</h3>
              <p className="text-sm text-secondary">
                Mostrar ilustración suave en los bordes del fondo
              </p>
            </div>
            <Button variant="secondary" onClick={toggleCharacterBackground}>
              {showCharacterBackground ? 'Desactivar' : 'Activar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Temporal para Botón HABLAR (Se conectará en la Fase 5) */}
      <Modal
        isOpen={isHablarOpen}
        onClose={() => setIsHablarOpen(false)}
        title="Tablero de Comunicación (SAAC)"
      >
        <div className="text-center py-8">
          <MessageSquare className="w-16 h-16 text-brand mx-auto mb-4" />
          <p className="text-xl font-bold text-primary">
            ¡El Tablero "HABLAR" se activará en la Fase 5!
          </p>
          <p className="text-secondary mt-2">
            Permitirá seleccionar pictogramas para armar oraciones completas.
          </p>
        </div>
      </Modal>
    </>
  );
};