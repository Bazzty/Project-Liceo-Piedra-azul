import React from 'react';
import { Clock, ArrowRight, Info } from 'lucide-react';
import { Button } from './Button'; // Ajusta la ruta de importación de tu botón según corresponda
import { useAuthStore } from '../../store/useAuthStore';

interface SessionTimeoutModalProps {
  onClose: () => void;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({ onClose }) => {
  const { isSessionExpiredModalOpen, closeSessionExpiredModal } = useAuthStore();

  if (!isSessionExpiredModalOpen) return null;

  const handleConfirm = () => {
    if (closeSessionExpiredModal) {
      closeSessionExpiredModal();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center relative overflow-hidden border border-amber-100">
        
        {/* Encabezado Decorativo */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500" />
        
        <div className="mx-auto w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-5 shadow-inner">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full mb-3 uppercase tracking-wider">
          Tiempo de Laboratorio Cumplido
        </span>

        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Sesión de Aula Finalizada!
        </h3>

        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
          Han transcurrido las <span className="font-semibold text-gray-800">1.5 horas</span> de uso continuo fijadas para el estudiante.
        </p>

        {/* Nota informativa docente */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-left flex gap-3 mb-6">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900 leading-normal">
            <span className="font-semibold">Nota para el docente:</span> Tu sesión continúa activa. Puedes seleccionar otro alumno o reactivar al mismo estudiante en el mosaico.
          </p>
        </div>

        {/* Botón de acción */}
        <Button 
          onClick={handleConfirm}
          className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95"
        >
          <span>Volver al Mosaico de Alumnos</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};