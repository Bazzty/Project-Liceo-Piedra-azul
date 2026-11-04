import { useEffect, useState } from 'react';

const BOCAS = ['AEI', 'O', 'EE', 'U', 'BMP', 'L', 'AEI'];

/** Boca del osito: se mueve mientras `activa` es verdadero y vuelve a sonreír al terminar. */
export const useBocaActiva = (activa: boolean) => {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!activa) return;
    const id = setInterval(() => setI((n) => (n + 1 + Math.floor(Math.random() * 2)) % BOCAS.length), 130);
    return () => clearInterval(id);
  }, [activa]);
  return activa ? BOCAS[i] : 'HAPPY';
};
