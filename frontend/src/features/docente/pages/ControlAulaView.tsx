import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Play, Square } from 'lucide-react';
import { useAlumnos } from '@/api';
import { ROUTES } from '@/app/routes';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { AdminLayout } from '@/features/docente/AdminLayout';
import { AgendaClase } from '@/features/docente/components/AgendaClase';
import { EncabezadoPagina, Hoja } from '@/features/docente/components/Hoja';
import { Avatar, Button } from '@/shared/ui';

/** Control de aula: habilita los computadores del laboratorio y define la agenda visual de la clase. */
export const ControlAulaView: React.FC = () => {
  const navigate = useNavigate();
  const { isClassroomSessionActive, activarSesionAula, desactivarSesionAula } = useAuthStore();
  const alumnos = useAlumnos();

  return (
    <AdminLayout activeSection="aula">
      <EncabezadoPagina
        etiqueta="Laboratorio"
        titulo="Control de aula"
        descripcion="Habilita los computadores por 1,5 horas para que los niños entren con su tarjeta."
      />

      <Hoja className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-secondary">Sesión de clases</p>
          <p className="mt-1 font-display text-3xl font-semibold text-primary">
            {isClassroomSessionActive ? (
              <span className="text-statusOk">Activa</span>
            ) : (
              <span className="text-statusWarn">Inactiva</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {isClassroomSessionActive ? (
            <Button variant="danger" size="lg" onClick={desactivarSesionAula}>
              <Square className="w-5 h-5" aria-hidden /> Terminar la clase
            </Button>
          ) : (
            <Button size="lg" onClick={() => activarSesionAula()}>
              <Play className="w-5 h-5" aria-hidden /> Activar la clase (1,5 horas)
            </Button>
          )}
          <Button variant="secondary" size="lg" onClick={() => navigate(ROUTES.aulaAlumnos)}>
            <Monitor className="w-5 h-5" aria-hidden /> Ver mosaico en tiempo real
          </Button>
        </div>
      </Hoja>

      <Hoja aria-label="Estudiantes habilitados">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold text-primary">Estudiantes del curso</h2>
          <p className="text-xs text-secondary">{alumnos?.length ?? 0} registrados</p>
        </div>
        <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(alumnos ?? []).map((a) => (
            <li key={a.id} className="flex items-center gap-3 border border-borderCustom rounded-control px-3 py-2">
              <Avatar nombre={a.nombre} />
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold text-primary truncate">{a.nombre}</p>
                <p className="text-xs font-semibold text-statusOk">● Habilitado</p>
              </div>
            </li>
          ))}
        </ul>
      </Hoja>

      <AgendaClase />
    </AdminLayout>
  );
};
