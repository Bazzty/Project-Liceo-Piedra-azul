import React from 'react';

/** "Hoja" del libro de clases: fondo blanco, borde fino y regla gruesa de tinta arriba. */
export const Hoja: React.FC<React.HTMLAttributes<HTMLElement> & { padding?: boolean }> = ({
  padding = true,
  className = '',
  ...props
}) => (
  <section
    className={`bg-surface border border-borderCustom border-t-[3px] border-t-primary rounded-card min-w-0 ${padding ? 'px-5 py-4' : ''} ${className}`}
    {...props}
  />
);

/** Título de página: una línea pequeña arriba, título serif y descripción. */
export const EncabezadoPagina: React.FC<{
  etiqueta?: string;
  titulo: string;
  descripcion?: React.ReactNode;
  acciones?: React.ReactNode;
}> = ({ etiqueta, titulo, descripcion, acciones }) => (
  <header className="flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0">
      {etiqueta && <p className="text-xs font-semibold uppercase tracking-[0.1em] text-secondary">{etiqueta}</p>}
      <h1 className="font-display text-4xl font-semibold tracking-tight text-primary leading-tight">{titulo}</h1>
      {descripcion && <p className="mt-2 max-w-3xl text-base leading-relaxed text-primary">{descripcion}</p>}
    </div>
    {acciones}
  </header>
);
