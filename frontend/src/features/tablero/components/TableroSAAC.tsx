import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Delete, HandHelping, MousePointerClick, Volume2 } from 'lucide-react';
import type { Pictograma } from '@/types';
import { crearRegistro, usePictogramas } from '@/api';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { franjaDe, ordenarTablero } from '@/features/tablero/categoriasTablero';
import { resolverYGuardarPictograma } from '@/features/tablero/arasaac';
import { decirSecuencia, type ElementoDeVoz } from '@/shared/audio/decirSecuencia';
import { sonarAcierto, sonarToque } from '@/shared/audio/sonidos';
import { LluviaEstrellas } from '@/shared/components/LluviaEstrellas';
import { OsoCabeza } from '@/shared/components/OsoCabeza';

const PALABRAS_POR_FRASE = 8;
const BOCAS = ['AEI', 'O', 'EE', 'U', 'BMP', 'L', 'AEI'];

const aVoz = (p: Pictograma): ElementoDeVoz => ({ texto: p.palabra, audioUrl: p.audioUrl });

/** Boca del osito: se mueve mientras `activa` es verdadero y vuelve a sonreír al terminar. */
const useBoca = (activa: boolean) => {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!activa) return;
    const id = setInterval(() => setI((n) => (n + 1 + Math.floor(Math.random() * 2)) % BOCAS.length), 130);
    return () => clearInterval(id);
  }, [activa]);
  return activa ? BOCAS[i] : 'HAPPY';
};

/** Dibujo con respaldo: si el archivo no está, lo pide a ARASAAC una vez; si tampoco, muestra la inicial. */
const Dibujo: React.FC<{ pic: Pictograma; className: string }> = ({ pic, className }) => {
  const [src, setSrc] = useState(pic.imagenUrl);
  const [fallo, setFallo] = useState(false);
  const alFallar = async () => {
    if (fallo) return;
    const url = await resolverYGuardarPictograma(pic.palabra);
    if (url && url !== src) setSrc(url);
    else setFallo(true);
  };
  return fallo ? (
    <span className={`${className} flex items-center justify-center text-4xl font-black text-secondary`}>{pic.palabra.charAt(0).toUpperCase()}</span>
  ) : (
    <img src={src} alt="" onError={alFallar} className={`${className} object-contain`} />
  );
};

/** Una tecla: tarjeta blanca con el dibujo grande y una franja fina del color de su categoría. */
const Tecla: React.FC<{ pic: Pictograma; alTocar: (pic: Pictograma) => void }> = ({ pic, alTocar }) => {
  const [pulsada, setPulsada] = useState(false);
  const franja = franjaDe(pic.categoria).split(' ')[0];
  return (
    <button
      type="button"
      onClick={() => {
        setPulsada(true);
        setTimeout(() => setPulsada(false), 400);
        alTocar(pic);
      }}
      aria-label={pic.palabra}
      className={`flex flex-col items-center overflow-hidden rounded-3xl border-4 border-borderStrong bg-surface shadow-card cursor-pointer transition-transform hover:border-brand active:scale-90 ${pulsada ? 'animate-pop' : ''}`}
    >
      <span className={`h-2.5 w-full ${franja}`} aria-hidden />
      <span className="flex items-center justify-center p-3">
        <Dibujo pic={pic} className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32" />
      </span>
      <span className="pb-3 text-xl sm:text-2xl font-black leading-tight truncate max-w-full px-2">{pic.palabra}</span>
    </button>
  );
};

/**
 * Hablar: el osito dice lo que el niño arma, palabra por palabra. Un solo tablero, sin pestañas ni menús: el
 * osito y su burbuja arriba (ahí aparecen los dibujos que se tocan) y todas las palabras abajo, con las más
 * usadas primero. Sin texto que leer.
 */
