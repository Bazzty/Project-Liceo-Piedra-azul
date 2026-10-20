import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { AdminLayout, type AdminSection } from '../../layouts/AdminLayout';
import { ResumenCurso } from '../../components/admin/ResumenCurso';
import { AlumnosPanel } from '../../components/admin/AlumnosPanel';
import { NivelesPanel } from '../../components/admin/NivelesPanel';
import { useAuthStore } from '../../store/useAuthStore';
import { resetDemoData } from '../../db/seed';

/** Vista principal del profesor: tablero general, nómina de alumnos y gestión de niveles/cuentos */
export const AdminDashboard: React.FC = () => {
  const [seccion, setSeccion] = useState<AdminSection>('dashboard');
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
    if (window.confirm('Se borrarán los cambios locales y se volverán a cargar los datos de demostración. ¿Continuar?')) {
      await resetDemoData();
    }
  };

  return (
    <AdminLayout activeSection={seccion} onNavigate={navegar} onLogout={cerrarSesion}>
      {seccion === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={reiniciarDemo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-admin-border text-admin-text-secondary hover:text-admin-text-main hover:bg-admin-surface-hover text-xs font-medium transition-colors cursor-pointer"
              title="Restaurar datos de prueba iniciales"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar datos de prueba
            </button>
          </div>
          <ResumenCurso />
        </div>
      )}
      {seccion === 'alumnos' && <AlumnosPanel />}
      {seccion === 'cuentos' && <NivelesPanel />}
    </AdminLayout>
  );
};