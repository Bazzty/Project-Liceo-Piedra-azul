import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface rounded-3xl border-4 border-borderCustom shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b-2 border-borderCustom bg-app">
          <h2 className="text-2xl font-extrabold text-primary">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="p-2 rounded-full hover:bg-surface text-primary transition-colors border-2 border-borderCustom"
          >
            <X className="w-8 h-8" />
          </button>
        </div>
        {/* Contenido del Modal */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};