import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Delete, HandHelping, LayoutGrid, MousePointerClick, Play, Volume2 } from 'lucide-react';
import type { Pictograma } from '@/types';
import { crearRegistro, usePictogramas } from '@/api';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { CATEGORIAS_TABLERO, FRASES_LISTAS, INICIOS_DE_FRASE, franjaDe, type InicioDeFrase } from '@/features/tablero/categoriasTablero';
import { resolverYGuardarPictograma } from '@/features/tablero/arasaac';
import { decirSecuencia, type ElementoDeVoz } from '@/shared/audio/decirSecuencia';
import { sonarAcierto, sonarToque } from '@/shared/audio/sonidos';
import { LluviaEstrellas } from '@/shared/components/LluviaEstrellas';
import { OsoCabeza } from '@/shared/components/OsoCabeza';
import { useHablar } from '@/shared/hooks/useHablar';

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

/** Frase lista: sus dibujos en fila y un triángulo de «play». Un toque y se dice. */
const FraseLista: React.FC<{ pics: Pictograma[]; alTocar: (pics: Pictograma[]) => void }> = ({ pics, alTocar }) => (
  <button
    type="button"
    onClick={() => alTocar(pics)}
    aria-label={pics.map((p) => p.palabra).join(' ')}
    className="flex items-center gap-3 rounded-3xl border-4 border-borderStrong bg-surface p-3 shadow-card cursor-pointer transition-transform hover:border-brand active:scale-95"
  >
    <span className="flex items-center gap-1.5">
      {pics.map((p) => (
        <span key={p.id}>
          <Dibujo pic={p} className="w-16 h-16 sm:w-20 sm:h-20" />
        </span>
      ))}
    </span>
    <span className="ml-auto w-12 h-12 shrink-0 rounded-full bg-accent text-onAccent flex items-center justify-center" aria-hidden>
      <Play className="w-5 h-5 fill-current" />
    </span>
  </button>
);

/**
 * Hablar: el osito dice lo que el niño arma. Pantalla completa y sin texto que leer: el osito y su burbuja
 * arriba (ahí aparecen los dibujos elegidos), frases ya listas, categorías con ícono y color y teclas grandes.
 */
