import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Check, Home, Volume2 } from 'lucide-react';
import { contarCompletados, crearRegistro, registrarProgreso, useCuento, useProgresosDeAlumno } from '@/api';
import { ROUTES } from '@/app/routes';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { PictogramaCard } from '@/features/aprender/components/PictogramaCard';
import { Sticker } from '@/features/estrellas/Sticker';
import { STICKERS } from '@/features/estrellas/stickers';
import { sonarAcierto, sonarToque } from '@/shared/audio/sonidos';
import { LayoutEstudiante } from '@/shared/components/LayoutEstudiante';
import { LluviaEstrellas } from '@/shared/components/LluviaEstrellas';
import { OsoBurbuja } from '@/shared/components/OsoBurbuja';
import { getPersonajeAudio } from '@/shared/config/audioConfig';
import { useAjustesStore } from '@/shared/store/useAjustesStore';
import { Button } from '@/shared/ui';

const pausa = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Lector dual: pictograma grande + palabra escrita; al escuchar, se resalta la palabra que suena. */
export const LecturaView: React.FC = () => {
  const { nivelId = '', cuentoId } = useParams();
  const navigate = useNavigate();
  const activeStudentId = useAuthStore((s) => s.activeStudentId);
  const progresos = useProgresosDeAlumno(activeStudentId);
  const cuento = useCuento(cuentoId);

  const [paginaActual, setPaginaActual] = useState(0);
  const [completada, setCompletada] = useState(false);
  const [stickerNuevo, setStickerNuevo] = useState<number | null>(null);
  const [palabraActiva, setPalabraActiva] = useState<number | null>(null);
  const [reproduciendo, setReproduciendo] = useState(false);
  const ejecucion = useRef(0);
  const audioActual = useRef<HTMLAudioElement | null>(null);

  const [cuentoAnterior, setCuentoAnterior] = useState(cuentoId);
  if (cuentoAnterior !== cuentoId) {
    setCuentoAnterior(cuentoId);
    setPaginaActual(0);
    setCompletada(false);
    setStickerNuevo(null);
  }

  const paginas = useMemo(() => cuento?.paginas ?? [], [cuento]);
  const paginaData = paginas[paginaActual];
  const esUltimaPagina = paginaActual === paginas.length - 1;
  const palabras = useMemo(() => paginaData?.palabras ?? [], [paginaData]);

  const detener = useCallback(() => {
    ejecucion.current += 1;
    audioActual.current?.pause();
    audioActual.current = null;
    setPalabraActiva(null);
    setReproduciendo(false);
  }, []);

  useEffect(() => detener, [detener]);

  const escucharPagina = useCallback(async () => {
    detener();
    const miId = ejecucion.current;
    if (palabras.length === 0) return;
    setReproduciendo(true);

    const { sonido, vozLenta } = useAjustesStore.getState();
    const tasa = vozLenta ? 0.8 : 1;

    const reproducir = (url: string, alCargar?: (duracionMs: number) => void) =>
      new Promise<void>((resolve) => {
        const audio = new Audio(url);
        audio.playbackRate = tasa;
        audioActual.current = audio;
        audio.onloadedmetadata = () => alCargar?.((audio.duration / tasa) * 1000);
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      });

    if (sonido && paginaData?.audioPaginaUrl) {
      // Narración de toda la página: se reparte el resaltado en partes iguales
      let temporizador: ReturnType<typeof setInterval> | undefined;
      await reproducir(paginaData.audioPaginaUrl, (duracionMs) => {
        const paso = duracionMs / palabras.length;
        let indice = 0;
        setPalabraActiva(0);
        temporizador = setInterval(() => {
          indice += 1;
          if (ejecucion.current !== miId || indice >= palabras.length) clearInterval(temporizador);
          else setPalabraActiva(indice);
        }, paso);
      });
      clearInterval(temporizador);
    } else {
      // Palabra por palabra: suena y se resalta cada una (sin sonido, solo el resaltado)
      for (let i = 0; i < palabras.length; i += 1) {
        if (ejecucion.current !== miId) return;
        setPalabraActiva(i);
        const url = palabras[i].audioUrl;
        if (sonido && url) await reproducir(url);
        else await pausa(900);
        await pausa(150);
      }
    }

    if (ejecucion.current === miId) {
      setPalabraActiva(null);
      setReproduciendo(false);
    }
  }, [detener, palabras, paginaData]);

  const cambiarPagina = (nueva: number) => {
    detener();
    sonarToque();
    setPaginaActual(nueva);
  };

  const finalizar = async () => {
    detener();
    sonarAcierto();
    const yaLeido = !!progresos?.some((p) => p.cuentoId === cuento?.id && p.completado);
    // El sticker nuevo es el siguiente del álbum, solo si es un cuento que no había completado
    const indiceSticker = yaLeido ? null : contarCompletados(progresos) % STICKERS.length;
    setStickerNuevo(indiceSticker);
    setCompletada(true);
    if (activeStudentId && cuento?.id) {
      const ahora = new Date().toISOString();
      await registrarProgreso({ alumnoId: activeStudentId, cuentoId: cuento.id, completado: true, fechaUltimoAcceso: ahora });
      await crearRegistro({ alumnoId: activeStudentId, tipo: 'lectura', detalle: `Terminó «${cuento.titulo}»`, lugar: 'casa', fecha: ahora });
    }
  };

  const volverAlCatalogo = () => navigate(ROUTES.catalogo(nivelId));

  if (!cuento) {
    return (
      <LayoutEstudiante onVolver={volverAlCatalogo}>
        <main className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
          <BookOpen className="w-20 h-20 text-brand animate-respirar" aria-hidden />
          <p className="text-3xl font-black text-primary">Un momento…</p>
        </main>
      </LayoutEstudiante>
    );
  }

  if (completada) {
    return (
      <LayoutEstudiante>
        <LluviaEstrellas />
        <main className="relative flex-1 w-full max-w-3xl mx-auto px-4 py-6 flex flex-col items-center justify-center gap-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-primary bg-surface/90 rounded-full px-8 py-2">¡Muy bien!</h1>
          <div className="flex flex-wrap items-end justify-center gap-8 sm:gap-14">
            <OsoBurbuja mensaje="¡Lo lograste!" audioUrl={getPersonajeAudio('felicitaciones')} size="md" />
            {stickerNuevo !== null && (
              <div className="flex flex-col items-center gap-2">
                <Sticker indice={stickerNuevo} obtenido size="lg" animar />
                <p className="text-2xl font-black text-primary bg-surface/90 rounded-full px-5 py-1">¡Sticker nuevo!</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button variant="accent" size="xl" onClick={volverAlCatalogo}>
              <BookOpen className="w-8 h-8" aria-hidden />
              Otro cuento
            </Button>
            <Button variant="secondary" size="xl" onClick={() => navigate(ROUTES.menu)}>
              <Home className="w-8 h-8" aria-hidden />
              Inicio
            </Button>
          </div>
        </main>
      </LayoutEstudiante>
    );
  }

  const unaPalabra = palabras.length === 1;

  return (
    <LayoutEstudiante onVolver={volverAlCatalogo}>
      <main className="relative flex-1 w-full max-w-5xl mx-auto px-4 py-4 sm:py-6 flex flex-col items-center justify-between gap-4">
        <h1 className="sr-only">{cuento.titulo}</h1>

        {/* Avance: una bolita por página */}
        <ol className="flex items-center justify-center gap-3 bg-surface/90 rounded-full px-5 py-2" aria-label={`Página ${paginaActual + 1} de ${paginas.length}`}>
          {paginas.map((_, i) => (
            <li
              key={i}
              aria-hidden
              className={`rounded-full border-2 border-borderStrong transition-all ${
                i === paginaActual ? 'w-6 h-6 bg-accent border-brand' : i < paginaActual ? 'w-4 h-4 bg-brand' : 'w-4 h-4 bg-surface'
              }`}
            />
          ))}
        </ol>

        {/* Pictogramas y palabras */}
        <div className="flex-1 w-full flex items-center justify-center">
          {unaPalabra ? (
            <PictogramaCard palabra={palabras[0]} grande isHighlighted={reproduciendo} />
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 w-full p-4 sm:p-6 bg-surface/90 rounded-card shadow-card">
              {palabras.map((p, i) => (
                <PictogramaCard key={`${paginaActual}-${i}`} palabra={p} grande={palabras.length <= 3} isHighlighted={palabraActiva === i} />
              ))}
            </div>
          )}
        </div>

        {/* Controles grandes: anterior, escuchar y siguiente */}
        <div className="flex items-center justify-center gap-4 sm:gap-8 w-full">
          <button
            type="button"
            onClick={() => cambiarPagina(paginaActual - 1)}
            disabled={paginaActual === 0}
            aria-label="Página anterior"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-surface text-primary border-4 border-borderStrong flex items-center justify-center cursor-pointer hover:border-brand active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-9 h-9" strokeWidth={2.5} aria-hidden />
          </button>

          <button
            type="button"
            onClick={() => {
              sonarToque();
              void escucharPagina();
            }}
            className="min-h-20 sm:min-h-24 px-8 sm:px-12 rounded-full bg-accent text-onAccent border-4 border-borderStrong flex items-center gap-4 text-3xl sm:text-4xl font-black cursor-pointer hover:bg-accent-hover active:scale-95 transition-all shadow-card"
          >
            <Volume2 className={`w-10 h-10 sm:w-12 sm:h-12 ${reproduciendo ? 'animate-pulso rounded-full' : ''}`} aria-hidden />
            Escuchar
          </button>

          <button
            type="button"
            onClick={() => (esUltimaPagina ? void finalizar() : cambiarPagina(paginaActual + 1))}
            aria-label={esUltimaPagina ? 'Terminar' : 'Página siguiente'}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-brand text-onBrand border-4 border-brand-hover flex items-center justify-center cursor-pointer hover:bg-brand-hover active:scale-95 transition-all shadow-card"
          >
            {esUltimaPagina ? <Check className="w-12 h-12" strokeWidth={3} aria-hidden /> : <ArrowRight className="w-12 h-12" strokeWidth={3} aria-hidden />}
          </button>
        </div>
      </main>
    </LayoutEstudiante>
  );
};
