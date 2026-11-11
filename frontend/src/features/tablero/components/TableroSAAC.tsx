import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Delete, FolderOpen, HandHelping, MousePointerClick, Volume2 } from 'lucide-react';
import type { Pictograma } from '@/types';
import { crearRegistro, usePictogramas } from '@/api';
import { useAuthStore } from '@/shared/store/useAuthStore';
import { useTableroDelNino, type CeldaResuelta } from '@/features/tablero/useTableroDelNino';
import { resolverYGuardarPictograma } from '@/features/tablero/arasaac';
import { useTableroStore } from '@/shared/store/useTableroStore';
import { audioDeTexto } from '@/shared/audio/audioDeTexto';
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

/**
 * Una carpeta: pestaña, borde punteado y, dentro, un dibujo que representa la categoría. Así el niño la reconoce
 * sin leer ni depender del color. La abierta se marca con borde grueso y aro, no solo con color.
 */
const Carpeta: React.FC<{ nombre: string; franja: string; pic?: Pictograma; abierta: boolean; alTocar: () => void }> = ({ nombre, franja, pic, abierta, alTocar }) => (
  <button
    type="button"
    onClick={alTocar}
    aria-label={`Carpeta ${nombre}`}
    aria-pressed={abierta}
    className={`relative mt-3 shrink-0 w-28 sm:w-full flex flex-col items-center rounded-2xl rounded-tl-none border-4 shadow-card cursor-pointer transition-all active:scale-95 ${
      abierta ? 'border-brand bg-surface ring-4 ring-accent/70' : 'border-dashed border-borderStrong bg-app hover:border-brand'
    }`}
  >
    <span className={`absolute -top-3.5 -left-1 h-4 w-14 rounded-t-xl border-4 border-b-0 border-borderStrong ${franja}`} aria-hidden />
    <span className="flex items-center justify-center p-2 pt-4">
      {pic ? (
        <Dibujo pic={pic} className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20" />
      ) : (
        <FolderOpen className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-secondary" strokeWidth={1.5} aria-hidden />
      )}
    </span>
    <span className="flex items-center gap-1 pb-2 px-1 max-w-full text-base sm:text-lg font-black leading-tight">
      <FolderOpen className="w-4 h-4 shrink-0" aria-hidden />
      <span className="truncate">{nombre}</span>
    </span>
  </button>
);

