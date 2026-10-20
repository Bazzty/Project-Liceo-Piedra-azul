import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { useHablar } from '@/shared/hooks/useHablar';
import { Button, Modal } from '@/shared/ui';

/** Segundos sin tocar nada antes de preguntar "¿sigues ahí?" y segundos extra antes de cerrar la sesión. */
const SEGUNDOS_AVISO = 90;
const SEGUNDOS_CIERRE = 30;
const BASE = import.meta.env.BASE_URL || '/';

/**
 * Fin de sesión amable: si el niño deja de tocar, el osito se "duerme" y pregunta con voz.
 * Con un toque en el botón la sesión sigue; si no responde, se cierra y vuelve al inicio.
 */
export const AvisoInactividad: React.FC = () => {
  const navigate = useNavigate();
  const hablar = useHablar();
  const logout = useAuthStore((s) => s.logout);
  const [enAviso, setEnAviso] = useState(false);
  const [restante, setRestante] = useState(SEGUNDOS_CIERRE);
  const ultimaActividad = useRef(0);
  const inicioAviso = useRef(0);
  const avisoRef = useRef(false);

  useEffect(() => {
    const marcar = () => {
      if (!avisoRef.current) ultimaActividad.current = Date.now();
    };
    ultimaActividad.current = Date.now();
    const eventos = ['pointerdown', 'keydown', 'touchstart'] as const;
    eventos.forEach((e) => window.addEventListener(e, marcar));

    const id = setInterval(() => {
      const ahora = Date.now();
      if (!avisoRef.current) {
        if (ahora - ultimaActividad.current > SEGUNDOS_AVISO * 1000) {
          avisoRef.current = true;
          inicioAviso.current = ahora;
          setRestante(SEGUNDOS_CIERRE);
          setEnAviso(true);
          hablar('¿Sigues ahí?', 'sigues_ahi');
        }
      } else {
        const faltan = SEGUNDOS_CIERRE - Math.floor((ahora - inicioAviso.current) / 1000);
        setRestante(Math.max(0, faltan));
        if (faltan <= 0) {
          avisoRef.current = false;
          setEnAviso(false);
          hablar('Hasta pronto', 'despedida');
          logout();
          navigate(ROUTES.inicio);
        }
      }
    }, 1000);

    return () => {
      eventos.forEach((e) => window.removeEventListener(e, marcar));
      clearInterval(id);
    };
  }, [hablar, logout, navigate]);

  const sigoAqui = () => {
    avisoRef.current = false;
    ultimaActividad.current = Date.now();
    setEnAviso(false);
  };

  return (
    <Modal isOpen={enAviso} onClose={sigoAqui} title="¿Sigues ahí?" size="sm" dismissible={false}>
      <div className="flex flex-col items-center gap-5 p-4 text-center">
        <div className="relative">
          <img
            src={`${BASE}assets/personajes/oso/cabeza_base.png`.replace(/\/\//g, '/')}
            alt="Osito dormido"
            className="w-36 h-36 object-contain bg-surface rounded-full border-4 border-borderStrong p-2 opacity-80"
          />
          <span className="absolute -top-2 -right-4 text-4xl font-black text-brand animate-flotar" aria-hidden>
            Z z z
          </span>
        </div>
        <p className="text-3xl font-black text-primary">¿Sigues ahí?</p>
        <Button size="xl" fullWidth onClick={sigoAqui}>
          ¡Aquí estoy!
        </Button>
        <p className="text-base font-bold text-secondary" aria-live="off">
          Si no tocas, cerramos en {restante} s
        </p>
      </div>
    </Modal>
  );
};
