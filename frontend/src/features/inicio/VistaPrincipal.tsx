import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, MessageCircle, Star, Volume2 } from 'lucide-react';
import { useAlumno, useProgresosDeAlumno } from '@/api';
import { sonarToque } from '@/shared/audio/sonidos';
import type { PasoAgenda } from '@/shared/store/useAjustesStore';
import { ROUTES } from '@/app/routes';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { TableroSAAC } from '@/features/tablero/components/TableroSAAC';
import { AgendaVisual } from '@/shared/components/AgendaVisual';
import { LayoutEstudiante } from '@/shared/components/LayoutEstudiante';
import { OsoBurbuja } from '@/shared/components/OsoBurbuja';
import { useHablar } from '@/shared/hooks/useHablar';
import { Modal } from '@/shared/ui';

const ESTILOS_GLOBO = {
  leer: { fondo: 'bg-btnAprender-bg text-btnAprender-text', cuerda: 'var(--btn-aprender-border)' },
  hablar: { fondo: 'bg-btnHablar-bg text-btnHablar-text', cuerda: 'var(--btn-hablar-border)' },
  estrellas: { fondo: 'bg-btnLogros-bg text-btnLogros-text', cuerda: 'var(--btn-logros-border)' },
} as const;

interface GloboProps {
  orden: number;
  estilo: keyof typeof ESTILOS_GLOBO;
  icono: React.ReactNode;
  titulo: string;
  onClick: () => void;
}

