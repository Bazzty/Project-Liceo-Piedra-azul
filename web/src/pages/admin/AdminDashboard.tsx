import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { AdminLayout, type AdminSection } from '../../layouts/AdminLayout';
import { ResumenCurso } from '../../components/admin/ResumenCurso';
import { AlumnosPanel } from '../../components/admin/AlumnosPanel';
import { NivelesPanel } from '../../components/admin/NivelesPanel';
import { useAuthStore } from '../../store/useAuthStore';
import { resetDemoData } from '../../db/seed';

/** 9. Vista de profesor: panel principal, alumnos y gestión de niveles/cuentos. */
export const AdminDashboard: React.FC = () => {
  const [seccion, setSeccion] = useState<Exclude<AdminSection, 'aula'>>('dashboard');
  const { setVistaInicio1, logout } = useAuthStore();

  const navegar = (destino: AdminSection) => {
    if (destino === 'aula') return setVistaInicio1('control-aula');
    setSeccion(destino);
  };

  const cerrarSesion = () => {
    logout();
    setVistaInicio1('portal');
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
