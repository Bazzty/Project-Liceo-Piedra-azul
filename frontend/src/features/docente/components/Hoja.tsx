import React from 'react';

/** Tarjeta del panel docente: fondo blanco, borde fino, esquinas redondeadas y sombra suave. */
export const Hoja: React.FC<React.HTMLAttributes<HTMLElement> & { padding?: boolean }> = ({
  padding = true,
  className = '',
  ...props
}) => (
  <section
    className={`bg-surface border border-borderCustom rounded-card shadow-card min-w-0 ${padding ? 'px-5 py-4' : ''} ${className}`}
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
      {etiqueta && <p className="text-sm text-secondary">{etiqueta}</p>}
      <h1 className="font-display text-[1.75rem] sm:text-[2rem] tracking-tight text-primary leading-tight">{titulo}</h1>
      {descripcion && <p className="mt-2 max-w-3xl text-[0.9375rem] leading-relaxed text-secondary">{descripcion}</p>}
    </div>
    {acciones}
  </header>
);