export const TableroSAAC: React.FC<{ onCerrar: () => void }> = ({ onCerrar }) => {
  const hablar = useHablar();
  const activeStudentId = useAuthStore((s) => s.activeStudentId);
  const supervision = useAuthStore((s) => s.supervision);
  const todos = usePictogramas();
  // Inicio: dos tarjetas grandes («quiero» y «siento»). Con una elegida, se completa la frase con un solo toque.
  // «libre» es el tablero completo por categorías, para quien ya arma frases más largas.
  const [modo, setModo] = useState<InicioDeFrase | 'libre' | null>(null);
  const [elegida, setElegida] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<string | null>(null);
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

  const frasesListas = useMemo(
    () =>
      FRASES_LISTAS.map((ids) => ids.map((id) => todos?.find((p) => p.id === id)).filter((p): p is Pictograma => !!p)).filter(
        (pics, i) => pics.length === FRASES_LISTAS[i].length,
      ),
    [todos],
  );

  const ayuda = todos?.find((p) => p.id === 'pic-ayuda');
  const visibles = (todos ?? []).filter((p) => p.categoria === categoria);
  const categoriaActual = CATEGORIAS_TABLERO.find((c) => c.id === categoria);

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

  /** Un toque completa la frase («yo quiero» + lo elegido) y el osito la dice enseguida. */
  const completarFrase = (inicio: InicioDeFrase, opcion: Pictograma) => {
    sonarToque();
    const prefijo = INICIOS_DE_FRASE[inicio].prefijo.map((id) => todos?.find((p) => p.id === id)).filter((p): p is Pictograma => !!p);
    const completa = [...prefijo, opcion];
    setElegida(opcion.id ?? null);
    setFrase(completa);
    void decir(completa);
    registrar(completa);
  };

  const volver = () => {
    if (modo === 'libre' && categoria) setCategoria(null);
    else if (modo) {
      setModo(null);
      setElegida(null);
      setFrase([]);
      corte.current += 1;
      setSonando(null);
    } else onCerrar();
  };

  const tocarFraseLista = (pics: Pictograma[]) => {
    sonarToque();
    setFrase(pics);
    void decir(pics);
    registrar(pics);
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
          onClick={volver}
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
        {modo === null && (
          <div className="flex flex-col items-center gap-5 max-w-3xl mx-auto">
            <ul className="grid grid-cols-2 gap-4 sm:gap-8 w-full">
              {(Object.keys(INICIOS_DE_FRASE) as InicioDeFrase[]).map((id) => {
                const inicio = INICIOS_DE_FRASE[id];
                const pic = todos?.find((p) => p.id === inicio.icono);
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => {
                        sonarToque();
                        setModo(id);
                        hablar(inicio.nombre);
                      }}
                      aria-label={inicio.nombre}
                      className="w-full flex flex-col items-center gap-3 rounded-[2.5rem] border-4 border-borderStrong bg-surface py-6 sm:py-10 cursor-pointer hover:border-brand active:scale-95 transition-all"
                    >
                      {pic && <Dibujo pic={pic} className="w-28 h-28 sm:w-40 sm:h-40" />}
                      <span className="text-3xl sm:text-4xl font-black">{inicio.nombre}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => {
                sonarToque();
                setModo('libre');
                hablar('Más palabras');
              }}
              aria-label="Más palabras"
              className="flex items-center gap-3 h-16 px-6 rounded-full border-4 border-borderStrong bg-surface text-xl font-black cursor-pointer hover:border-brand active:scale-95 transition-all"
            >
              <LayoutGrid className="w-8 h-8" aria-hidden />
              Más palabras
            </button>
          </div>
        )}

        {(modo === 'quiero' || modo === 'siento') && (
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 max-w-4xl mx-auto">
            {INICIOS_DE_FRASE[modo].opciones
              .map((id) => todos?.find((p) => p.id === id))
              .filter((p): p is Pictograma => !!p)
              .map((pic) => (
                <li key={pic.id} className={`rounded-3xl transition-all [&>button]:w-full ${elegida === pic.id ? 'ring-8 ring-accent/80 scale-105' : ''}`}>
                  <Tecla pic={pic} alTocar={(p) => completarFrase(modo, p)} />
                </li>
              ))}
          </ul>
        )}

        {modo === 'libre' && categoria === null && (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 max-w-4xl mx-auto">
            {CATEGORIAS_TABLERO.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    sonarToque();
                    setCategoria(c.id);
                    hablar(c.nombre);
                  }}
                  className="w-full flex flex-col items-center gap-3 rounded-3xl border-4 border-borderStrong bg-surface py-5 sm:py-7 cursor-pointer hover:border-brand active:scale-95 transition-all"
                >
                  <span className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center ${c.franja}`}>
                    <c.Icono className="w-10 h-10 sm:w-12 sm:h-12" aria-hidden />
                  </span>
                  <span className="text-xl sm:text-2xl font-black">{c.nombre}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {modo === 'libre' && categoria === 'rapidas' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-3xl mx-auto">
            {frasesListas.map((pics) => (
              <FraseLista key={pics.map((p) => p.id).join('-')} pics={pics} alTocar={tocarFraseLista} />
            ))}
          </div>
        )}

        {modo === 'libre' && categoria !== null && categoria !== 'rapidas' && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3 sm:gap-4 max-w-5xl mx-auto">
            {visibles.map((pic) => (
              <Tecla key={pic.id ?? pic.palabra} pic={pic} alTocar={tocarTecla} />
            ))}
          </div>
        )}
        {categoriaActual && <p className="sr-only">Categoría {categoriaActual.nombre}</p>}
      </div>
    </div>
  );
};
