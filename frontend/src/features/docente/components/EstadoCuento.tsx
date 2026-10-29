import React from 'react';
import type { Cuento } from '@/types';

const ESTADOS: Record<Cuento['estado'], { texto: string; clases: string }> = {
  borrador: { texto: '○ Borrador', clases: 'bg-borderCustom text-primary' },
  en_revision: { texto: '● En revisión', clases: 'bg-statusWarn-bg text-statusWarn' },
  publicado: { texto: '✓ Validado', clases: 'bg-statusOk-bg text-statusOk' },
};

/** Estado de un cuento: siempre con símbolo y texto, nunca solo color. */
export const EstadoCuento: React.FC<{ estado: Cuento['estado'] }> = ({ estado }) => (
  <span className={`inline-flex px-2.5 py-0.5 rounded-sm text-xs font-semibold whitespace-nowrap ${ESTADOS[estado].clases}`}>
    {ESTADOS[estado].texto}
  </span>
);
