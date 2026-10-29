import React from 'react';
import { ArrowRight, BookOpen, MessageCircle, Star } from 'lucide-react';
import { useAjustesStore, type PasoAgenda } from '@/shared/store/useAjustesStore';

const PASOS: Record<PasoAgenda, { nombre: string; icono: React.ReactNode; color: string }> = {
  leer: { nombre: 'Leer', icono: <BookOpen className="w-6 h-6" aria-hidden />, color: 'bg-btnAprender-bg text-btnAprender-text' },
  hablar: { nombre: 'Hablar', icono: <MessageCircle className="w-6 h-6" aria-hidden />, color: 'bg-btnHablar-bg text-btnHablar-text' },
  estrellas: { nombre: 'Estrellas', icono: <Star className="w-6 h-6" aria-hidden />, color: 'bg-btnLogros-bg text-btnLogros-text' },
};

/**
 * Agenda visual "Primero – Después": predecible para niños con TEA.
 * La docente define los dos pasos; el niño los toca para ir.
 */
export const AgendaVisual: React.FC<{ onElegir: (paso: PasoAgenda) => void }> = ({ onElegir }) => {
  const agenda = useAjustesStore((s) => s.agenda);

  return (
    <div className="flex items-center gap-2 sm:gap-3 rounded-full bg-app border-2 border-borderStrong px-2 sm:px-3 py-1" role="group" aria-label="Primero y después">
      {agenda.map((paso, i) => {
        const { nombre, icono, color } = PASOS[paso];
        return (
          <React.Fragment key={i}>
            {i === 1 && <ArrowRight className="w-5 h-5 text-secondary" aria-hidden />}
            <button
              type="button"
              onClick={() => onElegir(paso)}
              aria-label={`${i === 0 ? 'Primero' : 'Después'}: ${nombre}`}
              className="flex items-center gap-2 cursor-pointer rounded-full pr-1 sm:pr-3 hover:bg-surface"
            >
              <span className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>{icono}</span>
              <span className="hidden sm:flex flex-col leading-tight text-left">
                <span className="text-[0.7rem] font-bold text-secondary uppercase">{i === 0 ? 'Primero' : 'Después'}</span>
                <span className="text-base font-black text-primary">{nombre}</span>
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};
