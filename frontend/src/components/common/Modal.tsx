import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  maxWidth?: string; // Opcional para flexibilidad extra (ej. max-w-5xl)
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  maxWidth,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Selección dinámica de dimensiones según el requerimiento visual
  const sizeClasses = maxWidth || {
    sm: 'max-w-md w-full',
    md: 'max-w-2xl w-full',
    lg: 'max-w-4xl w-full',
    full: 'w-[95vw] max-w-none h-[90vh] max-h-[90vh]',
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className={`bg-surface rounded-3xl shadow-2xl border-4 border-borderCustom flex flex-col overflow-hidden max-h-[90vh] ${sizeClasses}`}>
        
        {/* Encabezado Fijo del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-borderCustom bg-app/50 shrink-0">
          <h3 className="text-xl font-extrabold text-primary tracking-wide">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 bg-surface hover:bg-borderCustom/40 text-primary rounded-2xl border-2 border-borderCustom transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con Scroll Interno Suave */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

      </div>
    </div>
  );
};