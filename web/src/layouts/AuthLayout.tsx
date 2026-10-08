import React from 'react';
import { BookOpen } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-300">
      <div className="w-full max-w-md bg-surface rounded-3xl border-4 border-borderCustom shadow-2xl p-6 md:p-8 space-y-6 z-10">
        
        {/* Identificador / Logo de la Aplicación */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 bg-brand/10 text-brand rounded-2xl border-2 border-borderCustom animate-pulse">
            <BookOpen className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-primary">
            Leer Para Todos
          </h1>
          <p className="text-sm font-medium text-secondary">
            Plataforma de Lectura Adaptada y SAAC
          </p>
        </div>

        {/* Contenido Dinámico (Formulario de Login o Mosaico) */}
        <div className="relative">
          {children}
        </div>
        
      </div>
    </div>
  );
};