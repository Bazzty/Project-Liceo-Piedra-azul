import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, RotateCcw, Sparkles, Wind } from 'lucide-react';
import { sonarBurbuja, sonarRespiro } from '@/shared/audio/sonidos';
import { OsoCabeza } from '@/shared/components/OsoCabeza';
import { useHablar } from '@/shared/hooks/useHablar';
import { useAjustesStore } from '@/shared/store/useAjustesStore';
import { Button } from '@/shared/ui';

/* Zona de calma: un fondo propio, quieto y de poco contraste, que no cambia con la paleta elegida.
   Sin puntajes, sin tiempo límite y con una salida siempre a la vista ("Estoy mejor"). */

const INHALA_MS = 4000;
const EXHALA_MS = 6000;
const RESPIROS = 5;
const FONDO = 'linear-gradient(180deg, #23506b 0%, #2f6e7c 55%, #3f8587 100%)';

type Actividad = 'menu' | 'respirar' | 'burbujas';

/** Respiración guiada: el círculo crece al inhalar (4 s) y se achica al exhalar (6 s), cinco veces. */
const Respirar: React.FC<{ alTerminar: () => void }> = ({ alTerminar }) => {
  const movimiento = useAjustesStore((s) => s.movimiento);
  const [inhala, setInhala] = useState(true);
  const [respiros, setRespiros] = useState(0);
  // El círculo arranca chico y crece un instante después de montar, para que la primera inhalación también se anime
  const [crece, setCrece] = useState(false);

  useEffect(() => {
    if (respiros >= RESPIROS) {
      alTerminar();
      return;
    }
    sonarRespiro(inhala);
    const empezar = setTimeout(() => setCrece(inhala), 60);
    const id = setTimeout(() => {
      if (inhala) setInhala(false);
      else {
        setRespiros((n) => n + 1);
        setInhala(true);
      }
    }, inhala ? INHALA_MS : EXHALA_MS);
    return () => {
      clearTimeout(empezar);
      clearTimeout(id);
    };
  }, [inhala, respiros, alTerminar]);

  const duracion = inhala ? INHALA_MS : EXHALA_MS;

  return (
    <div className="flex flex-col items-center gap-8">
      <p className="text-5xl sm:text-6xl font-black" role="status" aria-live="polite">
        {inhala ? 'Inhala' : 'Exhala'}
      </p>
      <div className="relative flex items-center justify-center w-72 h-72 sm:w-96 sm:h-96">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-white/20 ease-in-out motion-reduce:transition-none"
          style={{ transform: `scale(${movimiento && crece ? 1 : 0.6})`, transition: movimiento ? `transform ${duracion}ms ease-in-out` : 'none' }}
        />
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-white/15 motion-reduce:transition-none"
          style={{ transform: `scale(${movimiento && crece ? 0.8 : 0.45})`, transition: movimiento ? `transform ${duracion}ms ease-in-out` : 'none' }}
        />
        <span className="relative block w-36 h-36 sm:w-44 sm:h-44 bg-surface rounded-full p-2 overflow-hidden" role="img" aria-label="Osito respirando contigo">
          <OsoCabeza ojosFelices boca="HAPPY" />
        </span>
      </div>
      <ol className="flex items-center gap-3" aria-label={`Respiro ${Math.min(respiros + 1, RESPIROS)} de ${RESPIROS}`}>
        {Array.from({ length: RESPIROS }, (_, i) => (
          <li key={i} aria-hidden className={`w-5 h-5 rounded-full border-2 border-white/80 transition-colors ${i < respiros ? 'bg-white' : i === respiros ? 'bg-white/50' : 'bg-transparent'}`} />
        ))}
      </ol>
    </div>
  );
};

const COLORES_BURBUJA = ['bg-white/30', 'bg-sky-200/40', 'bg-teal-200/40', 'bg-violet-200/35'];
const POSICIONES = [
  { x: 8, y: 12, t: 'w-24 h-24' },
  { x: 38, y: 6, t: 'w-32 h-32' },
  { x: 70, y: 14, t: 'w-24 h-24' },
  { x: 22, y: 42, t: 'w-28 h-28' },
  { x: 56, y: 40, t: 'w-24 h-24' },
  { x: 80, y: 46, t: 'w-28 h-28' },
  { x: 6, y: 68, t: 'w-28 h-28' },
  { x: 42, y: 70, t: 'w-24 h-24' },
  { x: 72, y: 72, t: 'w-28 h-28' },
];

