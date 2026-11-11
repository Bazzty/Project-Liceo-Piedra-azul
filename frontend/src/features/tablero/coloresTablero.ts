import type { ColorTablero } from '@/types';

/** Paleta que elige el profesor. Las clases van completas para que Tailwind las encuentre. */
export const COLORES_TABLERO: Record<ColorTablero, { etiqueta: string; franja: string }> = {
  aprender: { etiqueta: 'Azul', franja: 'bg-btnAprender-bg' },
  hablar: { etiqueta: 'Verde', franja: 'bg-btnHablar-bg' },
  colores: { etiqueta: 'Naranja', franja: 'bg-btnColores-bg' },
  logros: { etiqueta: 'Amarillo', franja: 'bg-btnLogros-bg' },
  alerta: { etiqueta: 'Rojo', franja: 'bg-statusDanger' },
  info: { etiqueta: 'Celeste', franja: 'bg-statusInfo' },
};

export const franjaDeColor = (color: ColorTablero): string => COLORES_TABLERO[color].franja;
