import React from 'react';

/** Atribución obligatoria de los pictogramas (licencia CC BY-NC-SA 4.0 de ARASAAC). */
export const Creditos: React.FC<{ className?: string }> = ({ className = '' }) => (
  <p className={className}>
    Pictogramas:{' '}
    <a
      href="https://arasaac.org"
      target="_blank"
      rel="noreferrer noopener"
      className="underline underline-offset-2 hover:text-brand"
    >
      ARASAAC
    </a>{' '}
    (Gobierno de Aragón) · Licencia CC BY-NC-SA
  </p>
);
