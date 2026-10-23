import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Droplets, Frown, LayoutGrid, Meh, Paintbrush, RotateCcw, Smile, Sparkles, Volume2, Wind } from 'lucide-react';
import { crearRegistro } from '@/api';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import type { ActividadCalma, RegistroCalma } from '@/types';
import { sonarBurbuja, sonarRespiro } from '@/shared/audio/sonidos';
import { DibujarConLuz } from '@/shared/components/calma/DibujarConLuz';
import { Luciernagas } from '@/shared/components/calma/Luciernagas';
import { OsoCabeza } from '@/shared/components/OsoCabeza';
import type { ClaveAudio } from '@/shared/config/audiosInterfaz';
import { useHablar } from '@/shared/hooks/useHablar';
import { useAjustesStore } from '@/shared/store/useAjustesStore';
import { Button } from '@/shared/ui';

type Animo = NonNullable<RegistroCalma['animo']>;

/* Zona de calma: un fondo propio, quieto y de poco contraste, que no cambia con la paleta elegida.
   Sin puntajes, sin tiempo límite y con una salida siempre a la vista ("Estoy mejor"). */

const INHALA_MS = 4000;
const EXHALA_MS = 6000;
const RESPIROS = 5;
const FONDO = 'linear-gradient(180deg, #23506b 0%, #2f6e7c 55%, #3f8587 100%)';

type Actividad = 'menu' | ActividadCalma;

const CARITAS: { animo: Animo; icono: typeof Smile; etiqueta: string }[] = [
  { animo: 'peor', icono: Frown, etiqueta: 'Peor' },
  { animo: 'igual', icono: Meh, etiqueta: 'Igual' },
  { animo: 'mejor', icono: Smile, etiqueta: 'Mejor' },
];

/** Respiración guiada: el círculo crece al inhalar (4 s) y se achica al exhalar (6 s), cinco veces. */
const Respirar: React.FC<{ alTerminar: () => void }> = ({ alTerminar }) => {
  const movimiento = useAjustesStore((s) => s.movimiento);
  const hablar = useHablar();
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
    // Quien no lee sigue la respiración por la voz: «inhala» y «exhala» suenan en cada cambio
    hablar(inhala ? 'Inhala' : 'Exhala', inhala ? 'inhala' : 'exhala');
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
  }, [inhala, respiros, alTerminar, hablar]);

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

/** Una opción grande del menú de calma, con un parlante que dice su nombre (sin leer). */
const Opcion: React.FC<{ icono: React.ReactNode; texto: string; clave: ClaveAudio; onClick: () => void }> = ({ icono, texto, clave, onClick }) => {
  const hablar = useHablar();
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-4 w-40 h-40 sm:w-52 sm:h-52 rounded-card bg-white/15 border-4 border-white/70 text-2xl sm:text-3xl font-black cursor-pointer hover:bg-white/25 active:scale-95 transition-all"
      >
        {icono}
        {texto}
      </button>
      <button
        type="button"
        onClick={() => hablar(texto, clave)}
        aria-label={`Escuchar: ${texto}`}
        className="absolute top-2 right-2 w-11 h-11 rounded-full bg-white text-[#23506b] flex items-center justify-center cursor-pointer hover:bg-white/90"
      >
        <Volume2 className="w-6 h-6" aria-hidden />
      </button>
    </div>
  );
};

/**
 * Pantalla de calma: el niño elige respirar con el osito o tocar burbujas.
 * Pensada para quien se sobreestimula: un solo movimiento lento por vez, colores suaves y salida siempre visible.
 */
