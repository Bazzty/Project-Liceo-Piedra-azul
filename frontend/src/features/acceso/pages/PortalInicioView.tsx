import React from 'react';
import { School, UserCheck, Home, ArrowLeft } from 'lucide-react';
import { MainLayout } from '@/shared/layouts/MainLayout';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes';

export const PortalInicioView: React.FC = () => {
  const { isClassroomSessionActive, setSessionType } = useAuthStore();
  const navigate = useNavigate();;

  const handleIngresoProfesor = () => {
    navigate(ROUTES.profesorLogin);
  };

  const handleIngresoColegio = () => {
    setSessionType('aula');
    if (isClassroomSessionActive) {
      navigate(ROUTES.aulaAlumnos);
    } else {
      navigate(ROUTES.aulaEspera);
    }
  };

  const handleIngresoCasa = () => {
    setSessionType('casa');
    navigate(ROUTES.casaLogin);
  };

  return (
    <MainLayout allowScroll={true}>
      <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-12 px-4 justify-center items-center h-full">
        
        {/* Encabezado */}
        <button
          onClick={() => navigate(ROUTES.selector)}
          className="flex items-center gap-2 bg-surface px-4 py-2 rounded-2xl border-2 border-borderCustom font-black text-primary hover:border-brand transition-all active:scale-95 cursor-pointer shadow"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>CAMBIAR MODO DEMO</span>
        </button>

        {/* Título */}
        <h2 className="text-3xl font-black text-primary tracking-tight text-center">
          ¿Cómo deseas ingresar?
        </h2>

        {/* 3 Opciones Simplificadas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mt-4">
          
          {/* 1. Acceso Profesor */}
          <div 
            onClick={handleIngresoProfesor}
            className="bg-surface rounded-3xl border-4 border-borderCustom p-6 shadow-xl flex flex-col items-center text-center gap-4 hover:border-brand transition-all cursor-pointer group"
          >
            <div className="w-16 h-16 bg-statusInfo-bg text-statusInfo rounded-2xl flex items-center justify-center border-2 border-statusInfo group-hover:scale-105 transition-transform">
              <UserCheck className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-black text-primary group-hover:text-statusInfo transition-colors">
                Acceso Profesor
              </h3>
              <p className="text-xs text-secondary font-medium">Gestión de clase</p>
            </div>
          </div>

          {/* 2. Entrar a Clases */}
          <div 
            onClick={handleIngresoColegio}
            className="bg-surface rounded-3xl border-4 border-borderCustom p-6 shadow-xl flex flex-col items-center text-center gap-4 hover:border-brand transition-all cursor-pointer group"
          >
            <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center border-2 border-brand/30 group-hover:scale-105 transition-transform">
              <School className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-black text-primary group-hover:text-brand transition-colors">
                Entrar a Clases
              </h3>
              <p className="text-xs text-secondary font-medium">Laboratorio del colegio</p>
            </div>
          </div>

          {/* 3. Mi Tarea en Casa */}
          <div 
            onClick={handleIngresoCasa}
            className="bg-surface rounded-3xl border-4 border-borderCustom p-6 shadow-xl flex flex-col items-center text-center gap-4 hover:border-brand transition-all cursor-pointer group"
          >
            <div className="w-16 h-16 bg-statusOk-bg text-statusOk rounded-2xl flex items-center justify-center border-2 border-statusOk group-hover:scale-105 transition-transform">
              <Home className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-black text-primary group-hover:text-statusOk transition-colors">
                Mi Tarea en Casa
              </h3>
              <p className="text-xs text-secondary font-medium">Para estudiar en el hogar</p>
            </div>
          </div>

        </div>

      </div>
    </MainLayout>
  );
};