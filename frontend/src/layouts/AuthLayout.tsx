import React from 'react';
import { BookOpen } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-app flex flex-col justify-center items-center p-4 md:p-6 transition-colors duration-300">
      <div className="w-full max-w-md">
        {/* Cabecera / Identificación Institucional */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-brand text-white shadow-lg mb-2">
            <BookOpen className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">
            Leer para Todos
          </h1>
          <p className="text-sm font-semibold text-secondary">
            Liceo Piedra Azul • Módulo de Acceso Seguro
          </p>
        </div>

        {/* Tarjeta Central del Formulario */}
        <div className="bg-surface p-6 md:p-8 rounded-3xl border-4 border-borderCustom shadow-xl">
          {children}
        </div>

        {/* Pie de página accesible */}
        <div className="text-center mt-6 text-xs text-secondary font-medium">
          Sistema de Lectura Accesible • Ley TEA 21.545 & WCAG 2.1 AA
        </div>
      </div>
    </div>
  );
};