import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { ROUTES } from '@/app/routes';
import { useAlumnos, useCuentos, useRegistros } from '@/api';
import { destinatarios, estadoTarea } from '@/features/tareas/estadoTarea';
import { useAsignacionesStore } from '@/features/tareas/useAsignacionesStore';

/** Una línea con la tarea vigente más reciente y cuántos ya la hicieron. */
export const TareaDeHoy: React.FC = () => {
  const alumnos = useAlumnos();
  const cuentos = useCuentos();
  const registros = useRegistros();
  const asignaciones = useAsignacionesStore((s) => s.asignaciones);
  if (!alumnos || !cuentos || !registros) return null;

  const hoy = new Date().toISOString().slice(0, 10);
  const tarea = [...asignaciones].filter((a) => !a.limite || a.limite >= hoy).sort((x, y) => y.creada.localeCompare(x.creada))[0];
  if (!tarea) return null;

  const ids = destinatarios(tarea, alumnos.flatMap((a) => (a.id ? [a.id] : [])));
  const hechas = ids.filter((id) => estadoTarea(tarea, id, registros) === 'hecha').length;
  const titulo = cuentos.find((c) => c.id === tarea.cuentoId)?.titulo ?? 'Tarea';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-borderCustom bg-surface px-4 py-3">
      <p className="flex items-center gap-3 text-sm text-primary">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tinte-azul text-tinte-azul-fuerte">
          <ClipboardCheck className="h-[1.125rem] w-[1.125rem]" aria-hidden />
        </span>
        <span>
          Tarea de hoy: <strong className="font-semibold">{titulo}</strong> · {hechas} de {ids.length} la hicieron
        </span>
      </p>
      <Link to={ROUTES.profesorActividades} className="text-sm font-medium text-brand hover:text-brand-hover">
        Ver quién falta
      </Link>
    </div>
  );
};
