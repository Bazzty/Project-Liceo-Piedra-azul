import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { ROUTES } from './routes';

/** Solo docentes con sesión iniciada. */
export const RequireDocente: React.FC = () => {
  const role = useAuthStore((s) => s.role);
  return role === 'docente' ? <Outlet /> : <Navigate to={ROUTES.profesorLogin} replace />;
};

/** El mosaico del aula requiere una sesión de aula activa (o acceso desde casa). */
export const RequireSesionAula: React.FC = () => {
  const { isClassroomSessionActive, sessionType } = useAuthStore();
  return isClassroomSessionActive || sessionType === 'casa' ? <Outlet /> : <Navigate to={ROUTES.aulaEspera} replace />;
};

/** Pantallas del alumno: requieren haber elegido un alumno. */
export const RequireAlumno: React.FC = () => {
  const activeStudentId = useAuthStore((s) => s.activeStudentId);
  return activeStudentId ? <Outlet /> : <Navigate to={ROUTES.portal} replace />;
};