/** Una tecla: tarjeta blanca con el dibujo grande y una franja fina del color de su categoría. */
const Tecla: React.FC<{ pic: Pictograma; franja: string; alTocar: (pic: Pictograma) => void }> = ({ pic, franja, alTocar }) => {
  const [pulsada, setPulsada] = useState(false);
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

/** Palabra núcleo: más chica que las demás para que la fila fija no le quite lugar a la grilla. */
const TeclaNucleo: React.FC<{ pic: Pictograma; franja: string; alTocar: (pic: Pictograma) => void }> = ({ pic, franja, alTocar }) => (
  <button
    type="button"
    onClick={() => alTocar(pic)}
    aria-label={pic.palabra}
    className="shrink-0 flex flex-col items-center overflow-hidden rounded-2xl border-4 border-borderStrong bg-surface cursor-pointer transition-transform hover:border-brand active:scale-90"
  >
    <span className={`h-2 w-full ${franja}`} aria-hidden />
    <span className="p-1.5">
      <Dibujo pic={pic} className="w-14 h-14 sm:w-16 sm:h-16" />
    </span>
    <span className="pb-1.5 text-sm sm:text-base font-black leading-tight px-2">{pic.palabra}</span>
  </button>
);

/**
 * Hablar: el osito dice lo que el niño arma, palabra por palabra. Arriba, el osito y su burbuja (ahí aparecen
 * los dibujos que se tocan); debajo, las palabras núcleo, siempre a la vista; y abajo el tablero: palabras y
 * carpetas. Una carpeta abre otro tablero y, al elegir una palabra, se vuelve sola al principal. La frase se
 * conserva al navegar. Sin texto que leer.
 */
export const TableroSAAC: React.FC<{ onCerrar: () => void }> = ({ onCerrar }) => {
  const activeStudentId = useAuthStore((s) => s.activeStudentId);
  const supervision = useAuthStore((s) => s.supervision);
  const todos = usePictogramas();
  const frase = useTableroStore((s) => s.frase);
  const setFrase = useTableroStore((s) => s.setFrase);
  const [sonando, setSonando] = useState<number | null>(null);
  const [celebra, setCelebra] = useState(false);
  const corte = useRef(0);
  const boca = useBoca(sonando !== null);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [onCerrar]);

  const tablero = useTableroDelNino(activeStudentId);
  /** Carpeta abierta (nulo = tablero principal). Se olvida al cerrar el tablero: se entra siempre por el principal. */
  const [carpetaId, setCarpetaId] = useState<string | null>(null);
  const carpeta = carpetaId ? tablero?.carpetas.get(carpetaId) : undefined;
  const vista = carpeta ?? tablero?.principal;
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
    // Elegida la palabra, se vuelve sola al principal (la docente puede desactivarlo)
    if (carpeta && tablero?.volverAlElegir) setCarpetaId(null);
  };

  const abrirCarpeta = (id: string, nombre: string) => {
    sonarToque();
    corte.current += 1;
    // Tocar la carpeta que ya está abierta vuelve al principal
    if (id === carpetaId) return setCarpetaId(null);
    setCarpetaId(id);
    // Dice su nombre para que el niño sepa dónde está
    void decirSecuencia([{ texto: nombre, audioUrl: audioDeTexto(nombre) ?? undefined }]);
  };

  /** La flecha de siempre: dentro de una carpeta vuelve al principal; en el principal cierra el tablero. */
  const volver = () => (carpeta ? setCarpetaId(null) : onCerrar());

  const decirMiFrase = () => {
    void decir(frase);
    registrar(frase);
  };

  const pedirAyuda = () => {
    if (!ayuda) return;
    sonarToque();
    corte.current += 1;
    setFrase([ayuda]);
    void decirSecuencia([{ texto: 'Necesito ayuda', audioUrl: audioDeTexto('Necesito ayuda') ?? ayuda.audioUrl }], { alDecir: setSonando });
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
          onClick={volver}
          aria-label={carpeta ? 'Volver al tablero principal' : 'Volver'}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-accent text-onAccent border-4 border-borderStrong flex items-center justify-center cursor-pointer hover:bg-accent-hover active:scale-90 transition-all"
        >
          <ArrowLeft className="w-8 h-8" strokeWidth={2.5} aria-hidden />
        </button>
        <h1 className="sr-only">Hablar</h1>
        <p className="sr-only" aria-live="polite">
          {carpeta ? `Carpeta ${carpeta.nombre} abierta` : ''}
        </p>
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

      {/* Palabras núcleo: siempre a la vista, también dentro de las carpetas */}
      {tablero && tablero.nucleo.length > 0 && (
        <nav aria-label="Palabras que siempre están" className="flex items-center gap-2 sm:gap-3 overflow-x-auto px-3 sm:px-6 py-3 border-b-4 border-borderCustom">
          {tablero.nucleo.map(({ celda, pic, franja }) => pic && <TeclaNucleo key={celda.id} pic={pic} franja={franja} alTocar={tocarTecla} />)}
        </nav>
      )}

      {/* Lo grande es el tablero (principal o carpeta abierta); las carpetas van a su lado, o abajo en pantallas angostas */}
      <div className="flex-1 min-h-0 flex flex-col sm:flex-row">
        <div key={vista?.id} className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-4">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3 sm:gap-4">
            {(vista?.celdas ?? []).map(({ celda, pic, franja }: CeldaResuelta) => pic && <Tecla key={celda.id} pic={pic} franja={franja} alTocar={tocarTecla} />)}
          </div>
        </div>

        {tablero && tablero.listaCarpetas.length > 0 && (
          <nav
            aria-label="Carpetas"
            className="shrink-0 flex flex-row sm:flex-col gap-3 overflow-x-auto sm:overflow-x-hidden sm:overflow-y-auto px-3 pb-3 pt-2 border-t-4 sm:border-t-0 sm:border-l-4 border-borderCustom sm:w-40 lg:w-48 sm:px-3 sm:py-4"
          >
            {tablero.listaCarpetas.map(({ celda, pic, franja }) => (
              <Carpeta
                key={celda.id}
                nombre={celda.textoMostrado}
                franja={franja}
                pic={pic}
                abierta={celda.destinoTableroId === carpetaId}
                alTocar={() => abrirCarpeta(celda.destinoTableroId as string, celda.textoMostrado)}
              />
            ))}
          </nav>
        )}
      </div>
    </div>
  );
};