/** Globo grande para elegir: flota, aparece con un pequeño salto y dice su nombre al tocar el parlante. */
const Globo: React.FC<GloboProps> = ({ orden, estilo, icono, titulo, onClick }) => {
  const hablar = useHablar();
  const { fondo, cuerda } = ESTILOS_GLOBO[estilo];
  return (
    <div className="animate-aparecer" style={{ animationDelay: `${orden * 150}ms` }}>
      <div className="relative flex flex-col items-center animate-flotar" style={{ animationDelay: `${orden * -2}s`, animationDuration: `${5 + orden}s` }}>
        <button
          type="button"
          onClick={() => {
            sonarToque();
            onClick();
          }}
          className={`group relative overflow-hidden w-[27vw] h-[27vw] max-w-[9.5rem] max-h-[9.5rem] sm:max-w-none sm:max-h-none sm:w-[min(13rem,24vh)] sm:h-[min(13rem,24vh)] sm:portrait:w-[min(27vw,19rem)] sm:portrait:h-[min(27vw,19rem)] lg:w-[min(16rem,27vh)] lg:h-[min(16rem,27vh)] rounded-full flex flex-col items-center justify-center gap-1 sm:gap-2 shadow-card cursor-pointer transition-transform hover:scale-110 active:scale-95 ${fondo}`}
        >
          <span className="absolute top-[11%] left-[17%] w-[26%] h-[15%] rounded-full bg-white/35 -rotate-[35deg]" aria-hidden />
          <span className="group-hover:animate-girar [&>svg]:w-9 [&>svg]:h-9 sm:[&>svg]:w-16 sm:[&>svg]:h-16 lg:[&>svg]:w-24 lg:[&>svg]:h-24" aria-hidden>
            {icono}
          </span>
          <span className="text-base sm:text-2xl lg:text-3xl font-black leading-tight text-center px-2">{titulo}</span>
        </button>
        <button
          type="button"
          onClick={() => hablar(titulo)}
          aria-label={`Escuchar: ${titulo}`}
          className="absolute top-[4%] right-[4%] w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface text-primary border-2 border-borderStrong flex items-center justify-center cursor-pointer hover:bg-app"
        >
          <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden />
        </button>
        {/* Nudo y cuerda del globo */}
        <svg viewBox="0 0 40 60" className="w-8 sm:w-10 h-10 sm:h-14 -mt-1" aria-hidden>
          <path d="M20 0 L14 9 H26 Z" fill={cuerda} />
          <path d="M20 9 C 8 20 32 30 20 42 C 12 50 24 54 20 60" fill="none" stroke={cuerda} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};

/** Inicio del estudiante: escena de jardín con el osito, globos para elegir y una puerta para salir. */
export const VistaPrincipal: React.FC = () => {
  const navigate = useNavigate();
  const hablar = useHablar();
  const { activeStudentId, logout } = useAuthStore();
  const alumno = useAlumno(activeStudentId);
  const progresos = useProgresosDeAlumno(activeStudentId);
  const [hablarAbierto, setHablarAbierto] = useState(false);
  const [estrellasAbierto, setEstrellasAbierto] = useState(false);

  const nombre = alumno?.nombre ?? 'amigo';
  const leidos = (progresos ?? []).filter((p) => p.completado).length;
  const TOTAL_ESTRELLAS = 8;

  const salir = () => {
    logout();
    navigate(ROUTES.inicio);
  };

  const irAPaso = (paso: PasoAgenda) => {
    sonarToque();
    if (paso === 'leer') navigate(ROUTES.aprender);
    else if (paso === 'hablar') setHablarAbierto(true);
    else setEstrellasAbierto(true);
  };

  return (
    <LayoutEstudiante fondo="jardin" centro={<AgendaVisual onElegir={irAPaso} />}>
      <main className="relative flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6 pb-6 flex flex-col items-center justify-between sm:portrait:justify-center sm:portrait:gap-[7vh] gap-4">
        <h1 className="sr-only">Menú de {nombre}</h1>

        <div className="flex items-start justify-center gap-3 sm:gap-10 lg:gap-16 w-full">
          <Globo orden={0} estilo="leer" titulo="Leer" icono={<BookOpen strokeWidth={1.8} />} onClick={() => navigate(ROUTES.aprender)} />
          <Globo orden={1} estilo="hablar" titulo="Hablar" icono={<MessageCircle strokeWidth={1.8} />} onClick={() => setHablarAbierto(true)} />
          <Globo
            orden={2}
            estilo="estrellas"
            titulo="Estrellas"
            icono={<Star strokeWidth={1.6} className="fill-accent" />}
            onClick={() => setEstrellasAbierto(true)}
          />
        </div>

        <OsoBurbuja mensaje={`¡Hola, ${nombre}!`} voz={`Hola ${nombre}. ¿Qué quieres hacer?`} size="xl" />
      </main>

      {/* Puerta para salir: pequeña y apartada para que no se toque sin querer */}
      <button
        type="button"
        onClick={salir}
        className="absolute z-10 bottom-4 right-4 sm:bottom-6 sm:right-8 flex flex-col items-center justify-center gap-0.5 w-20 h-24 sm:w-24 sm:h-28 rounded-t-[2.5rem] rounded-b-lg border-4 border-borderStrong bg-surface text-primary shadow-card cursor-pointer hover:-translate-y-1 hover:border-brand transition-transform"
      >
        <LogOut className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={2} aria-hidden />
        <span className="text-base sm:text-lg font-black">Salir</span>
      </button>

      <Modal isOpen={hablarAbierto} onClose={() => setHablarAbierto(false)} title="Hablar" size="full">
        <TableroSAAC />
      </Modal>

      <Modal isOpen={estrellasAbierto} onClose={() => setEstrellasAbierto(false)} title="Mis estrellas" size="sm">
        <div className="flex flex-col items-center gap-5 p-4 text-center">
          <div className="flex flex-wrap justify-center gap-2" role="img" aria-label={`${leidos} estrellas de ${TOTAL_ESTRELLAS}`}>
            {Array.from({ length: TOTAL_ESTRELLAS }, (_, i) => (
              <Star
                key={i}
                aria-hidden
                className={`w-12 h-12 animate-pop ${i < leidos ? 'fill-accent text-brand' : 'text-borderStrong'}`}
                style={{ animationDelay: `${i * 90}ms`, animationFillMode: 'backwards' }}
                strokeWidth={1.8}
              />
            ))}
          </div>
          <p className="text-3xl font-black text-primary">
            {leidos === 0 ? '¡Vamos por tu primera estrella!' : `¡Tienes ${leidos} ${leidos === 1 ? 'estrella' : 'estrellas'}!`}
          </p>
          <button
            type="button"
            onClick={() => hablar(leidos === 0 ? 'Vamos por tu primera estrella' : `Tienes ${leidos} estrellas`)}
            className="inline-flex items-center gap-2 min-h-12 px-5 rounded-control bg-accent text-onAccent font-extrabold cursor-pointer hover:bg-accent-hover"
          >
            <Volume2 className="w-5 h-5" aria-hidden />
            Escuchar
          </button>
        </div>
      </Modal>

    </LayoutEstudiante>
  );
};
