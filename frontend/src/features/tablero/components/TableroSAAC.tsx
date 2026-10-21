import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Delete, HandHelping, Play, Trash2, Volume2 } from 'lucide-react';
import type { Pictograma } from '@/types';
import { crearRegistro, usePictogramas, useRegistrosDeAlumno } from '@/api';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { CATEGORIAS_TABLERO, FRASES_LISTAS, franjaDe } from '@/features/tablero/categoriasTablero';
import { resolverYGuardarPictograma } from '@/features/tablero/arasaac';
import { decirSecuencia, type ElementoDeVoz } from '@/shared/audio/decirSecuencia';
import { sonarAcierto, sonarToque } from '@/shared/audio/sonidos';
import { FondoPaisaje } from '@/shared/components/FondoPaisaje';
import { LluviaEstrellas } from '@/shared/components/LluviaEstrellas';
import { OsoCabeza } from '@/shared/components/OsoCabeza';
import { useHablar } from '@/shared/hooks/useHablar';

const MAXIMO_FRECUENTES = 12;
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

/** Una tecla: el dibujo sobre fondo blanco y todo el cuadro del color de su categoría. */
const Tecla: React.FC<{ pic: Pictograma; alTocar: (pic: Pictograma) => void }> = ({ pic, alTocar }) => {
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
      className={`flex flex-col items-center gap-1 rounded-[1.75rem] border-4 border-surface p-2 shadow-card cursor-pointer transition-transform hover:-translate-y-1 hover:rotate-1 active:scale-90 ${franjaDe(pic.categoria)} ${pulsada ? 'animate-pop' : ''}`}
    >
      <span className="w-full flex items-center justify-center rounded-3xl bg-surface p-2">
        <Dibujo pic={pic} className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28" />
      </span>
      <span className="text-lg sm:text-xl font-black leading-tight truncate max-w-full px-1">{pic.palabra}</span>
    </button>
  );
};

