import React from 'react';
import { GraduationCap } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  titulo?: string;
  subtitulo?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  titulo = 'Leer para Todos',
  subtitulo = 'Liceo Piedra Azul • Módulo de Acceso Seguro',
}) => {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="w-full max-w-md mx-auto flex flex-col gap-6">
        {/* Cabecera / Identificación Institucional */}
        <div className="text-center flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-3xl bg-brand/10 text-brand flex items-center justify-center shadow-sm border-2 border-borderCustom">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary">
            {titulo}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-secondary">
            {subtitulo}
          </p>
        </div>

        {/* Tarjeta Central del Formulario */}
        <div className="bg-surface p-6 sm:p-8 rounded-3xl border-2 border-borderCustom shadow-xl">
          {children}
        </div>

        {/* Pie de página institucional */}
        <div className="text-center text-xs font-medium text-secondary">
          Plataforma de Gestión Pedagógica • Liceo Piedra Azul
        </div>
      </div>
    </div>
  );
};