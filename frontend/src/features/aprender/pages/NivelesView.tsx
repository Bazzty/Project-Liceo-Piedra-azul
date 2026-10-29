import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Star, Volume2 } from 'lucide-react';
import { useCuentosDeNivel, useProgresosDeAlumno } from '@/api';
import { ROUTES } from '@/app/routes';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { sonarToque } from '@/shared/audio/sonidos';
import { LayoutEstudiante } from '@/shared/components/LayoutEstudiante';
import { OsoBurbuja } from '@/shared/components/OsoBurbuja';
import { NIVELES_CAMINO, type NivelCamino } from '@/shared/config/niveles';
import { useHablar } from '@/shared/hooks/useHablar';

const BASE = import.meta.env.BASE_URL || '/';

const PARADAS = NIVELES_CAMINO;
type Parada = NivelCamino;

const ESTRELLAS_POR_NIVEL = 3;

interface ParadaNivelProps {
  parada: Parada;
  orden: number;
  completados: number;
  total: number;
  onElegir: () => void;
}

/** Una parada del camino: letra grande, pictograma, estrellas ganadas y candado suave si aún no hay contenido. */
const ParadaNivel: React.FC<ParadaNivelProps> = ({ parada, orden, completados, total, onElegir }) => {
  const hablar = useHablar();
  const bloqueada = total === 0;
  const ganadas = total === 0 ? 0 : Math.ceil((ESTRELLAS_POR_NIVEL * completados) / total);

  const alTocar = () => {
    sonarToque();
    if (bloqueada) hablar('Este nivel llega pronto.', 'pronto');
    else onElegir();
  };

  return (
    <li
      className={`flex flex-col items-center gap-2 animate-aparecer ${orden % 2 === 1 ? 'lg:translate-y-14' : ''}`}
      style={{ animationDelay: `${orden * 140}ms` }}
    >
      <div className="relative">
        <button
          type="button"
          onClick={alTocar}
          aria-label={bloqueada ? `Nivel ${parada.letra}: llega pronto` : `Nivel ${parada.letra}: ${parada.nombre}`}
          className={`group relative w-32 h-32 sm:w-40 sm:h-40 lg:w-44 lg:h-44 rounded-full flex flex-col items-center justify-center shadow-card border-b-8 border-black/20 cursor-pointer transition-transform hover:scale-110 active:scale-95 ${
            bloqueada ? 'bg-app text-secondary !border-borderStrong border-4 border-dashed opacity-90' : parada.color
          }`}
        >
          <span className="text-7xl sm:text-8xl font-black leading-none group-hover:animate-girar">{parada.letra}</span>
          {bloqueada && <Lock className="absolute top-3 left-3 w-8 h-8" aria-hidden />}
        </button>
        <img
          src={`${BASE}pictogramas/arasaac/${parada.imagen}.png`.replace(/\/\//g, '/')}
          alt=""
          className="absolute -bottom-2 -right-2 w-16 h-16 sm:w-20 sm:h-20 object-contain bg-white rounded-full p-1.5 border-4 border-surface shadow-card"
        />
        <button
          type="button"
          onClick={() => hablar(bloqueada ? `Nivel ${parada.letra}. Llega pronto.` : `Nivel ${parada.letra}. ${parada.nombre}.`, bloqueada ? 'pronto' : parada.clave)}
          aria-label={`Escuchar: nivel ${parada.letra}`}
          className="absolute -top-1 -right-1 w-11 h-11 rounded-full bg-surface text-primary border-2 border-borderStrong flex items-center justify-center cursor-pointer hover:bg-app"
        >
          <Volume2 className="w-5 h-5" aria-hidden />
        </button>
      </div>

      <p className="text-2xl font-black text-primary bg-surface/90 rounded-full px-4 py-0.5">{bloqueada ? 'Pronto' : parada.nombre}</p>
      <div className="flex gap-1" role="img" aria-label={`${ganadas} de ${ESTRELLAS_POR_NIVEL} estrellas`}>
        {Array.from({ length: ESTRELLAS_POR_NIVEL }, (_, i) => (
          <Star
            key={i}
            aria-hidden
            strokeWidth={2}
            className={`w-8 h-8 ${i < ganadas ? 'fill-accent text-brand' : 'text-borderStrong'}`}
          />
        ))}
      </div>
    </li>
  );
};

/** Niveles de lectura como un camino con paradas: letra grande, pictograma y estrellas, sin texto que leer. */
export const NivelesView: React.FC = () => {
  const navigate = useNavigate();
  const activeStudentId = useAuthStore((s) => s.activeStudentId);
  const progresos = useProgresosDeAlumno(activeStudentId);
  const cuentosPorNivel = [
    useCuentosDeNivel(PARADAS[0].id),
    useCuentosDeNivel(PARADAS[1].id),
    useCuentosDeNivel(PARADAS[2].id),
    useCuentosDeNivel(PARADAS[3].id),
    useCuentosDeNivel(PARADAS[4].id),
  ];

  const publicados = (nivelIndex: number) => (cuentosPorNivel[nivelIndex] ?? []).filter((c) => c.estado === 'publicado');

  const completadosDe = (nivelIndex: number) => {
    const ids = new Set(publicados(nivelIndex).map((c) => c.id));
    return new Set((progresos ?? []).filter((p) => p.completado && ids.has(p.cuentoId)).map((p) => p.cuentoId)).size;
  };

  return (
    <LayoutEstudiante onVolver={() => navigate(ROUTES.menu)}>
      <main className="relative flex-1 w-full max-w-6xl mx-auto px-4 py-6 sm:py-10 flex flex-col items-center justify-center gap-8 lg:gap-16">
        <h1 className="sr-only">Niveles de lectura</h1>

        <div className="relative w-full">
          {/* Camino punteado que une las paradas (solo en pantallas anchas) */}
          <svg viewBox="0 0 1000 160" preserveAspectRatio="none" className="hidden lg:block absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-40" aria-hidden>
            <path
              d="M100 60 C 200 60, 200 130, 300 130 S 400 60, 500 60 S 600 130, 700 130 S 800 60, 900 60"
              fill="none"
              stroke="var(--brand-primary)"
              strokeOpacity="0.5"
              strokeWidth="8"
              strokeDasharray="4 18"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <ol className="relative flex flex-wrap justify-center gap-x-6 gap-y-8 sm:gap-x-12 lg:justify-between lg:gap-x-0 lg:px-4 lg:pb-14">
            {PARADAS.map((p, i) => (
              <ParadaNivel
                key={p.id}
                parada={p}
                orden={i}
                total={publicados(i).length}
                completados={completadosDe(i)}
                onElegir={() => navigate(ROUTES.catalogo(p.id))}
              />
            ))}
          </ol>
        </div>

        <OsoBurbuja mensaje="¿Dónde jugamos?" voz="Elige un nivel para empezar a leer." clave="elige_nivel" size="md" />
      </main>
    </LayoutEstudiante>
  );
};
