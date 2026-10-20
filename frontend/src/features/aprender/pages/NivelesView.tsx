import React from 'react';
import { Button } from '@/shared/ui';
import { ArrowLeft } from 'lucide-react';
import { MainLayout } from '@/shared/layouts/MainLayout';
import { CharacterGuide } from '@/shared/components/CharacterGuide';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes';

export const NivelesView: React.FC = () => {
  const navigate = useNavigate();
  const onSelectNivel = (nivelId: string) => navigate(ROUTES.catalogo(nivelId));
  const onBack = () => navigate(ROUTES.menu);
  const mensajeGuia = '¡Elige el nivel que quieres practicar hoy!';

  return (
    <MainLayout allowScroll={false}>
      <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-6xl mx-auto h-full justify-center">
        
        {/* Encabezado Fijo con Botón Volver */}
        <div className="flex items-center justify-between bg-surface/90 backdrop-blur-md p-4 rounded-3xl shadow-md border-2 border-borderCustom shrink-0">
          <Button variant="secondary" size="sm" onClick={onBack}>
          	<ArrowLeft className="w-4 h-4" />
          	VOLVER
          </Button>
          
          <h2 className="text-xl sm:text-2xl font-extrabold text-primary tracking-wide">
            NIVELES DE LECTURA
          </h2>

          <div className="w-24" /> {/* Espaciador de simetría */}
        </div>

        {/* Layout de 3 Columnas sin Scroll */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-center w-full flex-1 max-h-[70vh]">
          
          {/* Lado Izquierdo: Niveles A y B */}
          <div className="flex flex-col gap-4 h-full">
            <button
              onClick={() => onSelectNivel('nivel-a')}
              style={{
                backgroundColor: 'var(--btn-aprender-bg)',
                color: 'var(--btn-aprender-text)',
                borderColor: 'var(--btn-aprender-border)',
              }}
              className="flex-1 p-2 sm:p-4 rounded-3xl border-4 shadow-lg hover:opacity-90 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 group cursor-pointer text-center"
            >
              <span className="text-xl sm:text-2xl font-extrabold tracking-wide">NIVEL A</span>
              <span className="text-xs sm:text-sm font-medium opacity-90">Vocales (A, E, I, O, U)</span>
            </button>

            <button
              onClick={() => onSelectNivel('nivel-b')}
              style={{
                backgroundColor: 'var(--btn-hablar-bg)',
                color: 'var(--btn-hablar-text)',
                borderColor: 'var(--btn-hablar-border)',
              }}
              className="flex-1 p-2 sm:p-4 rounded-3xl border-4 shadow-lg hover:opacity-90 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 group cursor-pointer text-center"
            >
              <span className="text-xl sm:text-2xl font-extrabold tracking-wide">NIVEL B</span>
              <span className="text-xs sm:text-sm font-medium opacity-90">Consonantes (M, L, S)</span>
            </button>
          </div>

          {/* Centro: Personaje Guía Importado */}
          <div className="h-full flex flex-col">
            <CharacterGuide mensaje={mensajeGuia} variant="large" className="h-full" />
          </div>

          {/* Lado Derecho: Niveles C y D */}
          <div className="flex flex-col gap-4 h-full">
            <button
              onClick={() => onSelectNivel('nivel-c')}
              style={{
                backgroundColor: 'var(--btn-colores-bg)',
                color: 'var(--btn-colores-text)',
                borderColor: 'var(--btn-colores-border)',
              }}
              className="flex-1 p-2 sm:p-4 rounded-3xl border-4 shadow-lg hover:opacity-90 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 group cursor-pointer text-center"
            >
              <span className="text-xl sm:text-2xl font-extrabold tracking-wide">NIVEL C</span>
              <span className="text-xs sm:text-sm font-medium opacity-90">Palabras Funcionales</span>
            </button>

            <button
              onClick={() => onSelectNivel('nivel-d')}
              style={{
                backgroundColor: 'var(--btn-logros-bg)',
                color: 'var(--btn-logros-text)',
                borderColor: 'var(--btn-logros-border)',
              }}
              className="flex-1 p-2 sm:p-4 rounded-3xl border-4 shadow-lg hover:opacity-90 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 group cursor-pointer text-center"
            >
              <span className="text-xl sm:text-2xl font-extrabold tracking-wide">NIVEL D</span>
              <span className="text-xs sm:text-sm font-medium opacity-90">Cuentos Cortos Duales</span>
            </button>
          </div>

        </div>
      </div>
    </MainLayout>
  );
};