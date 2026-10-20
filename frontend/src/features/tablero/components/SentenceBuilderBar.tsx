import React from 'react';
import { Volume2, Delete, Trash2, MessageSquare } from 'lucide-react';
import { useSAACStore } from '@/features/tablero/useSAACStore';

export const SentenceBuilderBar: React.FC = () => {
  const { fraseSecuencia, eliminarUltimoPictograma, limpiarFrase, isReadingSentence, setIsReadingSentence } = useSAACStore();

  const handleLeerFrase = () => {
    if (fraseSecuencia.length === 0) return;
    setIsReadingSentence(true);
    const textoFrase = fraseSecuencia.map((p) => p.palabra).join(' ');
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textoFrase);
    utterance.lang = 'es-CL';
    utterance.rate = 0.85;
    utterance.onend = () => setIsReadingSentence(false);
    utterance.onerror = () => setIsReadingSentence(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-surface border-4 border-borderCustom rounded-3xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 w-full">
      
      {/* Secuencia Acumulada de Pictogramas */}
      <div className="flex-1 flex items-center gap-2 overflow-x-auto w-full min-h-[90px] p-2 bg-app rounded-2xl border-2 border-borderCustom">
        {fraseSecuencia.length === 0 ? (
          <div className="flex items-center gap-2 text-secondary px-4 py-2 italic text-sm">
            <MessageSquare className="w-5 h-5 animate-pulse" />
            <span>Toca los pictogramas de abajo para construir tu frase...</span>
          </div>
        ) : (
          fraseSecuencia.map((item, idx) => (
            <div 
              key={idx}
              className="flex flex-col items-center bg-surface p-2 rounded-2xl border-2 border-borderCustom shadow-sm shrink-0 animate-fadeIn"
            >
              {item.imagenUrl ? (
                <div className="w-14 h-14 bg-app rounded-xl overflow-hidden flex items-center justify-center p-1 border border-borderCustom">
                  <img src={item.imagenUrl} alt={item.palabra} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-14 h-14 bg-brand/10 text-brand rounded-xl flex items-center justify-center font-black text-xl border border-brand/30">
                  {item.palabra.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-extrabold text-primary mt-1">
                {item.palabra}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Acciones de la Cinta */}
      <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
        <button
          onClick={eliminarUltimoPictograma}
          disabled={fraseSecuencia.length === 0}
          className="flex items-center gap-1.5 px-4 py-3 bg-statusWarn-bg hover:bg-statusWarn-bg text-statusWarn border-2 border-statusWarn rounded-2xl font-bold text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Borrar último"
        >
          <Delete className="w-4 h-4" />
          <span className="hidden sm:inline">BORRAR</span>
        </button>

        <button
          onClick={limpiarFrase}
          disabled={fraseSecuencia.length === 0}
          className="flex items-center gap-1.5 px-4 py-3 bg-statusDanger-bg hover:opacity-80 text-statusDanger border-2 border-statusDanger rounded-2xl font-bold text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Limpiar todo"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">LIMPIAR</span>
        </button>

        <button
          onClick={handleLeerFrase}
          disabled={fraseSecuencia.length === 0 || isReadingSentence}
          style={{
            backgroundColor: 'var(--btn-aprender-bg)',
            color: 'var(--btn-aprender-text)',
            borderColor: 'var(--btn-aprender-border)',
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl border-4 font-black text-xs sm:text-sm shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Volume2 className="w-5 h-5 animate-pulse" />
          <span>LEER FRASE</span>
        </button>
      </div>

    </div>
  );
};