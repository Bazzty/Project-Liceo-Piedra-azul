import React from 'react';
import { ProgresoPorCuento, RegistroLista, StatsGrid } from './widgets';
import { useResumen } from './useResumen';

/** Dashboard con el resumen general del curso para vista docente */
export const ResumenCurso: React.FC = () => {
  const resumen = useResumen();

  if (!resumen) {
    return (
      <div className="flex items-center justify-center p-12 text-sm font-semibold text-[var(--admin-text-secondary)]">
        Cargando métricas del curso…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Cabecera de la Sección */}
      <div>
        <h2 className="text-2xl font-black text-[var(--admin-text-primary)] tracking-tight">
          Resumen General del Curso
        </h2>
        <p className="text-sm font-semibold text-[var(--admin-text-secondary)] mt-1">
          {resumen.alumnos.length} estudiantes matriculados • Datos de demostración guardados en este equipo
        </p>
      </div>

      {/* Tarjetas KPI de Resumen */}
      <StatsGrid resumen={resumen} />

      {/* Paneles Inferiores: Progreso y Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ProgresoPorCuento resumen={resumen} />
        <RegistroLista resumen={resumen} mostrarAlumno />
      </div>
    </div>
  );
};