import { Bird, Cat, Dog, Fish, Flower2, Rabbit, Rocket, Turtle, type LucideIcon } from 'lucide-react';

export interface StickerInfo {
  id: string;
  nombre: string;
  Icono: LucideIcon;
  /** Color del fondo del sticker (usa los colores de la paleta activa). */
  fondo: string;
}

/**
 * Stickers del álbum. Son dibujos propios hechos con íconos de uso libre (lucide, ISC):
 * no usan personajes con derechos de terceros.
 */
export const STICKERS: StickerInfo[] = [
  { id: 'gato', nombre: 'Gato', Icono: Cat, fondo: 'bg-btnAprender-bg text-btnAprender-text' },
  { id: 'perro', nombre: 'Perro', Icono: Dog, fondo: 'bg-btnHablar-bg text-btnHablar-text' },
  { id: 'pajaro', nombre: 'Pájaro', Icono: Bird, fondo: 'bg-btnColores-bg text-btnColores-text' },
  { id: 'pez', nombre: 'Pez', Icono: Fish, fondo: 'bg-btnLogros-bg text-btnLogros-text' },
  { id: 'conejo', nombre: 'Conejo', Icono: Rabbit, fondo: 'bg-btnAprender-bg text-btnAprender-text' },
  { id: 'tortuga', nombre: 'Tortuga', Icono: Turtle, fondo: 'bg-btnHablar-bg text-btnHablar-text' },
  { id: 'flor', nombre: 'Flor', Icono: Flower2, fondo: 'bg-btnColores-bg text-btnColores-text' },
  { id: 'cohete', nombre: 'Cohete', Icono: Rocket, fondo: 'bg-btnLogros-bg text-btnLogros-text' },
];
