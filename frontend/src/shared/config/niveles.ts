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
  /** Lo que el osito explica antes de entrar al nivel (frases cortas, para decirlas en voz alta). */
  instrucciones: string;
}

/**
 * El camino de aprendizaje, en orden: de las sílabas a las historias. La letra sale de la posición,
 * no del id (los ids son anteriores a este orden y se mantienen para no perder el avance de los niños).
 */
export const NIVELES_CAMINO: NivelCamino[] = [
  {
    id: 'nivel-a',
    letra: 'A',
    nombre: 'Sílabas',
    clave: 'nivel_a',
    imagen: 'mesa',
    color: 'bg-btnAprender-bg text-btnAprender-text',
    instrucciones: 'Vamos a jugar con sílabas. Escucha cada palabra y mira su dibujo. Toca el parlante para oírla otra vez.',
  },
  {
    id: 'nivel-vocales',
    letra: 'B',
    nombre: 'Vocales',
    clave: 'nivel_b',
    imagen: 'oreja',
    color: 'bg-btnLogros-bg text-btnLogros-text',
    instrucciones: 'Vamos a conocer las vocales. Mira la letra, escucha su sonido y descubre palabras que empiezan con ella.',
  },
  {
    id: 'nivel-c',
    letra: 'C',
    nombre: 'Palabras',
    clave: 'nivel_c',
    imagen: 'jugar',
    color: 'bg-btnColores-bg text-btnColores-text',
    instrucciones: 'Vamos a aprender palabras de todos los días. Mira el dibujo y escucha la palabra.',
  },
  {
    id: 'nivel-b',
    letra: 'D',
    nombre: 'Cuentos',
    clave: 'nivel_d',
    imagen: 'libro',
    color: 'bg-btnHablar-bg text-btnHablar-text',
    instrucciones: 'Vamos a leer cuentos. Toca Escuchar para oír cada página y la flecha para seguir.',
  },
  {
    id: 'nivel-d',
    letra: 'E',
    nombre: 'Historias',
    clave: 'nivel_e',
    imagen: 'colegio',
    color: 'bg-btnLogros-bg text-btnLogros-text',
    instrucciones: 'Vamos a leer historias más largas. Escucha con atención y toca la flecha para pasar la página.',
  },
];

export const letraDeNivel = (nivelId: string): string => NIVELES_CAMINO.find((n) => n.id === nivelId)?.letra ?? '?';
