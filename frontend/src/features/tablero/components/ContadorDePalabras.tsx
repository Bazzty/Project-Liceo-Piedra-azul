import React from 'react';

interface Props {
  /** Palabras que ya están en la frase. */
  cantidad: number;
  maximo: number;
  /** Hay una palabra escrita a medias: ocupa el siguiente círculo, punteado. */
  enCurso: boolean;
}

/**
 * Cuánto espacio le queda a la frase, sin leer: un círculo por palabra posible. Lleno = ya está en la frase,
 * punteado = la que se está escribiendo, vacío = todavía cabe. Se distinguen por la forma y no solo por el color,
 * y no se mueven (poco estímulo). Solo se muestra cuando hay algo en la frase.
 */
export const ContadorDePalabras: React.FC<Props> = ({ cantidad, maximo, enCurso }) => {
  if (cantidad === 0 && !enCurso) return null;
  const llena = cantidad >= maximo;
  return (
    <>
      <div
        role="img"
        aria-label={`${cantidad} de ${maximo} palabras`}
        data-testid="contador-de-palabras"
        className="flex items-center justify-center gap-2 sm:gap-2.5"
      >
        {Array.from({ length: maximo }, (_, i) => {
          const estado = i < cantidad ? 'lleno' : i === cantidad && enCurso ? 'en-curso' : 'vacio';
          return (
            <span
              key={i}
              data-estado={estado}
              aria-hidden
              className={`block w-3.5 h-3.5 sm:w-[1.125rem] sm:h-[1.125rem] rounded-full border-2 border-borderStrong ${
                estado === 'lleno' ? 'bg-accent' : estado === 'en-curso' ? 'border-dashed bg-transparent' : 'bg-transparent'
              }`}
            />
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        {llena ? 'La frase está completa. Puedes decirla o borrar una palabra.' : ''}
      </p>
    </>
  );
};
