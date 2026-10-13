import React, { useEffect } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { CharacterGuide } from '../components/common/CharacterGuide';
import { useAuthStore } from '../store/useAuthStore';

export const EsperaAulaView: React.FC = () => {
  const { setVistaInicio1, isClassroomSessionActive, checkClassroomStatus } = useAuthStore();

  useEffect(() => {
    const handleStorageChange = () => {
      checkClassroomStatus();
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(checkClassroomStatus, 1000);

    if (isClassroomSessionActive) {
      setVistaInicio1('aula-mosaico');
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [isClassroomSessionActive, setVistaInicio1, checkClassroomStatus]);

  return (
    <MainLayout allowScroll={true}>
      <div className="flex flex-col gap-6 w-full max-w-lg mx-auto py-12 px-4 justify-center h-full">
        
        <button
          onClick={() => setVistaInicio1('portal')}
          className="flex items-center gap-2 bg-surface px-4 py-2 rounded-2xl border-2 border-borderCustom font-black text-primary hover:border-brand transition-all active:scale-95 self-start cursor-pointer shadow"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>VOLVER</span>
        </button>

        <div className="bg-surface rounded-3xl border-4 border-borderCustom p-8 shadow-2xl flex flex-col items-center text-center gap-6">
          
          <div className="w-20 h-20 bg-amber-500/10 text-amber-600 rounded-3xl flex items-center justify-center border-2 border-amber-500/30 animate-pulse">
            <Clock className="w-10 h-10" />
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-2xl font-black text-primary">
              Esperando a la profesora
            </h3>
            <p className="text-secondary text-sm font-medium leading-relaxed">
              Pronto comenzaremos la clase. En cuanto se active, ingresaremos al laboratorio.
            </p>
          </div>

          <div className="w-full">
            <CharacterGuide 
              mensaje="¡Hola! Estoy listo para cuando la profesora inicie la sesión de lectura."
              variant="compact"
            />
          </div>

        </div>

      </div>
    </MainLayout>
  );
};