import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const FOCUSABLES = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  const dialogRef = useRef<HTMLDivElement>(null);

  // Al abrir, el foco entra al diálogo; al cerrar, vuelve a donde estaba
  useEffect(() => {
    if (!isOpen) return;
    const anterior = document.activeElement as HTMLElement | null;
    const dialogo = dialogRef.current;
    (dialogo?.querySelector<HTMLElement>(FOCUSABLES) ?? dialogo)?.focus();
    return () => anterior?.focus?.();
  }, [isOpen]);

  if (!isOpen) return null;

  // El teclado se atiende en el propio diálogo: Escape cierra solo el de arriba y Tab no sale de él
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && dismissible) {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const dialogo = dialogRef.current;
    const items = dialogo ? [...dialogo.querySelectorAll<HTMLElement>(FOCUSABLES)] : [];
    if (items.length === 0) return e.preventDefault();
    const primero = items[0];
    const ultimo = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === primero || document.activeElement === dialogo)) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  };

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm p-4 animate-fadeIn outline-none"
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
