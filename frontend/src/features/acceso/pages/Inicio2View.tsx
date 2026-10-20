import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes';
import { Button, Card } from '@/shared/ui';

/** Marcador de posición del segundo flujo de inicio (en desarrollo por otro equipo). */
export const Inicio2View: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-app p-6 text-center">
      <Card padding="lg" className="max-w-md w-full flex flex-col items-center gap-4">
        <h2 className="text-2xl font-black text-primary">Inicio 2 (modo directo)</h2>
        <p className="text-secondary text-sm">Este modo de inicio está siendo integrado por el segundo equipo de desarrollo.</p>
        <Button size="lg" onClick={() => navigate(ROUTES.selector)}>
          Volver al selector
        </Button>
      </Card>
    </div>
  );
};
