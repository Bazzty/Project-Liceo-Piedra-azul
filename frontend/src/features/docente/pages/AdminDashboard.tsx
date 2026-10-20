import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { AdminLayout, type AdminSection } from '@/features/docente/AdminLayout';
import { ResumenCurso } from '@/features/docente/components/ResumenCurso';
import { AlumnosPanel } from '@/features/docente/components/AlumnosPanel';
import { NivelesPanel } from '@/features/docente/components/NivelesPanel';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { resetDemoData } from '@/mocks/seed';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes';

/** 9. Vista de profesor: panel principal, alumnos y gestión de niveles/cuentos. */
export const AdminDashboard: React.FC = () => {
  const [seccion, setSeccion] = useState<Exclude<AdminSection, 'aula'>>('dashboard');
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const navegar = (destino: AdminSection) => {
    if (destino === 'aula') return navigate(ROUTES.profesorAula);
    setSeccion(destino);
  };

  const cerrarSesion = () => {
    logout();
    navigate(ROUTES.inicio);
  };

  const reiniciarDemo = async () => {
    if (window.confirm('Se borrarán los cambios y se volverán a cargar los datos de demostración. ¿Continuar?')) {
      await resetDemoData();
    }
  };

  return (
    <AdminLayout activeSection={seccion} onNavigate={navegar} onLogout={cerrarSesion}>
      {seccion === 'dashboard' && (
        <div className="flex flex-col gap-8">
          <ResumenCurso />
          <button
            onClick={reiniciarDemo}
            className="self-start inline-flex items-center gap-2 text-xs font-bold text-secondary hover:text-brand cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restablecer datos de demostración
          </button>
        </div>
      )}
      {seccion === 'alumnos' && <AlumnosPanel />}
      {seccion === 'cuentos' && <NivelesPanel />}
    </AdminLayout>
  );
};
