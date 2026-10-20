import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Volume2, Star } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { MainLayout } from '../layouts/MainLayout';
import { CharacterGuide } from '../components/common/CharacterGuide';
import { LectorDualView } from '../components/lectura/LectorDualView';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';
import { db, type CuentoPagina, type CuentoPalabra } from '../db/db';

export interface LecturaViewProps {
  cuentoId: string;
  onBack: () => void;
  onSessionTimeoutRedirect?: () => void;
}

export const LecturaView: React.FC<LecturaViewProps> = ({
  cuentoId,
  onBack,
  onSessionTimeoutRedirect,
}) => {
  const [paginaIndex, setPaginaIndex] = useState(0);
  const [completado, setCompletado] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const { playAudio, stopAudio } = usePlayerStore();
  const { activeStudentId } = useAuthStore();

  // Solución al error de NodeJS: se usa el tipo 'number | null' nativo del navegador
  const highlightTimerRef = useRef<number | null>(null);
  const cuento = useLiveQuery(() => db.cuentos.get(cuentoId), [cuentoId]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current !== null) {
        window.clearInterval(highlightTimerRef.current);
      }
    };
  }, []);

  if (!cuento) {
    return (
      <MainLayout onSessionTimeoutRedirect={onSessionTimeoutRedirect} allowScroll={false}>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xl font-bold text-primary animate-pulse">Cargando cuento...</p>
        </div>
      </MainLayout>
    );
  }

  const totalPaginas = cuento.paginas.length;
  const paginaActual: CuentoPagina = cuento.paginas[paginaIndex] || cuento.paginas[0];

  // Resaltado en Tiempo Real durante la lectura asistida (0.8x)
  const handleEscucharPagina = () => {
    if (highlightTimerRef.current !== null) {
      window.clearInterval(highlightTimerRef.current);
    }
    setHighlightedIndex(0);
    const palabras = paginaActual.palabras;
    let idx = 0;

    highlightTimerRef.current = window.setInterval(() => {
      idx++;
      if (idx < palabras.length) {
        setHighlightedIndex(idx);
      } else {
        if (highlightTimerRef.current !== null) {
          window.clearInterval(highlightTimerRef.current);
        }
        setHighlightedIndex(null);
      }
    }, 850);

    if (paginaActual.audioPaginaUrl) {
      playAudio(paginaActual.audioPaginaUrl);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(paginaActual.textoCompleto);
      utterance.lang = 'es-CL';
      utterance.rate = 0.8; // Velocidad 0.8x
      utterance.onend = () => {
        if (highlightTimerRef.current !== null) {
          window.clearInterval(highlightTimerRef.current);
        }
        setHighlightedIndex(null);
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleEscucharPalabraIndividual = (palabra: CuentoPalabra, index: number) => {
    if (highlightTimerRef.current !== null) {
      window.clearInterval(highlightTimerRef.current);
    }
    setHighlightedIndex(index);

    if (palabra.audioUrl) {
      playAudio(palabra.audioUrl);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(palabra.texto);
      utterance.lang = 'es-CL';
      utterance.rate = 0.8;
      utterance.onend = () => setHighlightedIndex(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSiguiente = async () => {
    stopAudio();
    if (highlightTimerRef.current !== null) {
      window.clearInterval(highlightTimerRef.current);
    }
    setHighlightedIndex(null);

    if (paginaIndex < totalPaginas - 1) {
      setPaginaIndex(paginaIndex + 1);
    } else {
      if (activeStudentId) {
        await db.progresos.add({
          alumnoId: activeStudentId,
          cuentoId: cuento.id || cuentoId,
          completado: true,
          fechaUltimoAcceso: new Date().toISOString(),
        });
      }
      setCompletado(true);
    }
  };

  const handleAnterior = () => {
    stopAudio();
    if (highlightTimerRef.current !== null) {
      window.clearInterval(highlightTimerRef.current);
    }
    setHighlightedIndex(null);

    if (paginaIndex > 0) {
      setPaginaIndex(paginaIndex - 1);
    }
  };

  if (completado) {
    return (
      <MainLayout onSessionTimeoutRedirect={onSessionTimeoutRedirect} allowScroll={false}>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-surface border-4 border-borderCustom rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl flex flex-col items-center gap-6">
            
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-600 rounded-3xl flex items-center justify-center border-2 border-emerald-500/30 animate-bounce">
              <Star className="w-10 h-10 fill-current" />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full mx-auto">
                ¡NUEVA LECTURA COMPLETADA!
              </span>
              <h2 className="text-3xl font-extrabold text-primary">
                ¡Felicitaciones!
              </h2>
              <p className="text-secondary text-base">
                Has leído exitosamente el cuento <span className="font-bold text-primary">"{cuento.titulo}"</span>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => {
                  setPaginaIndex(0);
                  setCompletado(false);
                }}
                style={{
                  backgroundColor: 'var(--btn-aprender-bg)',
                  color: 'var(--btn-aprender-text)',
                  borderColor: 'var(--btn-aprender-border)',
                }}
                className="flex-1 py-4 px-6 rounded-3xl border-4 font-black text-lg shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                LEER OTRA VEZ
              </button>

              <button
                onClick={onBack}
                className="flex-1 py-4 px-6 rounded-3xl border-4 border-borderCustom bg-surface text-primary font-black text-lg shadow-lg hover:bg-borderCustom/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                VOLVER AL CATÁLOGO
              </button>
            </div>

          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout onSessionTimeoutRedirect={onSessionTimeoutRedirect} allowScroll={false}>
      <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto h-full justify-between pb-4">
        
        {/* Encabezado Fijo */}
        <div className="flex items-center justify-between bg-surface/90 backdrop-blur-md p-4 rounded-3xl shadow-md border-2 border-borderCustom shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-app hover:bg-borderCustom/40 text-primary font-bold rounded-2xl border-2 border-borderCustom transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>VOLVER</span>
          </button>
          
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-extrabold text-primary">
              {cuento.titulo}
            </h2>
            <span className="text-xs font-bold text-secondary">
              Página {paginaIndex + 1} de {totalPaginas}
            </span>
          </div>

          <div className="px-3 py-1.5 bg-brand/10 text-brand rounded-2xl border border-brand/30 text-sm font-extrabold">
            {paginaIndex + 1}/{totalPaginas}
          </div>
        </div>

        {/* Guía en modo compacto */}
        <div className="w-full shrink-0">
          <CharacterGuide 
            mensaje="Toca cada pictograma para escuchar su sonido o usa el botón superior para escuchar la página completa."
            variant="compact"
          />
        </div>

        {/* Renderizador Lector Dual */}
        <div className="flex-1 bg-surface/90 backdrop-blur-md border-4 border-borderCustom rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center shadow-xl relative overflow-y-auto">
          <button
            onClick={handleEscucharPagina}
            className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-brand/10 hover:bg-brand/20 text-brand border-2 border-brand/30 rounded-2xl font-bold text-sm transition-all cursor-pointer shadow-sm"
          >
            <Volume2 className="w-4 h-4" />
            <span>Escuchar Página</span>
          </button>

          <LectorDualView
            palabras={paginaActual.palabras}
            highlightedIndex={highlightedIndex}
            onPalabraClick={handleEscucharPalabraIndividual}
          />
        </div>

        {/* Controles de Navegación */}
        <div className="flex items-center justify-between gap-4 shrink-0">
          <button
            onClick={handleAnterior}
            disabled={paginaIndex === 0}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold border-2 border-borderCustom transition-all ${
              paginaIndex === 0 
                ? 'opacity-40 cursor-not-allowed bg-app text-secondary' 
                : 'bg-surface text-primary hover:bg-borderCustom/30 cursor-pointer shadow-md'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>ANTERIOR</span>
          </button>

          <button
            onClick={handleEscucharPagina}
            className="flex items-center gap-2 px-6 py-3.5 bg-brand text-white font-extrabold rounded-2xl shadow-lg hover:opacity-95 active:scale-95 transition-all cursor-pointer"
          >
            <Volume2 className="w-5 h-5" />
            <span>ESCUCHAR</span>
          </button>

          <button
            onClick={handleSiguiente}
            className="flex items-center gap-2 px-6 py-3.5 bg-emerald-600 text-white font-extrabold rounded-2xl shadow-lg hover:opacity-95 active:scale-95 transition-all cursor-pointer"
          >
            <span>{paginaIndex === totalPaginas - 1 ? 'FINALIZAR' : 'SIGUIENTE'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </MainLayout>
  );
};