import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Sparkles } from 'lucide-react';
import { db, type Alumno } from '../db/db';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore, type ThemeId } from '../store/useThemeStore';
import { MainLayout } from '../layouts/MainLayout';

interface MosaicoAlumnosProps {
  onSelectStudent: () => void;
}

export const MosaicoAlumnos: React.FC<MosaicoAlumnosProps> = ({ onSelectStudent }) => {
  // Carga reactiva tipada explícitamente como Alumno[] desde IndexedDB
  const alumnos = useLiveQuery<Alumno[]>(() => db.alumnos.toArray());
  const { selectStudent, startCourseSession } = useAuthStore();
  const { setTheme } = useThemeStore();

  const handleStudentClick = (alumnoId: string, temaId: string) => {
    selectStudent(alumnoId);
    setTheme(temaId as ThemeId);
    startCourseSession(); // Inicia el conteo de 1.5 horas de la sesión
    onSelectStudent();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-surface px-4 py-2 rounded-full border-2 border-borderCustom text-sm font-extrabold text-primary">
            <Sparkles className="w-5 h-5 text-brand" />
            <span>Sala de Clases • Liceo Piedra Azul</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-primary">¿Quién va a leer hoy?</h1>
          <p className="text-secondary text-lg font-bold">
            Toca tu foto o avatar para entrar a tus lecturas
          </p>
        </div>

        {/* Mosaico de Tarjetas de Alumnos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 pt-4">
          {alumnos?.map((alumno: Alumno) => (
            <button
              key={alumno.id}
              onClick={() => handleStudentClick(alumno.id!, alumno.temaId)}
              className="bg-surface p-6 rounded-3xl border-4 border-borderCustom hover:border-brand shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 active:scale-95 flex flex-col items-center gap-4 group"
            >
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-brand/20 border-4 border-brand flex items-center justify-center text-4xl font-black text-brand group-hover:bg-brand group-hover:text-white transition-colors shadow-inner">
                {alumno.nombre.charAt(0).toUpperCase()}
              </div>
              <span className="text-2xl font-black text-primary group-hover:text-brand truncate max-w-full">
                {alumno.nombre}
              </span>
            </button>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};