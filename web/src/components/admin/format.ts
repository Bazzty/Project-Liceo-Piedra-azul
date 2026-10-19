import type { Cuento, Progreso } from '../../db/db';

/** Quita tildes y pasa a minúsculas (para comparar palabras). */
export const normalizar = (texto: string): string =>
  texto.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const hora = (d: Date) =>
  d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });

/** "Hoy, 10:40" · "Ayer, 18:15" · "12/10, 09:30" */
export const formatearFecha = (iso: string): string => {
  const fecha = new Date(iso);
  const hoy = new Date();
  const dia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDias = Math.round((dia(hoy) - dia(fecha)) / 86_400_000);
  if (diffDias === 0) return `Hoy, ${hora(fecha)}`;
  if (diffDias === 1) return `Ayer, ${hora(fecha)}`;
  const dd = String(fecha.getDate()).padStart(2, '0');
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}, ${hora(fecha)}`;
};

/** ¿La fecha ISO cae dentro de los últimos `dias` días? */
export const esDeLosUltimosDias = (iso: string, dias: number): boolean =>
  Date.now() - new Date(iso).getTime() <= dias * 86_400_000;

/** Porcentaje de avance (0-100) de un progreso en un cuento. */
export const porcentajeAvance = (progreso: Progreso | undefined, cuento: Cuento): number => {
  if (!progreso) return 0;
  if (progreso.completado) return 100;
  const total = cuento.paginas.length || 1;
  return Math.min(100, Math.round(((progreso.paginaActual ?? 0) / total) * 100));
};
