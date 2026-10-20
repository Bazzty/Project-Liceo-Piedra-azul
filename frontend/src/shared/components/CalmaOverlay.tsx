import React, { useEffect, useState } from 'react';
import { useHablar } from '@/shared/hooks/useHablar';
import { Button } from '@/shared/ui';

const BASE = import.meta.env.BASE_URL || '/';

/**
 * Pantalla de calma: el osito "respira" despacio con un círculo que crece y se encoge.
 * Pensada para niños que se sobreestiman: poco color, un solo movimiento lento, una sola acción.
 */
export const CalmaOverlay: React.FC<{ abierto: boolean; onCerrar: () => void }> = ({ abierto, onCerrar }) => {
  const hablar = useHablar();
  const [inhala, setInhala] = useState(true);

  useEffect(() => {
    if (!abierto) return;
    hablar('Respira conmigo. Inhala... y exhala.', 'respira');
    const id = setInterval(() => setInhala((v) => !v), 4000);
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', alTeclear);
    return () => {
      clearInterval(id);
      window.removeEventListener('keydown', alTeclear);
    };
  }, [abierto, hablar, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Momento de calma"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8 bg-brand-hover text-onBrand p-6 animate-fadeIn"
    >
      <p className="text-5xl font-black" role="status" aria-live="polite">
        {inhala ? 'Inhala' : 'Exhala'}
      </p>

      <div className="relative flex items-center justify-center w-72 h-72">
        <span className="absolute inset-0 rounded-full bg-onBrand/20 animate-respiracion" aria-hidden />
        <span className="absolute inset-10 rounded-full bg-onBrand/20 animate-respiracion" style={{ animationDelay: '-0.6s' }} aria-hidden />
        <img
          src={`${BASE}assets/personajes/oso/cabeza_base.png`.replace(/\/\//g, '/')}
          alt="Osito respirando contigo"
          className="relative w-40 h-40 object-contain bg-surface rounded-full p-2"
        />
      </div>

      <Button variant="accent" size="xl" onClick={onCerrar}>
        Estoy mejor
      </Button>
    </div>
  );
};
