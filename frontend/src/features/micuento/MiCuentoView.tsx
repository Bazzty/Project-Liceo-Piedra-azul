import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookmarkPlus, Check, Home, Library, RotateCcw, Volume2 } from 'lucide-react';
import { crearMiCuento, crearRegistro, useMisCuentos } from '@/api';
import { ROUTES } from '@/app/routes';
import { audioDe, OPCIONES, partesDelCuento, PASOS, resumenParaDocente, urlPictograma, type Eleccion, type OpcionCuento, type PasoCuento } from '@/features/micuento/frases';
import { PaginaDelCuento } from '@/features/micuento/PaginaDelCuento';
import { decirSecuencia } from '@/shared/audio/decirSecuencia';
import { sonarAcierto, sonarToque } from '@/shared/audio/sonidos';
import { LayoutEstudiante } from '@/shared/components/LayoutEstudiante';
import { LluviaEstrellas } from '@/shared/components/LluviaEstrellas';
import { OsoBurbuja } from '@/shared/components/OsoBurbuja';
import type { ClaveAudio } from '@/shared/config/audiosInterfaz';
import { useHablar } from '@/shared/hooks/useHablar';
import { useAjustesStore } from '@/shared/store/useAjustesStore';
import { lugarDeLaSesion, useAuthStore } from '@/shared/store/useAuthStore';
import { useGuideStore } from '@/shared/store/useGuideStore';
import { Button, OptionButton } from '@/shared/ui';

const PREGUNTAS: Record<PasoCuento, { texto: string; clave: ClaveAudio }> = {
  quien: { texto: '¿Quién?', clave: 'quien' },
  donde: { texto: '¿Dónde?', clave: 'donde' },
  accion: { texto: '¿Qué hace?', clave: 'que_hace' },
};

const prefiereMenosMovimiento = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

/** Puntitos de avance (sin números): uno por decisión. */
const Avance: React.FC<{ paso: number }> = ({ paso }) => (
  <ol className="flex items-center justify-center gap-3 bg-surface/90 rounded-full px-5 py-2" aria-label={`Paso ${paso + 1} de ${PASOS.length}`}>
    {PASOS.map((p, i) => (
      <li
        key={p}
        aria-hidden
        className={`rounded-full border-2 border-borderStrong ${i === paso ? 'w-6 h-6 bg-accent border-brand' : i < paso ? 'w-4 h-4 bg-brand' : 'w-4 h-4 bg-surface'}`}
      />
    ))}
  </ol>
);

/** Una sola decisión: el osito pregunta en voz alta y el niño elige un pictograma. */
const PasoElegir: React.FC<{ paso: PasoCuento; indice: number; elegida: string | null; alElegir: (o: OpcionCuento) => void }> = ({ paso, indice, elegida, alElegir }) => {
  const pocasOpciones = useAjustesStore((s) => s.pocasOpciones);
  const opciones = OPCIONES[paso].slice(0, pocasOpciones ? 2 : 4);
  const { texto, clave } = PREGUNTAS[paso];
  return (
    <>
      <Avance paso={indice} />
      <OsoBurbuja key={paso} mensaje={texto} clave={clave} hablarAlAparecer size="md" />
      <div
        role="radiogroup"
        aria-label={texto}
        className={`w-full grid gap-4 sm:gap-6 ${opciones.length === 2 ? 'grid-cols-2 max-w-2xl' : 'grid-cols-2 lg:grid-cols-4'}`}
      >
        {opciones.map((o) => (
          <OptionButton
            key={o.id}
            selected={elegida === o.id}
            aria-label={o.frase}
            disabled={elegida !== null && elegida !== o.id}
            onClick={() => alElegir(o)}
            className={`flex items-center justify-center p-3 sm:p-5 shadow-card active:scale-95 disabled:opacity-60 disabled:cursor-default ${elegida === o.id ? 'ring-8 ring-accent/70' : ''}`}
          >
            <img src={urlPictograma(o)} alt={o.alt} className="w-28 h-28 sm:w-40 sm:h-40 lg:w-44 lg:h-44 object-contain" />
          </OptionButton>
        ))}
      </div>
    </>
  );
};

/**
 * Mi cuento: el niño pasa de escuchar a ser el autor. Tres decisiones con pictogramas (quién, dónde, qué hace)
 * y el osito le lee su cuento. Frases fijas y revisadas: sin IA, sin puntaje, sin errores y sin internet.
 */
