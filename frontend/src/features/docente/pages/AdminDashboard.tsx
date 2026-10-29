import React from 'react';
import { RotateCcw } from 'lucide-react';
import { AdminLayout } from '@/features/docente/AdminLayout';
import { ResumenCurso } from '@/features/docente/components/ResumenCurso';
import { resetDemoData } from '@/mocks/seed';

/** Resumen del curso (primera pantalla del panel docente). */
export const AdminDashboard: React.FC = () => {
  const reiniciarDemo = async () => {
    if (window.confirm('Se borrarán los cambios y se volverán a cargar los datos de demostración. ¿Continuar?')) {
      await resetDemoData();
    }
  };

  return (
    <AdminLayout activeSection="dashboard">
      <ResumenCurso />
      <button
        type="button"
        onClick={reiniciarDemo}
        className="self-start inline-flex items-center gap-2 min-h-12 text-sm font-semibold text-secondary hover:text-brand cursor-pointer"
      >
        <RotateCcw className="w-4 h-4" aria-hidden /> Restablecer datos de demostración
      </button>
    </AdminLayout>
  );
};