/** Frase lista: sus dibujos en fila y un triángulo de «play». Un toque y se dice. */
const FraseLista: React.FC<{ pics: Pictograma[]; alTocar: (pics: Pictograma[]) => void }> = ({ pics, alTocar }) => (
  <button
    type="button"
    onClick={() => alTocar(pics)}
    aria-label={pics.map((p) => p.palabra).join(' ')}
    className="flex items-center gap-2 rounded-[1.75rem] border-4 border-surface bg-btnColores-bg text-btnColores-text p-2 sm:p-3 shadow-card cursor-pointer transition-transform hover:-translate-y-1 active:scale-95"
  >
    <span className="flex items-center gap-1.5">
      {pics.map((p) => (
        <span key={p.id} className="rounded-2xl bg-surface p-1">
          <Dibujo pic={p} className="w-14 h-14 sm:w-16 sm:h-16" />
        </span>
      ))}
    </span>
    <span className="ml-auto w-11 h-11 shrink-0 rounded-full bg-accent text-onAccent border-2 border-surface flex items-center justify-center" aria-hidden>
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
  const registros = useRegistrosDeAlumno(activeStudentId);
  const [categoria, setCategoria] = useState<string>('rapidas');
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

  // Las palabras que más usa este niño, para tenerlas a mano
  const frecuentes = useMemo(() => {
    if (!todos || !registros) return [];
    const cuenta = new Map<string, number>();
    registros.filter((r) => r.tipo === 'tablero').forEach((r) => r.pictogramaIds?.forEach((id) => cuenta.set(id, (cuenta.get(id) ?? 0) + 1)));
    return [...cuenta.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => todos.find((p) => p.id === id))
      .filter((p): p is Pictograma => !!p)
      .slice(0, MAXIMO_FRECUENTES);
  }, [todos, registros]);

  const frasesListas = useMemo(
    () =>
      FRASES_LISTAS.map((ids) => ids.map((id) => todos?.find((p) => p.id === id)).filter((p): p is Pictograma => !!p)).filter(
        (pics, i) => pics.length === FRASES_LISTAS[i].length,
      ),
    [todos],
  );

  const tieneFrecuentes = frecuentes.length >= 3;
  const ayuda = todos?.find((p) => p.id === 'pic-ayuda');
  const visibles = categoria === 'frecuentes' ? frecuentes : (todos ?? []).filter((p) => categoria === 'todos' || p.categoria === categoria);

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

  const limpiar = () => {
    corte.current += 1;
    setSonando(null);
    setFrase([]);
  };

  const BOTON_REDONDO = 'rounded-full border-4 border-borderStrong flex items-center justify-center cursor-pointer active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div role="dialog" aria-modal="true" aria-label="Hablar" className="fixed inset-0 z-50 flex flex-col bg-app text-primary overflow-hidden animate-fadeIn">
      <FondoPaisaje />
      {celebra && <LluviaEstrellas />}

      <header className="relative z-10 flex items-center justify-between gap-3 px-3 sm:px-6 py-2 sm:py-3">
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Volver"
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-accent text-onAccent border-4 border-borderStrong flex items-center justify-center cursor-pointer hover:bg-accent-hover active:scale-90 transition-all shadow-card"
        >
          <ArrowLeft className="w-8 h-8" strokeWidth={2.5} aria-hidden />
        </button>
        <h1 className="sr-only">Hablar</h1>
        {ayuda && (
          <button
            type="button"
            onClick={pedirAyuda}
            aria-label="Necesito ayuda"
            className="flex items-center gap-2 h-14 sm:h-16 pl-4 pr-5 rounded-full bg-statusDanger text-onStatus border-4 border-surface shadow-card cursor-pointer active:scale-90 transition-transform"
          >
            <HandHelping className="w-8 h-8" aria-hidden />
            <span className="text-xl font-black">Ayuda</span>
          </button>
        )}
      </header>

      {/* El osito y su burbuja: ahí aparecen los dibujos que el niño elige */}
      <section className="relative z-10 flex items-end gap-2 sm:gap-5 px-3 sm:px-6">
        <div className={`shrink-0 ${celebra ? 'animate-saltito' : 'animate-respirar'}`}>
          <span className="block w-24 h-24 sm:w-36 sm:h-36 lg:w-44 lg:h-44 bg-surface rounded-full border-4 border-onBrand/60 p-1.5 overflow-hidden shadow-card" role="img" aria-label="Osito">
            <OsoCabeza boca={boca} />
          </span>
        </div>

        <div className="relative flex-1 min-w-0 flex items-center gap-2 sm:gap-3 rounded-[2rem] border-4 border-borderStrong bg-surface p-2 sm:p-3 shadow-card mb-2">
          <span className="absolute -left-3 bottom-8 w-5 h-5 rotate-45 bg-surface border-l-4 border-b-4 border-borderStrong" aria-hidden />
          <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3 overflow-x-auto py-1 min-h-24 sm:min-h-28" aria-label="Lo que dice el osito" aria-live="polite">
            {frase.length === 0
              ? [0, 1, 2].map((i) => <span key={i} aria-hidden className="shrink-0 w-16 h-20 sm:w-20 sm:h-24 rounded-2xl border-4 border-dashed border-borderStrong/60" />)
              : frase.map((p, i) => (
                  <span
                    key={`${p.id}-${i}`}
                    className={`shrink-0 flex flex-col items-center rounded-2xl border-4 bg-app px-1.5 pt-1 animate-pop transition-all ${sonando === i ? 'border-brand ring-8 ring-accent/70 scale-110' : 'border-transparent'}`}
                  >
                    <Dibujo pic={p} className="w-14 h-14 sm:w-20 sm:h-20" />
                    <span className="text-sm sm:text-base font-black">{p.palabra}</span>
                  </span>
                ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={decirMiFrase}
              disabled={frase.length === 0}
              aria-label="Que el osito lo diga"
              className={`${BOTON_REDONDO} w-16 h-16 sm:w-20 sm:h-20 bg-accent text-onAccent hover:bg-accent-hover shadow-card`}
            >
              <Volume2 className={`w-9 h-9 sm:w-11 sm:h-11 ${sonando !== null ? 'animate-pulso' : ''}`} aria-hidden />
            </button>
            <div className="flex sm:flex-col gap-2">
              <button type="button" onClick={borrarUltima} disabled={frase.length === 0} aria-label="Borrar la última palabra" className={`${BOTON_REDONDO} w-11 h-11 sm:w-12 sm:h-12 bg-surface hover:border-brand`}>
                <Delete className="w-6 h-6" aria-hidden />
              </button>
              <button type="button" onClick={limpiar} disabled={frase.length === 0} aria-label="Borrar todo" className={`${BOTON_REDONDO} w-11 h-11 sm:w-12 sm:h-12 bg-statusDanger-bg text-statusDanger border-statusDanger`}>
                <Trash2 className="w-6 h-6" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías como globos de colores: ícono grande; tocar uno dice su nombre */}
      <nav role="tablist" aria-label="Categorías" className="relative z-10 flex gap-2 sm:gap-3 overflow-x-auto px-3 sm:px-6 pt-3 pb-1">
        {CATEGORIAS_TABLERO.filter((c) => c.id !== 'frecuentes' || tieneFrecuentes).map((c) => {
          const seleccionada = c.id === categoria;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={seleccionada}
              onClick={() => {
                sonarToque();
                setCategoria(c.id);
                hablar(c.nombre);
              }}
              className={`shrink-0 flex flex-col items-center justify-center gap-0.5 w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 cursor-pointer transition-all active:scale-90 shadow-card ${c.franja} ${
                seleccionada ? 'border-brand ring-8 ring-accent/70 scale-110' : 'border-surface hover:scale-105'
              }`}
            >
              <c.Icono className="w-8 h-8 sm:w-10 sm:h-10" aria-hidden />
              <span className="text-xs sm:text-sm font-black">{c.nombre}</span>
            </button>
          );
        })}
      </nav>

      {/* Frases listas o teclas */}
      <div role="tabpanel" className="relative z-10 flex-1 overflow-y-auto px-3 sm:px-6 py-3">
        {categoria === 'rapidas' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {frasesListas.map((pics) => (
              <FraseLista key={pics.map((p) => p.id).join('-')} pics={pics} alTocar={tocarFraseLista} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3 sm:gap-4">
            {visibles.map((pic) => (
              <Tecla key={pic.id ?? pic.palabra} pic={pic} alTocar={tocarTecla} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
