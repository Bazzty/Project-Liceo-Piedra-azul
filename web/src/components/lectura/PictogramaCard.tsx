import React from 'react';
import { Volume2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CuentoPalabra } from '../../db/db';

export interface PictogramaCardProps {
  palabra: CuentoPalabra;
  isHighlighted?: boolean;
  onClick?: () => void;
  className?: string;
}

export const PictogramaCard: React.FC<PictogramaCardProps> = ({
  palabra,
  isHighlighted = false,
  onClick,
  className = '',
}) => {
  // Búsqueda automática en IndexedDB si la palabra del cuento no trae pictogramaUrl explícito
  const picEnDb = useLiveQuery(
    async () => {
      if (palabra.pictogramaUrl) return null;
      const cleanText = palabra.texto.toLowerCase().trim();
      return await db.pictogramas.where('palabra').equalsIgnoreCase(cleanText).first();
    },
    [palabra.texto, palabra.pictogramaUrl]
  );

  const finalImageUrl = palabra.pictogramaUrl || picEnDb?.imagenUrl;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onClick) onClick();
        }
      }}
      className={`flex flex-col items-center gap-2 cursor-pointer group transform hover:scale-105 active:scale-95 transition-all bg-app p-4 rounded-3xl border-4 shadow-md ${
        isHighlighted 
          ? 'border-brand bg-brand/15 ring-4 ring-brand/30 scale-105' 
          : 'border-borderCustom hover:border-brand'
      } ${className}`}
    >
      {/* Marco del Pictograma */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-surface rounded-2xl p-2 border-2 border-borderCustom flex items-center justify-center overflow-hidden shadow-inner relative">
        {finalImageUrl ? (
          <img 
            src={finalImageUrl} 
            alt={palabra.texto} 
            className="w-full h-full object-contain group-hover:scale-110 transition-transform" 
          />
        ) : (
          <div className="w-full h-full bg-brand/10 rounded-xl flex items-center justify-center text-brand font-black text-2xl">
            {palabra.texto.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Texto de la Palabra */}
      <span className={`text-base sm:text-lg font-extrabold tracking-wide ${isHighlighted ? 'text-brand' : 'text-primary'}`}>
        {palabra.texto}
      </span>
    </div>
  );
};