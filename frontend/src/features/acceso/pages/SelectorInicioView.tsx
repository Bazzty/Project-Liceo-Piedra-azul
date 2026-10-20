import React from 'react';
import { School, Sparkles, Layout } from 'lucide-react';
import { MainLayout } from '@/shared/layouts/MainLayout';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes';

export const SelectorInicioView: React.FC = () => {
  const navigate = useNavigate();

  const handleSeleccionarInicio1 = () => {
    navigate(ROUTES.portal);
  };

  const handleSeleccionarInicio2 = () => {
    navigate(ROUTES.inicio2);
  };

  return (
    <MainLayout allowScroll={true}>
      <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto py-8 px-4 items-center">
        
        {/* Banner de Encabezado */}
        <div className="flex flex-col items-center text-center gap-3 bg-surface/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-xl border-4 border-borderCustom w-full">
          <div className="flex items-center gap-2 bg-brand/10 text-brand px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-brand/30">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>PROTOTIPO LECTURA INCLUSIVA - LICEO PIEDRA AZUL</span>
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-black text-primary tracking-tight">
            Selección de Modo de Inicio
          </h1>
          
          <p className="text-secondary text-sm sm:text-base max-w-2xl font-medium">
            Elige el flujo de acceso que deseas evaluar en esta presentación del prototipo:
          </p>
        </div>

        {/* Tarjetas Principales de Selección */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          
          {/* Opción 1: Inicio 1 (Modelo Oficial Aula + Casa) */}
          <div className="bg-surface rounded-3xl border-4 border-borderCustom p-6 sm:p-8 shadow-xl flex flex-col justify-between gap-6 hover:border-brand transition-all group">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 bg-brand/10 text-brand rounded-2xl flex items-center justify-center border-2 border-brand/30 group-hover:scale-105 transition-transform">
                  <School className="w-7 h-7" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-brand bg-brand/10 px-3 py-1 rounded-full border border-brand/30">
                  MODELO OFICIAL REQUERIDO
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-xl sm:text-2xl font-black text-primary group-hover:text-brand transition-colors">
                  Inicio 1: Aula + Casa
                </h3>
                <p className="text-sm sm:text-base text-secondary leading-relaxed">
                  Sistema completo para el Liceo Piedra Azul: Control docente de aula (1.5 hrs), ingreso por Mosaico para los niños en el laboratorio e ingreso individual por PIN para tareas en el hogar.
                </p>
              </div>
            </div>

            <button
              onClick={handleSeleccionarInicio1}
              style={{
                backgroundColor: 'var(--btn-aprender-bg)',
                color: 'var(--btn-aprender-text)',
                borderColor: 'var(--btn-aprender-border)',
              }}
              className="w-full py-4 px-6 rounded-2xl border-4 font-black text-base shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>PROBAR INICIO 1 (AULA/CASA)</span>
            </button>
          </div>

          {/* Opción 2: Inicio 2 (Modelo Directo Prototipo) */}
          <div className="bg-surface rounded-3xl border-4 border-borderCustom p-6 sm:p-8 shadow-xl flex flex-col justify-between gap-6 hover:border-brand transition-all group">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 bg-statusOk-bg text-statusOk rounded-2xl flex items-center justify-center border-2 border-statusOk group-hover:scale-105 transition-transform">
                  <Layout className="w-7 h-7" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-statusOk bg-statusOk-bg px-3 py-1 rounded-full border border-statusOk">
                  FLUJO DIRECTO EN INTEGRACIÓN
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-xl sm:text-2xl font-black text-primary group-hover:text-statusOk transition-colors">
                  Inicio 2: Demostración Directa
                </h3>
                <p className="text-sm sm:text-base text-secondary leading-relaxed">
                  Acceso simplificado de evaluación rápida. Permite saltar directamente al catálogo de cuentos y tablero de comunicación.
                </p>
              </div>
            </div>

            <button
              onClick={handleSeleccionarInicio2}
              style={{
                backgroundColor: 'var(--btn-hablar-bg)',
                color: 'var(--btn-hablar-text)',
                borderColor: 'var(--btn-hablar-border)',
              }}
              className="w-full py-4 px-6 rounded-2xl border-4 font-black text-base shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>PROBAR INICIO 2 (DIRECTO)</span>
            </button>
          </div>

        </div>

        {/* Pie de Página Informativo */}
        <div className="text-center text-xs sm:text-sm font-bold text-secondary pt-4">
          Proyecto elaborado para el Liceo Piedra Azul y la Universidad San Sebastián.
        </div>

      </div>
    </MainLayout>
  );
};