export const TableroSAAC: React.FC<{ onCerrar: () => void }> = ({ onCerrar }) => {
  const activeStudentId = useAuthStore((s) => s.activeStudentId);
  const supervision = useAuthStore((s) => s.supervision);
  const todos = usePictogramas();
  const [frase, setFrase] = useState<Pictograma[]>([]);
  const [sonando, setSonando] = useState<number | null>(null);
  const [celebra, setCelebra] = useState(false);
  const corte = useRef(0);
  const boca = useBoca(sonando !== null);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [onCerrar]);

  const palabras = useMemo(() => ordenarTablero(todos ?? []), [todos]);
  const ayuda = todos?.find((p) => p.id === 'pic-ayuda');

  const registrar = (pics: Pictograma[], extra = '') => {
    if (!activeStudentId || supervision || pics.length === 0) return;
    void crearRegistro({
      alumnoId: activeStudentId,
      tipo: 'tablero',
      detalle: `Tablero: «${pics.map((p) => p.palabra).join(' ')}»${extra}`,
      lugar: 'casa',
      fecha: new Date().toISOString(),
      pictogramaIds: pics.map((p) => p.id ?? '').filter(Boolean),
    });
  };

  /** El osito dice la frase, palabra por palabra, y al final se celebra. */
  const decir = async (pics: Pictograma[]) => {
    if (pics.length === 0) return;
    corte.current += 1;
    const mio = corte.current;
    setCelebra(false);
    await decirSecuencia(pics.map(aVoz), { alDecir: setSonando, cancelada: () => corte.current !== mio });
    if (corte.current === mio) {
      sonarAcierto();
      setCelebra(true);
      setTimeout(() => setCelebra(false), 2600);
    }
  };

  const tocarTecla = (pic: Pictograma) => {
    sonarToque();
    if (frase.length < PALABRAS_POR_FRASE) setFrase((f) => [...f, pic]);
    corte.current += 1;
    // Cada palabra se dice al tocarla: el niño oye lo que eligió
    void decirSecuencia([aVoz(pic)]);
  };

  const decirMiFrase = () => {
    void decir(frase);
    registrar(frase);
  };

  const pedirAyuda = () => {
    if (!ayuda) return;
    sonarToque();
    corte.current += 1;
    setFrase([ayuda]);
    void decirSecuencia([{ texto: 'Necesito ayuda', audioUrl: ayuda.audioUrl }], { alDecir: setSonando });
    registrar([ayuda], ' (botón de ayuda)');
  };

  const borrarUltima = () => {
    corte.current += 1;
    setSonando(null);
    setFrase((f) => f.slice(0, -1));
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Hablar" className="fixed inset-0 z-50 flex flex-col bg-app text-primary overflow-hidden animate-fadeIn">
      {celebra && <LluviaEstrellas />}

      <header className="flex items-center justify-between gap-3 px-3 sm:px-6 py-2 sm:py-3">
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Volver"
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-accent text-onAccent border-4 border-borderStrong flex items-center justify-center cursor-pointer hover:bg-accent-hover active:scale-90 transition-all"
        >
          <ArrowLeft className="w-8 h-8" strokeWidth={2.5} aria-hidden />
        </button>
        <h1 className="sr-only">Hablar</h1>
        {ayuda && (
          <button
            type="button"
            onClick={pedirAyuda}
            aria-label="Necesito ayuda"
            className="flex items-center gap-2 h-14 pl-4 pr-5 rounded-full bg-statusDanger text-onStatus cursor-pointer active:scale-90 transition-transform"
          >
            <HandHelping className="w-7 h-7" aria-hidden />
            <span className="text-lg font-black">Ayuda</span>
          </button>
        )}
      </header>

      {/* El osito y su burbuja: ahí aparecen los dibujos que el niño elige */}
      <section className="flex items-center gap-3 sm:gap-5 px-3 sm:px-6">
        <div className={`shrink-0 ${celebra ? 'animate-saltito' : ''}`}>
          <span className="block w-20 h-20 sm:w-28 sm:h-28 bg-surface rounded-full border-4 border-borderStrong p-1 overflow-hidden" role="img" aria-label="Osito">
            <OsoCabeza boca={boca} />
          </span>
        </div>

        <div className="relative flex-1 min-w-0 flex items-center gap-3 rounded-[2rem] border-4 border-borderStrong bg-surface p-2 sm:p-3">
          <span className="absolute -left-3 top-1/2 -mt-2.5 w-5 h-5 rotate-45 bg-surface border-l-4 border-b-4 border-borderStrong" aria-hidden />
          <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3 overflow-x-auto min-h-20 sm:min-h-24" aria-label="Lo que dice el osito" aria-live="polite">
            {frase.length === 0 ? (
              <MousePointerClick className="mx-auto w-9 h-9 text-borderStrong" aria-hidden />
            ) : (
              frase.map((p, i) => (
                <span
                  key={`${p.id}-${i}`}
                  className={`shrink-0 flex flex-col items-center rounded-2xl border-4 px-1.5 pt-1 animate-pop transition-all ${sonando === i ? 'border-brand ring-8 ring-accent/70 scale-110' : 'border-transparent'}`}
                >
                  <Dibujo pic={p} className="w-14 h-14 sm:w-20 sm:h-20" />
                  <span className="text-sm sm:text-base font-black">{p.palabra}</span>
                </span>
              ))
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {frase.length > 0 && (
              <button type="button" onClick={borrarUltima} aria-label="Borrar la última palabra" className="w-12 h-12 rounded-full border-4 border-borderStrong bg-surface flex items-center justify-center cursor-pointer hover:border-brand active:scale-90 transition-all">
                <Delete className="w-6 h-6" aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={decirMiFrase}
              disabled={frase.length === 0}
              aria-label="Que el osito lo diga"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-borderStrong bg-accent text-onAccent flex items-center justify-center cursor-pointer hover:bg-accent-hover active:scale-90 transition-all disabled:opacity-35 disabled:cursor-not-allowed"
            >
              <Volume2 className={`w-9 h-9 sm:w-11 sm:h-11 ${sonando !== null ? 'animate-pulso' : ''}`} aria-hidden />
            </button>
          </div>
        </div>
      </section>

      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3 sm:gap-4 max-w-6xl mx-auto">
          {palabras.map((pic) => (
            <Tecla key={pic.id ?? pic.palabra} pic={pic} alTocar={tocarTecla} />
          ))}
        </div>
      </div>
    </div>
  );
};
