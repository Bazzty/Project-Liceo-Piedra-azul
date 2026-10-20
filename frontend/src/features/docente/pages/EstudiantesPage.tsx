import React from 'react';
import { AdminLayout } from '@/features/docente/AdminLayout';
import { AlumnosPanel } from '@/features/docente/components/AlumnosPanel';
import { Hoja } from '@/features/docente/components/Hoja';

export const EstudiantesPage: React.FC = () => (
  <AdminLayout activeSection="alumnos">
    <Hoja className="p-6">
      <AlumnosPanel />
    </Hoja>
  </AdminLayout>
);
