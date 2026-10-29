import React from 'react';
import { AdminLayout } from '@/features/docente/AdminLayout';
import { AlumnosPanel } from '@/features/docente/components/AlumnosPanel';

export const EstudiantesPage: React.FC = () => (
  <AdminLayout activeSection="alumnos">
    <AlumnosPanel />
  </AdminLayout>
);