export const MiCuentoView: React.FC = () => {
  const navigate = useNavigate();
  const hablar = useHablar();
  const activeStudentId = useAuthStore((s) => s.activeStudentId);
  const supervision = useAuthStore((s) => s.supervision);
  const movimiento = useAjustesStore((s) => s.movimiento);
  const guardados = useMisCuentos(activeStudentId);

  const [paso, setPaso] = useState(0);
  const [eleccion, setEleccion] = useState<Partial<Eleccion>>({});
  const [elegida, setElegida] = useState<string | null>(null);
  const [lecturas, setLecturas] = useState(0);
  const [guardado, setGuardado] = useState(false);
  const [celebra, setCelebra] = useState(false);
  const guardando = useRef(false);
  const corte = useRef(0);

  // Al salir de la pantalla se corta cualquier voz pendiente
  useEffect(
    () => () => {
      corte.current += 1;
    },
    [],
  );
  useEffect(() => {
    if (!celebra) return;
    const id = setTimeout(() => setCelebra(false), 4000);
    return () => clearTimeout(id);
  }, [celebra]);

  const enFinal = paso >= PASOS.length;
  const partes = useMemo(() => (enFinal ? partesDelCuento(eleccion as Eleccion) : null), [enFinal, eleccion]);

  const elegir = async (opcion: OpcionCuento) => {
    if (elegida !== null || enFinal) return;
    const pasoActual = PASOS[paso];
    sonarToque();
    setElegida(opcion.id);
    corte.current += 1;
    const mio = corte.current;
    // El osito dice la frase elegida y recién entonces se pasa a lo siguiente: no hay prisa ni tiempo límite
    await decirSecuencia([{ texto: opcion.frase, audioUrl: audioDe(opcion) }], { cancelada: () => corte.current !== mio });
    if (corte.current !== mio) return;
    setEleccion((e) => ({ ...e, [pasoActual]: opcion.id }));
    setElegida(null);
    setPaso((p) => p + 1);
  };

  const reiniciar = useCallback(() => {
    corte.current += 1;
    setPaso(0);
    setEleccion({});
    setElegida(null);
    setLecturas(0);
    setGuardado(false);
    setCelebra(false);
  }, []);

  const volver = () => {
    sonarToque();
    if (paso === 0) {
      corte.current += 1;
      navigate(ROUTES.menu);
      return;
    }
    corte.current += 1;
    setElegida(null);
    setGuardado(false);
    setLecturas(0);
    setPaso(paso - 1);
  };

  const guardar = async () => {
    if (guardado || guardando.current || !partes) return;
    guardando.current = true;
    try {
      // En supervisión la docente prueba la pantalla: no queda nada guardado a nombre del niño
      if (activeStudentId && !supervision) {
        const fecha = new Date().toISOString();
        const completa = eleccion as Eleccion;
        await crearMiCuento({ alumnoId: activeStudentId, quien: completa.quien, donde: completa.donde, accion: completa.accion, fecha });
        await crearRegistro({ alumnoId: activeStudentId, tipo: 'mi_cuento', detalle: resumenParaDocente(completa), lugar: lugarDeLaSesion(useAuthStore.getState().sessionType), fecha });
      }
      setGuardado(true);
      setCelebra(true);
      sonarAcierto();
      useGuideStore.getState().reaccionar('baile');
      hablar('Tu cuento está guardado.', 'cuento_guardado');
    } catch (error) {
      // Sin mensajes de error para el niño: el botón sigue ahí para intentarlo otra vez
      console.error('No se pudo guardar el cuento', error);
    } finally {
      guardando.current = false;
    }
  };

  return (
    <LayoutEstudiante onVolver={volver}>
      {celebra && movimiento && !prefiereMenosMovimiento() && <LluviaEstrellas />}
      <main data-barrido-esperar className="relative flex-1 w-full max-w-5xl mx-auto px-4 py-4 sm:py-6 flex flex-col items-center gap-4 sm:gap-6">
        <h1 className="sr-only">Mi cuento</h1>

        <div className="w-full flex justify-end">
          <Button variant="secondary" size="lg" onClick={() => navigate(ROUTES.menu)}>
            <Home className="w-6 h-6" aria-hidden />
            Inicio
          </Button>
        </div>

        {!enFinal && <PasoElegir key={paso} paso={PASOS[paso]} indice={paso} elegida={elegida} alElegir={(o) => void elegir(o)} />}

        {partes && (
          <>
            <PaginaDelCuento partes={partes} lecturas={lecturas} />
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button variant="accent" size="xl" data-clave-voz="escuchar_otra_vez" onClick={() => setLecturas((n) => n + 1)}>
                <Volume2 className="w-8 h-8" aria-hidden />
                Escuchar otra vez
              </Button>
              {/* Tras guardar, el mismo botón queda quieto («Guardado»): un segundo toque no cambia nada ni navega */}
              <Button variant="primary" size="xl" data-clave-voz="guardar_cuento" disabled={guardado} onClick={() => void guardar()}>
                {guardado ? <Check className="w-8 h-8" aria-hidden /> : <BookmarkPlus className="w-8 h-8" aria-hidden />}
                {guardado ? 'Guardado' : 'Guardar en mis cuentos'}
              </Button>
              <Button variant="secondary" size="xl" data-clave-voz="crear_otro" onClick={reiniciar}>
                <RotateCcw className="w-8 h-8" aria-hidden />
                Crear otro
              </Button>
            </div>
            {guardado && (
              <Button variant="secondary" size="xl" data-clave-voz="mis_cuentos" onClick={() => navigate(ROUTES.misCuentos)}>
                <Library className="w-8 h-8" aria-hidden />
                Mis cuentos
              </Button>
            )}
          </>
        )}

        {!enFinal && (guardados?.length ?? 0) > 0 && paso === 0 && (
          <Button variant="secondary" size="lg" data-clave-voz="mis_cuentos" onClick={() => navigate(ROUTES.misCuentos)}>
            <Library className="w-6 h-6" aria-hidden />
            Mis cuentos
          </Button>
        )}
      </main>
    </LayoutEstudiante>
  );
};
