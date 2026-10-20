import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Sparkles } from 'lucide-react';
import { db, type Alumno } from '../db/db';
import { MainLayout } from '../layouts/MainLayout';
import { useAuthStore } from '../store/useAuthStore';

export interface MosaicoAlumnosProps {
  onSelectStudent?: (studentId: string) => void;
  selectStudent?: (studentId: string) => void;
}

export const MosaicoAlumnos: React.FC<MosaicoAlumnosProps> = ({
  onSelectStudent,
  selectStudent,
}) => {
  const alumnos = useLiveQuery(() => db.alumnos.toArray(), []);
  const { setActiveStudentId, setVistaInicio1 } = useAuthStore();

  const handleStudentClick = (id: string) => {
    setActiveStudentId(id);
    setVistaInicio1('menu');
    const callback = onSelectStudent || selectStudent;
    if (typeof callback === 'function') {
      callback(id);
    }
  };

  return (
    <MainLayout allowScroll={true}>
      <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto py-8 px-4 items-center justify-center h-full">
        
        {/* Encabezado Directo para Niños */}
        <div className="flex flex-col items-center text-center gap-2 bg-surface/90 backdrop-blur-md p-6 rounded-3xl shadow-xl border-4 border-borderCustom w-full">
          <div className="flex items-center gap-2 bg-brand/10 text-brand px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-brand/30">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>SALA DE CLASES</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-black text-primary tracking-tight">
            ¿Quién eres hoy?
          </h2>
          
          <p className="text-secondary text-base font-medium">
            Toca tu foto para comenzar
          </p>
        </div>

        {/* Mosaico de Estudiantes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 w-full">
          {alumnos?.map((a: Alumno) => (
            <div
              key={a.id}
              onClick={() => a.id && handleStudentClick(a.id)}
              className="bg-surface rounded-3xl border-4 border-borderCustom p-5 shadow-xl hover:border-brand hover:scale-105 active:scale-95 transition-all flex flex-col items-center gap-3 cursor-pointer group"
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-brand/10 border-4 border-brand/30 overflow-hidden flex items-center justify-center shadow-inner group-hover:border-brand transition-colors">
                {a.avatarUrl ? (
                  <img src={a.avatarUrl} alt={a.nombre} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-brand">
                    {a.nombre.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <span className="text-lg font-black text-primary group-hover:text-brand transition-colors tracking-wide">
                {a.nombre}
              </span>
            </div>
          ))}
        </div>

      </div>
    </MainLayout>
  );
};