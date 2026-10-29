import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '@/shared/store/usePlayerStore';
import { useAjustesStore } from '@/shared/store/useAjustesStore';

/** Bocas del sprite que se alternan al hablar (mismas que usa el osito de cuerpo completo). */
const BOCAS_HABLA = ['AEI', 'O', 'CDNS', 'EE', 'U', 'BMP', 'AEI', 'L'];

/**
 * Mueve la boca del osito mientras suena un audio (o un tiempo estimado si se lee con la voz del navegador).
 * Llamar a `iniciar` justo después de pedir el audio.
 */
export const useBocaHabla = () => {
  const [boca, setBoca] = useState('NEUTRAL');
  const intervalo = useRef<ReturnType<typeof setInterval> | null>(null);

  const parar = useCallback(() => {
    if (intervalo.current) clearInterval(intervalo.current);
    intervalo.current = null;
    setBoca('NEUTRAL');
  }, []);

  const iniciar = useCallback(
    (texto?: string) => {
      parar();
      if (!useAjustesStore.getState().sonido) return;
      const audio = usePlayerStore.getState().activeAudioInstance;
      const maxMs = audio ? 15000 : Math.min(4500, (texto?.length ?? 20) * 80);
      const inicio = performance.now();
      let i = 0;
      intervalo.current = setInterval(() => {
        const termino =
          performance.now() - inicio > maxMs || (audio && (audio.ended || usePlayerStore.getState().activeAudioInstance !== audio));
        if (termino) {
          parar();
          return;
        }
        i = (i + 1 + Math.floor(Math.random() * 2)) % BOCAS_HABLA.length;
        setBoca(BOCAS_HABLA[i]);
      }, 130);
    },
    [parar],
  );

  useEffect(() => parar, [parar]);

  return { boca, hablando: boca !== 'NEUTRAL', iniciar };
};
