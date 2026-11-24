import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { sonarToque } from '@/shared/audio/sonidos';
import { tableroDisponible } from '@/shared/config/tableroDisponible';
import { useTableroStore } from '@/shared/store/useTableroStore';

const ESTILOS = {
  nino: 'min-h-12 min-w-12 px-3 rounded-control border-2 border-borderStrong bg-statusOk text-onStatus font-black hover:opacity-90',
  icono: 'min-h-12 min-w-12 rounded-control border border-rail-line bg-statusOk text-onStatus hover:opacity-90',
} as const;

/** Abre el tablero de comunicación desde cualquier vista en que esté disponible; en las demás no aparece. */
export const BotonHablar: React.FC<{ variante?: keyof typeof ESTILOS }> = ({ variante = 'nino' }) => {
  const { pathname } = useLocation();
  const abrir = useTableroStore((s) => s.abrir);
  if (!tableroDisponible(pathname)) return null;
  return (
    <button
      type="button"
      onClick={() => {
        sonarToque();
        abrir();
      }}
      aria-haspopup="dialog"
      className={`inline-flex items-center justify-center gap-2 cursor-pointer transition-colors ${ESTILOS[variante]}`}
    >
      <MessageSquare className="w-5 h-5" aria-hidden />
      {variante === 'icono' ? <span className="sr-only">Tablero de comunicaciones</span> : <span>Hablar</span>}
    </button>
  );
};