/** Burbujas que flotan despacio. Se tocan para reventarlas con un sonido suave; luego aparece otra. */
const Burbujas: React.FC = () => {
  const [reventadas, setReventadas] = useState<number[]>([]);
  const temporizadores = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const lista = temporizadores.current;
    return () => lista.forEach(clearTimeout);
  }, []);

  const reventar = (i: number) => {
    if (reventadas.includes(i)) return;
    sonarBurbuja();
    setReventadas((r) => [...r, i]);
    temporizadores.current.push(setTimeout(() => setReventadas((r) => r.filter((n) => n !== i)), 2200));
  };

  return (
    <div className="relative w-full flex-1 min-h-[22rem]" aria-label="Burbujas para tocar">
      {POSICIONES.map((p, i) => (
        <button
          key={i}
          type="button"
          onClick={() => reventar(i)}
          aria-label="Burbuja"
          className={`absolute ${p.t} rounded-full border-2 border-white/60 cursor-pointer transition-all duration-500 animate-flotar ${COLORES_BURBUJA[i % COLORES_BURBUJA.length]} ${
            reventadas.includes(i) ? 'scale-150 opacity-0 pointer-events-none' : 'hover:scale-105 active:scale-90'
          }`}
          style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${(i % 5) * -1.1}s`, animationDuration: `${7 + (i % 4)}s`, ...(reventadas.includes(i) ? { animation: 'none' } : {}) }}
        >
          <span className="absolute top-[14%] left-[20%] w-[22%] h-[22%] rounded-full bg-white/70" aria-hidden />
        </button>
      ))}
    </div>
  );
};

/** Una opción grande del menú de calma. */
const Opcion: React.FC<{ icono: React.ReactNode; texto: string; onClick: () => void }> = ({ icono, texto, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-4 w-52 h-52 sm:w-64 sm:h-64 rounded-card bg-white/15 border-4 border-white/70 text-3xl sm:text-4xl font-black cursor-pointer hover:bg-white/25 active:scale-95 transition-all"
  >
    {icono}
    {texto}
  </button>
);

/**
 * Pantalla de calma: el niño elige respirar con el osito o tocar burbujas.
 * Pensada para quien se sobreestimula: un solo movimiento lento por vez, colores suaves y salida siempre visible.
 */
export const CalmaOverlay: React.FC<{ abierto: boolean; onCerrar: () => void }> = ({ abierto, onCerrar }) => {
  const hablar = useHablar();
  const [actividad, setActividad] = useState<Actividad>('menu');
  const [fin, setFin] = useState(false);
  const [vuelta, setVuelta] = useState(0);

  // Cada vez que se abre vuelve al menú (ajuste durante el render)
  const [estabaAbierto, setEstabaAbierto] = useState(abierto);
  if (estabaAbierto !== abierto) {
    setEstabaAbierto(abierto);
    if (abierto) {
      setActividad('menu');
      setFin(false);
    }
  }

  useEffect(() => {
    if (!abierto) return;
    hablar('Descansemos un momento.', 'descansemos');
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [abierto, hablar, onCerrar]);

  const terminarRespiros = useCallback(() => setFin(true), []);

  if (!abierto) return null;

  const elegir = (a: Actividad) => {
    if (a === 'respirar') hablar('Respira conmigo. Inhala... y exhala.', 'respira');
    setFin(false);
    setVuelta((v) => v + 1);
    setActividad(a);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Momento de calma"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-between gap-6 text-white p-6 animate-fadeIn overflow-y-auto"
      style={{ background: FONDO }}
    >
      <div className="flex-1 w-full flex flex-col items-center justify-center gap-8">
        {actividad === 'menu' && (
          <>
            <span className="block w-32 h-32 bg-surface rounded-full p-2 overflow-hidden" role="img" aria-label="Osito">
              <OsoCabeza ojosFelices boca="HAPPY" />
            </span>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <Opcion icono={<Wind className="w-16 h-16 sm:w-20 sm:h-20" aria-hidden />} texto="Respirar" onClick={() => elegir('respirar')} />
              <Opcion icono={<Sparkles className="w-16 h-16 sm:w-20 sm:h-20" aria-hidden />} texto="Burbujas" onClick={() => elegir('burbujas')} />
            </div>
          </>
        )}

        {actividad === 'respirar' && !fin && <Respirar key={vuelta} alTerminar={terminarRespiros} />}
        {actividad === 'respirar' && fin && (
          <div className="flex flex-col items-center gap-6 text-center">
            <span className="block w-40 h-40 bg-surface rounded-full p-2 overflow-hidden" role="img" aria-label="Osito contento">
              <OsoCabeza ojosFelices boca="HAPPY" />
            </span>
            <p className="text-5xl font-black" role="status">¡Muy bien!</p>
            <Button variant="secondary" size="xl" onClick={() => elegir('respirar')}>
              <RotateCcw className="w-8 h-8" aria-hidden />
              Otra vez
            </Button>
          </div>
        )}

        {actividad === 'burbujas' && <Burbujas key={vuelta} />}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {actividad !== 'menu' && (
          <Button variant="secondary" size="xl" onClick={() => setActividad('menu')}>
            Otra cosa
          </Button>
        )}
        <Button variant="accent" size="xl" onClick={onCerrar}>
          <Check className="w-8 h-8" aria-hidden />
          Estoy mejor
        </Button>
      </div>
    </div>
  );
};
