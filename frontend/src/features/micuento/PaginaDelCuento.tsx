import React, { useCallback, useEffect, useRef, useState } from 'react';
import { audioDe, urlPictograma, type OpcionCuento } from '@/features/micuento/frases';
import { decirSecuencia } from '@/shared/audio/decirSecuencia';
import { OsoCabeza } from '@/shared/components/OsoCabeza';
import { useBocaActiva } from '@/shared/hooks/useBocaActiva';
import { useGuideStore } from '@/shared/store/useGuideStore';

export interface PaginaDelCuentoProps {
  partes: OpcionCuento[];
  /** Cada vez que cambia este número, el osito vuelve a leer el cuento (0 = todavía no). */
  lecturas: number;
  /** Avisa si el osito está leyendo, para que los botones puedan acompañarlo. */
  alLeer?: (leyendo: boolean) => void;
}

/**
 * El cuento armado: el osito lo lee frase por frase y la frase que suena se resalta junto a su pictograma.
 * Siempre se puede volver a escuchar. Al terminar, el osito se alegra (una sola vez, sin ruido extra).
 */
export const PaginaDelCuento: React.FC<PaginaDelCuentoProps> = ({ partes, lecturas, alLeer }) => {
  const [activa, setActiva] = useState<number | null>(null);
  const corte = useRef(0);
  const alLeerRef = useRef(alLeer);
  useEffect(() => {
    alLeerRef.current = alLeer;
  }, [alLeer]);
  const boca = useBocaActiva(activa !== null);
  const seccion = useRef<HTMLElement>(null);
  // Al llegar al cuento el foco queda aquí (con teclado, el siguiente Tab es «Escuchar otra vez»)
  useEffect(() => seccion.current?.focus({ preventScroll: true }), []);

  const leer = useCallback(async () => {
    corte.current += 1;
    const mia = corte.current;
    alLeerRef.current?.(true);
    await decirSecuencia(
      partes.map((p) => ({ texto: p.frase, audioUrl: audioDe(p) })),
      { alDecir: (i) => corte.current === mia && setActiva(i), cancelada: () => corte.current !== mia },
    );
    if (corte.current === mia) {
      setActiva(null);
      alLeerRef.current?.(false);
      useGuideStore.getState().reaccionar('feliz');
    }
  }, [partes]);

  // Lee al abrir (con una pausa corta para que el niño vea las imágenes primero) y cada vez que se pide de nuevo
  useEffect(() => {
    const id = setTimeout(() => void leer(), lecturas === 0 ? 900 : 0);
    return () => clearTimeout(id);
  }, [lecturas, leer]);

  // Al salir de la pantalla se corta la lectura
  useEffect(
    () => () => {
      corte.current += 1;
    },
    [],
  );

  return (
    <section ref={seccion} tabIndex={-1} className="w-full flex flex-col items-center gap-4 sm:gap-6 focus-visible:outline-none focus-visible:shadow-none" aria-label="Tu cuento">
      <span className="block w-24 h-24 sm:w-32 sm:h-32 bg-surface rounded-full border-4 border-borderStrong p-1 overflow-hidden" role="img" aria-label="El osito lee tu cuento">
        <OsoCabeza boca={boca} />
      </span>
      <p className="sr-only" aria-live="polite">
        {activa !== null ? partes[activa].frase : ''}
      </p>
      <ol className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {partes.map((p, i) => (
          <li
            key={p.id}
            data-activa={activa === i ? '1' : '0'}
            className={`flex flex-col items-center gap-2 rounded-card border-4 bg-surface p-3 sm:p-4 shadow-card transition-all ${
              activa === i ? 'border-brand ring-8 ring-accent/70 scale-105' : 'border-borderStrong'
            }`}
          >
            <img src={urlPictograma(p)} alt={p.alt} className="w-28 h-28 sm:w-40 sm:h-40 object-contain" />
            <span className="text-base sm:text-xl font-black text-primary text-center leading-tight">{p.frase}</span>
          </li>
        ))}
      </ol>
    </section>
  );
};