export const CalmaOverlay: React.FC<{ abierto: boolean; onCerrar: () => void }> = ({ abierto, onCerrar }) => {
  const hablar = useHablar();
  const activeStudentId = useAuthStore((s) => s.activeStudentId);
  const supervision = useAuthStore((s) => s.supervision);
  const [actividad, setActividad] = useState<Actividad>('menu');
  const [fin, setFin] = useState(false);
  const [vuelta, setVuelta] = useState(0);
  // Qué hizo y desde cuándo: al salir queda un registro para la docente
  const usadas = useRef<ActividadCalma[]>([]);
  const desde = useRef(0);

  // Cada vez que se abre vuelve al menú (ajuste durante el render)
  const [estabaAbierto, setEstabaAbierto] = useState(abierto);
  if (estabaAbierto !== abierto) {
    setEstabaAbierto(abierto);
    if (abierto) {
      setActividad('menu');
      setFin(false);
    }
  }

  const salir = useCallback(
    (animo?: Animo) => {
      if (activeStudentId && !supervision) {
        const actividades = usadas.current;
        const sentir = animo === 'mejor' ? 'se sintió mejor' : animo === 'igual' ? 'se sintió igual' : animo === 'peor' ? 'se sintió peor' : '';
        void crearRegistro({
          alumnoId: activeStudentId,
          tipo: 'calma',
          detalle: `Usó la calma${sentir ? ` y ${sentir}` : ''}`,
          lugar: 'casa',
          fecha: new Date().toISOString(),
          calma: { actividades, animo, segundos: Math.round((Date.now() - desde.current) / 1000) },
        });
      }
      onCerrar();
    },
    [activeStudentId, supervision, onCerrar],
  );

  useEffect(() => {
    if (!abierto) return;
    usadas.current = [];
    desde.current = Date.now();
    hablar('Descansemos un momento.', 'descansemos');
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && salir();
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [abierto, hablar, salir]);

  const terminarRespiros = useCallback(() => {
    setFin(true);
    hablar('¿Cómo estás ahora?', 'como_estas');
  }, [hablar]);

  if (!abierto) return null;

  const elegir = (a: Actividad) => {
    if (a !== 'menu' && !usadas.current.includes(a)) usadas.current.push(a);
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
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <Opcion icono={<Wind className="w-14 h-14 sm:w-16 sm:h-16" aria-hidden />} texto="Respirar" clave="respira" onClick={() => elegir('respirar')} />
              <Opcion icono={<Droplets className="w-14 h-14 sm:w-16 sm:h-16" aria-hidden />} texto="Burbujas" clave="burbujas" onClick={() => elegir('burbujas')} />
              <Opcion icono={<Sparkles className="w-14 h-14 sm:w-16 sm:h-16" aria-hidden />} texto="Luces" clave="luciernagas" onClick={() => elegir('luciernagas')} />
              <Opcion icono={<Paintbrush className="w-14 h-14 sm:w-16 sm:h-16" aria-hidden />} texto="Dibujar" clave="dibuja" onClick={() => elegir('dibujar')} />
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
        {actividad === 'luciernagas' && <Luciernagas key={vuelta} />}
        {actividad === 'dibujar' && <DibujarConLuz key={vuelta} />}
      </div>

      {/* Salida: tres caritas. Tocar cualquiera cierra y le cuenta a la docente cómo se sintió */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {actividad !== 'menu' && (
          <Button variant="secondary" size="xl" onClick={() => setActividad('menu')} aria-label="Otra cosa">
            <LayoutGrid className="w-8 h-8" aria-hidden />
          </Button>
        )}
        <div role="group" aria-label="¿Cómo estás ahora?" className="flex items-center gap-3 rounded-full bg-white/15 p-2">
          <button
            type="button"
            onClick={() => hablar('¿Cómo estás ahora?', 'como_estas')}
            aria-label="Escuchar: ¿Cómo estás ahora?"
            className="w-14 h-14 rounded-full bg-white text-[#23506b] flex items-center justify-center cursor-pointer hover:bg-white/90"
          >
            <Volume2 className="w-7 h-7" aria-hidden />
          </button>
          {CARITAS.map(({ animo, icono: Icono, etiqueta }) => (
            <button
              key={animo}
              type="button"
              onClick={() => salir(animo)}
              aria-label={`${etiqueta}. Salir`}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 border-4 border-white/80 flex items-center justify-center cursor-pointer hover:bg-white/35 active:scale-90 transition-all"
            >
              <Icono className="w-10 h-10 sm:w-12 sm:h-12" aria-hidden />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
