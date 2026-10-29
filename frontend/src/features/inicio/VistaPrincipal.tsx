import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardList, LogOut, MessageCircle, Star, Volume2 } from 'lucide-react';
import { useAlumno } from '@/api';
import { sonarToque } from '@/shared/audio/sonidos';
import type { ClaveAudio } from '@/shared/config/audiosInterfaz';
import type { PasoAgenda } from '@/shared/store/useAjustesStore';
import { ROUTES } from '@/app/routes';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { useTareasPendientes } from '@/features/tareas/useTareasPendientes';
import { AlbumEstrellas } from '@/features/estrellas/AlbumEstrellas';
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
  clave: ClaveAudio;
  onClick: () => void;
}

/** Globo grande para elegir: flota, aparece con un pequeño salto y dice su nombre al tocar el parlante. */
const Globo: React.FC<GloboProps> = ({ orden, estilo, icono, titulo, clave, onClick }) => {
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
          onClick={() => hablar(titulo, clave)}
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

/** Aviso de la tarea que dejó la docente: la portada del cuento y un botón grande para ir directo. */
const TareaDeLaProfe: React.FC<{ alumnoId: string | null }> = ({ alumnoId }) => {
  const navigate = useNavigate();
  const hablar = useHablar();
  const tareas = useTareasPendientes(alumnoId);
  const primera = tareas[0];
  if (!primera?.cuento.id) return null;
  const { cuento } = primera;

  return (
    <button
      type="button"
      onClick={() => {
        sonarToque();
        hablar(`Tarea de la profe. ${cuento.titulo}`);
        navigate(ROUTES.lectura(cuento.nivelId, cuento.id ?? ''));
      }}
      className="animate-aparecer flex items-center gap-4 rounded-full bg-surface/95 border-4 border-accent shadow-card pl-3 pr-6 py-2 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
    >
      <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-app border-2 border-borderStrong overflow-hidden p-1.5 flex items-center justify-center">
        {cuento.portadaUrl ? <img src={cuento.portadaUrl} alt="" className="w-full h-full object-contain" /> : <BookOpen className="w-8 h-8 text-secondary" aria-hidden />}
      </span>
      <span className="flex flex-col items-start leading-tight">
        <span className="inline-flex items-center gap-2 text-2xl sm:text-3xl font-black text-primary">
          <ClipboardList className="w-7 h-7 text-brand" aria-hidden />
          Tarea
        </span>
        <span className="text-base sm:text-lg font-bold text-secondary">{cuento.titulo}</span>
      </span>
      <span className="w-12 h-12 rounded-full bg-accent text-onAccent flex items-center justify-center animate-pulso" aria-hidden>
        <Volume2 className="w-6 h-6" />
      </span>
    </button>
  );
};

/** Inicio del estudiante: escena de jardín con el osito, globos para elegir y una puerta para salir. */
export const VistaPrincipal: React.FC = () => {
  const navigate = useNavigate();
  const { activeStudentId, logout, supervision } = useAuthStore();
  const alumno = useAlumno(activeStudentId);
  const [hablarAbierto, setHablarAbierto] = useState(false);
  const [estrellasAbierto, setEstrellasAbierto] = useState(false);

  const nombre = alumno?.nombre ?? 'amigo';

  const hablar = useHablar();

  const salir = () => {
    if (supervision) {
      // La supervisión termina al volver al panel docente (así la guarda del alumno no redirige antes)
      navigate(`${ROUTES.profesorEstudiantes}${activeStudentId ? `?alumno=${activeStudentId}` : ''}`);
      return;
    }
    hablar('Hasta pronto', 'despedida');
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
          <Globo orden={0} estilo="leer" titulo="Leer" clave="leer" icono={<BookOpen strokeWidth={1.8} />} onClick={() => navigate(ROUTES.aprender)} />
          <Globo orden={1} estilo="hablar" titulo="Hablar" clave="hablar" icono={<MessageCircle strokeWidth={1.8} />} onClick={() => setHablarAbierto(true)} />
          <Globo
            orden={2}
            estilo="estrellas"
            titulo="Estrellas"
            clave="estrellas"
            icono={<Star strokeWidth={1.6} className="fill-accent" />}
            onClick={() => setEstrellasAbierto(true)}
          />
        </div>

        <TareaDeLaProfe alumnoId={activeStudentId} />

        <OsoBurbuja mensaje={`¡Hola, ${nombre}!`} voz={`Hola ${nombre}. ¿Qué quieres hacer?`} clave="hola" size="xl" />
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

      {hablarAbierto && <TableroSAAC onCerrar={() => setHablarAbierto(false)} />}

      <Modal isOpen={estrellasAbierto} onClose={() => setEstrellasAbierto(false)} title="Mis estrellas" size="lg">
        <AlbumEstrellas alumnoId={activeStudentId} />
      </Modal>
    </LayoutEstudiante>
  );
};
