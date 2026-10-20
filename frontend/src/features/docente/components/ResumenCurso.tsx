import React from 'react';
import { ProgresoPorCuento, RegistroLista, StatsGrid } from '@/features/docente/components/widgets';
import { useResumen } from '@/features/docente/components/useResumen';

/** 9b. Dashboard con el resumen general del curso. */
export const ResumenCurso: React.FC = () => {
  const resumen = useResumen();

  if (!resumen) return <p className="text-secondary font-semibold">Cargando resumen…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-black text-primary">Resumen del curso</h2>
        <p className="text-sm font-semibold text-secondary">
          {resumen.alumnos.length} estudiantes · datos de demostración guardados en este equipo
        </p>
      </div>

      <StatsGrid resumen={resumen} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ProgresoPorCuento resumen={resumen} />
        <RegistroLista resumen={resumen} mostrarAlumno />
      </div>
    </div>
  );
};
