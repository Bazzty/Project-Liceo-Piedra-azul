import type { ClaveAudio } from '@/shared/config/audiosInterfaz';

export interface NivelCamino {
  /** Id del nivel en la base de datos. */
  id: string;
  letra: string;
  nombre: string;
  clave: ClaveAudio;
  /** Pictograma local que ilustra la parada. */
  imagen: string;
  color: string;
}

/**
 * El camino de aprendizaje, en orden: de las vocales a las historias. La letra sale de la posición,
 * no del id (los ids son anteriores a este orden y se mantienen para no perder el avance de los niños).
 */
export const NIVELES_CAMINO: NivelCamino[] = [
  { id: 'nivel-vocales', letra: 'A', nombre: 'Vocales', clave: 'nivel_a', imagen: 'oreja', color: 'bg-btnLogros-bg text-btnLogros-text' },
  { id: 'nivel-a', letra: 'B', nombre: 'Sílabas', clave: 'nivel_b', imagen: 'mesa', color: 'bg-btnAprender-bg text-btnAprender-text' },
  { id: 'nivel-c', letra: 'C', nombre: 'Palabras', clave: 'nivel_c', imagen: 'jugar', color: 'bg-btnColores-bg text-btnColores-text' },
  { id: 'nivel-b', letra: 'D', nombre: 'Cuentos', clave: 'nivel_d', imagen: 'libro', color: 'bg-btnHablar-bg text-btnHablar-text' },
  { id: 'nivel-d', letra: 'E', nombre: 'Historias', clave: 'nivel_e', imagen: 'colegio', color: 'bg-btnLogros-bg text-btnLogros-text' },
];

export const letraDeNivel = (nivelId: string): string => NIVELES_CAMINO.find((n) => n.id === nivelId)?.letra ?? '?';
