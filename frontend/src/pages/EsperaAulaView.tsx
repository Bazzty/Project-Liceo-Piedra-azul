import React, { useEffect } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { CharacterGuide } from '../components/common/CharacterGuide';
import { useAuthStore } from '../store/useAuthStore';
import { getPersonajeAudio } from '../config/audioConfig';

export const EsperaAulaView: React.FC = () => {
  const { setVistaInicio1, isClassroomSessionActive, checkClassroomStatus } = useAuthStore();

  useEffect(() => {
    // Verificación inmediata al montar la pantalla
    checkClassroomStatus();

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

  const mensajeGuia = 'Pronto comenzaremos la clase. En cuanto se active, ingresaremos al laboratorio.';

  return (
    <MainLayout>
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-4 py-6 gap-8 justify-center items-center text-center animate-fade-in my-auto">
        <div className="w-full flex justify-start">
          <button
            onClick={() => setVistaInicio1('portal')}
            className="flex items-center gap-2 bg-surface px-4 py-2 rounded-2xl border-2 border-borderCustom font-black text-primary hover:border-brand transition-all active:scale95 cursor-pointer shadow-sm"
          >
            <ArrowLeft size={20} />
            VOLVER
          </button>
        </div>

        <div className="flex flex-col items-center gap-6 max-w-lg bg-surface border-4 border-borderCustom rounded-3xl p-8 shadow-xl">
          <div className="w-20 h-20 rounded-full bg-brand/10 text-brand flex items-center justify-center animate-pulse">
            <Clock size={40} />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-black text-primary">Esperando a la profesora</h2>
            <p className="text-sm font-semibold text-secondary">
              Pronto comenzaremos la clase. En cuanto se active, ingresaremos al laboratorio.
            </p>
          </div>

          <div className="w-full py-3 px-4 bg-app border-2 border-borderCustom rounded-2xl flex items-center justify-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              Conectado a la espera del aula
            </span>
          </div>
        </div>

        <CharacterGuide mensaje={mensajeGuia}
		audioUrl={getPersonajeAudio('espera')} />
      </div>
    </MainLayout>
  );
};