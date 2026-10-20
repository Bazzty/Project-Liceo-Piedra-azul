import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Play, Star, Volume2 } from 'lucide-react';
import { useCuentosDeNivel, useNivel, useProgresosDeAlumno } from '@/api';
import { ROUTES } from '@/app/routes';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { resolverYGuardarPictograma } from '@/features/tablero/arasaac';
import { sonarToque } from '@/shared/audio/sonidos';
import { LayoutEstudiante } from '@/shared/components/LayoutEstudiante';
import { useHablar } from '@/shared/hooks/useHablar';
import { usePlayerStore } from '@/shared/store/usePlayerStore';
import type { Cuento } from '@/types';

/** Portada con respaldo: si la imagen local no existe, la pide a ARASAAC una sola vez. */
const PortadaCuento: React.FC<{ cuento: Cuento }> = ({ cuento }) => {
  const [imgSrc, setImgSrc] = useState(cuento.portadaUrl);
  const [hasError, setHasError] = useState(false);

  const [portadaAnterior, setPortadaAnterior] = useState(cuento.portadaUrl);
  if (portadaAnterior !== cuento.portadaUrl) {
    setPortadaAnterior(cuento.portadaUrl);
    setImgSrc(cuento.portadaUrl);
    setHasError(false);
  }

  const alFallar = async () => {
    if (hasError) return;
    const apiUrl = await resolverYGuardarPictograma(cuento.titulo);
    if (apiUrl && apiUrl !== imgSrc) setImgSrc(apiUrl);
    else setHasError(true);
  };

  return (
    <div className="w-full aspect-[4/3] flex items-center justify-center bg-app rounded-control overflow-hidden p-3">
      {imgSrc && !hasError ? (
        <img
          src={imgSrc}
          alt=""
          onError={alFallar}
          className="w-full h-full object-contain group-hover:scale-110 transition-transform"
        />
      ) : (
        <BookOpen className="w-16 h-16 text-secondary" aria-hidden />
      )}
    </div>
  );
};

interface TarjetaCuentoProps {
  cuento: Cuento;
  orden: number;
  completado: boolean;
  onElegir: () => void;
}

/** Tarjeta grande de cuento: portada, título, estrella si ya se leyó y un parlante que dice el título. */
const TarjetaCuento: React.FC<TarjetaCuentoProps> = ({ cuento, orden, completado, onElegir }) => {
  const hablar = useHablar();
  const reproducir = usePlayerStore((s) => s.playAudio);
  // Las actividades de una sola palabra ya tienen su audio grabado: se usa ese
  const audioTitulo = cuento.paginas?.length === 1 ? cuento.paginas[0].palabras?.[0]?.audioUrl : undefined;
  return (
    <li className="relative animate-aparecer" style={{ animationDelay: `${Math.min(orden, 8) * 70}ms` }}>
      <button
        type="button"
        onClick={() => {
          sonarToque();
          onElegir();
        }}
        className="group w-full flex flex-col gap-3 p-4 rounded-card bg-surface border-2 border-borderCustom shadow-card cursor-pointer text-left transition-transform hover:-translate-y-2 hover:scale-[1.02] active:scale-95"
      >
        <PortadaCuento cuento={cuento} />
        <span className="flex items-center justify-between gap-3">
          <span className="text-2xl sm:text-3xl font-black text-primary leading-tight">{cuento.titulo}</span>
          <span
            className="w-14 h-14 shrink-0 rounded-full bg-brand text-onBrand flex items-center justify-center group-hover:bg-brand-hover"
            aria-hidden
          >
            <Play className="w-7 h-7 fill-current" />
          </span>
        </span>
      </button>

      {completado && (
        <span
          className="absolute -top-3 -left-3 w-14 h-14 rounded-full bg-accent border-4 border-surface shadow-card flex items-center justify-center animate-flotar"
          role="img"
          aria-label="Ya lo leíste"
        >
          <Star className="w-8 h-8 fill-brand text-brand" aria-hidden />
        </span>
      )}

      <button
        type="button"
        onClick={() => (audioTitulo ? reproducir(audioTitulo, { alFallar: () => hablar(cuento.titulo) }) : hablar(cuento.titulo))}
        aria-label={`Escuchar: ${cuento.titulo}`}
        className="absolute top-6 right-6 w-12 h-12 rounded-full bg-surface text-primary border-2 border-borderStrong flex items-center justify-center cursor-pointer hover:bg-app"
      >
        <Volume2 className="w-6 h-6" aria-hidden />
      </button>
    </li>
  );
};

/** Catálogo del nivel: tarjetas grandes con portada, casi sin texto. */
export const CatalogoCuentos: React.FC = () => {
  const { nivelId = '' } = useParams();
  const navigate = useNavigate();
  const activeStudentId = useAuthStore((s) => s.activeStudentId);
  const nivel = useNivel(nivelId);
  // Los niños solo ven los cuentos validados por el revisor
  const cuentos = useCuentosDeNivel(nivelId)?.filter((c) => c.estado === 'publicado');
  const progresos = useProgresosDeAlumno(activeStudentId);

  const completado = (cuentoId?: string) => !!cuentoId && !!progresos?.some((p) => p.cuentoId === cuentoId && p.completado);

  return (
    <LayoutEstudiante
      onVolver={() => navigate(ROUTES.aprender)}
      osito={{ tipo: 'asoma', lado: 'izq', pos: 62, mensaje: '¡Elige un cuento!', clave: 'elige_cuento' }}
    >
      <main className="relative flex-1 w-full max-w-6xl mx-auto px-4 py-6 sm:py-8 flex flex-col gap-6">
        <div className="flex items-center justify-center gap-6 sm:gap-10">
          <span
            className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-full bg-brand text-onBrand flex items-center justify-center text-6xl font-black shadow-card"
            aria-hidden
          >
            {nivel?.codigo ?? '?'}
          </span>
          <h1 className="sr-only">Nivel {nivel?.codigo}</h1>
        </div>

        {!cuentos || cuentos.length === 0 ? (
          <div className="flex flex-col items-center gap-4 p-10 bg-surface rounded-card border-2 border-borderCustom text-center">
            <BookOpen className="w-20 h-20 text-secondary" aria-hidden />
            <p className="text-3xl font-black text-primary">Pronto habrá cuentos aquí</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
            {cuentos.map((cuento, i) => (
              <TarjetaCuento
                key={cuento.id}
                cuento={cuento}
                orden={i}
                completado={completado(cuento.id)}
                onElegir={() => cuento.id && navigate(ROUTES.lectura(nivelId, cuento.id))}
              />
            ))}
          </ul>
        )}
      </main>
    </LayoutEstudiante>
  );
};
