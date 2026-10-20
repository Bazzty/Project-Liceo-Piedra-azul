import React, { useState } from 'react';
import { ArrowLeft, Leaf, Settings } from 'lucide-react';
import { useAlumno } from '@/api';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { AjustesEstudiante } from '@/shared/components/AjustesEstudiante';
import { AvisoInactividad } from '@/shared/components/AvisoInactividad';
import { CalmaOverlay } from '@/shared/components/CalmaOverlay';
import { DecoracionJardin } from '@/shared/components/DecoracionJardin';
import { FondoPaisaje } from '@/shared/components/FondoPaisaje';
import { OsitoActor, type OsitoActorProps } from '@/shared/components/OsitoActor';
import { OsitoAsoma, type OsitoAsomaProps } from '@/shared/components/OsitoAsoma';
import { useAplicarTema } from '@/shared/hooks/useAplicarTema';

const BOTON_ICONO =
  'inline-flex items-center justify-center gap-2 min-h-12 min-w-12 px-3 rounded-control border-2 border-borderStrong bg-surface text-primary font-bold cursor-pointer hover:border-brand transition-colors';

/** Osito acompañante: de cuerpo entero (llega caminando y reacciona) o asomándose por un borde. */
export type OsitoAcompanante = ({ tipo: 'actor' } & OsitoActorProps) | ({ tipo: 'asoma' } & OsitoAsomaProps);

export interface LayoutEstudianteProps {
  children: React.ReactNode;
  /** Si se pasa, aparece el botón redondo de volver. */
  onVolver?: () => void;
  /** Contenido centrado en la barra superior (p. ej. la agenda visual). */
  centro?: React.ReactNode;
  fondo?: 'paisaje' | 'jardin';
  osito?: OsitoAcompanante;
}

/**
 * Marco común de las pantallas del estudiante: barra con su nombre, calma y ajustes,
 * fondo con paisaje, y el aviso amable de fin de sesión por inactividad.
 */
export const LayoutEstudiante: React.FC<LayoutEstudianteProps> = ({ children, onVolver, centro, fondo = 'paisaje', osito }) => {
  useAplicarTema();
  const activeStudentId = useAuthStore((s) => s.activeStudentId);
  const supervision = useAuthStore((s) => s.supervision);
  const navigate = useNavigate();
  const alumno = useAlumno(activeStudentId);
  const [ajustesAbierto, setAjustesAbierto] = useState(false);
  const [calmaAbierta, setCalmaAbierta] = useState(false);
  const nombre = alumno?.nombre ?? 'amigo';

  return (
    <div className="relative overflow-hidden min-h-screen bg-app text-primary flex flex-col">
      <FondoPaisaje />
      {fondo === 'jardin' && <DecoracionJardin />}

      {supervision && (
        <div
          role="status"
          className="relative z-20 flex flex-wrap items-center justify-between gap-3 bg-statusWarn text-onStatus px-4 sm:px-8 py-2"
        >
          <p className="text-sm sm:text-base font-semibold">
            Modo supervisión · Estás viendo la pantalla de {nombre}. Lo que hagas aquí no cuenta como su actividad.
          </p>
          <button
            type="button"
            onClick={() => navigate(`${ROUTES.profesorEstudiantes}${activeStudentId ? `?alumno=${activeStudentId}` : ''}`)}
            className="min-h-12 px-5 rounded-control bg-surface text-primary text-sm font-bold cursor-pointer hover:bg-app"
          >
            Salir de la supervisión
          </button>
        </div>
      )}

      <header className="relative z-10 bg-surface/95 border-b-2 border-borderCustom px-3 sm:px-8 py-2 sm:py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onVolver && (
            <button
              type="button"
              onClick={onVolver}
              aria-label="Volver"
              className="w-14 h-14 shrink-0 rounded-full bg-accent text-onAccent border-2 border-borderStrong flex items-center justify-center cursor-pointer hover:bg-accent-hover active:scale-95 transition-colors"
            >
              <ArrowLeft className="w-8 h-8" strokeWidth={2.5} aria-hidden />
            </button>
          )}
          <span className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full bg-accent border-[3px] border-brand flex items-center justify-center text-xl sm:text-2xl font-black text-onAccent" aria-hidden>
            {nombre.charAt(0).toUpperCase()}
          </span>
          <p className="text-xl sm:text-3xl font-black truncate">{nombre}</p>
        </div>

        <div className="justify-self-center">{centro}</div>

        <div className="flex items-center justify-end gap-2">
          <button type="button" className={BOTON_ICONO} onClick={() => setCalmaAbierta(true)}>
            <Leaf className="w-5 h-5" aria-hidden />
            <span className="hidden md:inline">Calma</span>
            <span className="sr-only md:hidden">Calma</span>
          </button>
          <button type="button" className={BOTON_ICONO} onClick={() => setAjustesAbierto(true)}>
            <Settings className="w-5 h-5" aria-hidden />
            <span className="sr-only">Ajustes</span>
          </button>
        </div>
      </header>

      <div className="relative flex-1 flex flex-col">{children}</div>

      {osito?.tipo === 'actor' && <OsitoActor {...osito} />}
      {osito?.tipo === 'asoma' && <OsitoAsoma {...osito} />}

      <AjustesEstudiante isOpen={ajustesAbierto} onClose={() => setAjustesAbierto(false)} />
      <CalmaOverlay abierto={calmaAbierta} onCerrar={() => setCalmaAbierta(false)} />
      {!supervision && <AvisoInactividad />}
    </div>
  );
};
