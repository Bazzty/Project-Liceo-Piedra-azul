import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  /** Oculta la X y el cierre con Escape (para diálogos que exigen una decisión). */
  dismissible?: boolean;
}

const SIZES = {
  sm: 'max-w-md w-full',
  md: 'max-w-2xl w-full',
  lg: 'max-w-4xl w-full',
  full: 'w-[95vw] max-w-none h-[90vh]',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  dismissible = true,
}) => {
  useEffect(() => {
    if (!isOpen || !dismissible) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, dismissible, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={`bg-surface rounded-card shadow-card border-2 border-borderCustom flex flex-col overflow-hidden max-h-[90vh] ${SIZES[size]}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-borderCustom bg-app shrink-0">
          <h3 className="text-xl font-extrabold text-primary">{title}</h3>
          {dismissible && (
            <button
              onClick={onClose}
              className="p-2 bg-surface hover:border-brand text-primary rounded-control border-2 border-borderCustom transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};
