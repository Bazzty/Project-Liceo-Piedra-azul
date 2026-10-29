import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/app/routes';
import { AdminLayout } from '@/features/docente/AdminLayout';
import { InformeAlumno } from '@/features/docente/components/InformeAlumno';

export const InformePage: React.FC = () => {
  const { alumnoId } = useParams();
  if (!alumnoId) return <Navigate to={ROUTES.profesorEstudiantes} replace />;
  return (
    <AdminLayout activeSection="alumnos">
      <InformeAlumno alumnoId={alumnoId} />
    </AdminLayout>
  );
};
