import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Volume2 } from 'lucide-react';
import { db, type Pictograma } from '../../db/db';
import { useSAACStore } from '../../store/useSAACStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { CategoriasBar } from './CategoriasBar';
import { SentenceBuilderBar } from './SentenceBuilderBar';

export const TableroSAAC: React.FC = () => {
  const { categoriaActiva, agregarPictograma } = useSAACStore();
  const { playAudio } = usePlayerStore();

  const pictogramas = useLiveQuery(
    () => db.pictogramas.where('categoria').equals(categoriaActiva).toArray(),
    [categoriaActiva]
  );

  const handleSelectPictograma = (pic: Pictograma) => {
    agregarPictograma(pic);
    if (pic.audioUrl) {
      playAudio(pic.audioUrl);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(pic.palabra);
      utterance.lang = 'es-CL';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full max-w-6xl mx-auto p-2">
      {/* 5.1 Cinta de Construcción de Frases */}
      <SentenceBuilderBar />

      {/* 5.2 Barra de Categorías */}
      <CategoriasBar />

      {/* 5.3 Grilla de Comunicadores SAAC */}
      <div className="flex-1 bg-surface/90 backdrop-blur-md border-4 border-borderCustom rounded-3xl p-4 sm:p-6 shadow-xl overflow-y-auto">
        {!pictogramas || pictogramas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
            <Volume2 className="w-10 h-10 text-secondary animate-pulse" />
            <p className="text-lg font-bold text-primary">Cargando pictogramas de la categoría...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {pictogramas.map((pic: Pictograma) => (
              <div
                key={pic.id}
                onClick={() => handleSelectPictograma(pic)}
                className="bg-app rounded-3xl border-4 border-borderCustom p-3 shadow-md hover:border-brand hover:bg-brand/5 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer h-36"
              >
                {/* Pictograma con Fallback Resiliente */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-surface rounded-2xl overflow-hidden flex items-center justify-center p-2 border-2 border-borderCustom shadow-inner">
                  {pic.imagenUrl ? (
                    <img src={pic.imagenUrl} alt={pic.palabra} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full bg-brand/10 text-brand font-black text-xl flex items-center justify-center">
                      {pic.palabra.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Palabra */}
                <span className="text-sm sm:text-base font-extrabold text-primary tracking-wide text-center">
                  {pic.palabra}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};