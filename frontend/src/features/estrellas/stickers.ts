import {
  Anchor, Apple, Banana, Bird, Bus, Cake, Car, Carrot, Cat, Cherry, Citrus, Cloud, Clover, Cookie, Crown, Dog, Droplet,
  Flower, Flower2, Fish, Gem, Gift, Grape, Helicopter, IceCreamCone, Leaf, Moon, Music, Orbit, Palette, Panda, PartyPopper,
  Plane, Rabbit, Rainbow, Rocket, Sailboat, Shell, Ship, Shrimp, Snail, Sprout, Squirrel, Star, Sun, Telescope, Tractor,
  Train, TreeDeciduous, TreePine, Trophy, Truck, Turtle, Waves, Bug, Bike, type LucideIcon,
} from 'lucide-react';

export interface StickerInfo {
  id: string;
  nombre: string;
  Icono: LucideIcon;
  /** Color del fondo del sticker (usa los colores de la paleta activa). */
  fondo: string;
  /** Página del álbum a la que pertenece. */
  pagina: string;
}

export interface PaginaAlbum {
  id: string;
  nombre: string;
  Icono: LucideIcon;
}

const COLORES = [
  'bg-btnAprender-bg text-btnAprender-text',
  'bg-btnHablar-bg text-btnHablar-text',
  'bg-btnColores-bg text-btnColores-text',
  'bg-btnLogros-bg text-btnLogros-text',
];

/** Páginas del álbum: cada una agrupa un tema para que el niño sepa qué le falta. */
export const PAGINAS: PaginaAlbum[] = [
  { id: 'animales', nombre: 'Animales', Icono: Cat },
  { id: 'mar', nombre: 'Mar', Icono: Fish },
  { id: 'cielo', nombre: 'Cielo', Icono: Rocket },
  { id: 'jardin', nombre: 'Jardín', Icono: Flower2 },
  { id: 'comida', nombre: 'Comida', Icono: Apple },
  { id: 'viajes', nombre: 'Viajes', Icono: Car },
  { id: 'fiesta', nombre: 'Fiesta', Icono: PartyPopper },
];

const POR_PAGINA: Record<string, [string, LucideIcon][]> = {
  animales: [['Gato', Cat], ['Perro', Dog], ['Conejo', Rabbit], ['Tortuga', Turtle], ['Ardilla', Squirrel], ['Caracol', Snail], ['Panda', Panda], ['Pájaro', Bird]],
  mar: [['Pez', Fish], ['Concha', Shell], ['Olas', Waves], ['Ancla', Anchor], ['Barco', Ship], ['Velero', Sailboat], ['Camarón', Shrimp], ['Gota', Droplet]],
  cielo: [['Cohete', Rocket], ['Luna', Moon], ['Sol', Sun], ['Estrella', Star], ['Órbita', Orbit], ['Telescopio', Telescope], ['Nube', Cloud], ['Arcoíris', Rainbow]],
  jardin: [['Flor', Flower], ['Margarita', Flower2], ['Árbol', TreeDeciduous], ['Pino', TreePine], ['Hoja', Leaf], ['Brote', Sprout], ['Trébol', Clover], ['Bichito', Bug]],
  comida: [['Manzana', Apple], ['Cereza', Cherry], ['Zanahoria', Carrot], ['Plátano', Banana], ['Uvas', Grape], ['Naranja', Citrus], ['Galleta', Cookie], ['Helado', IceCreamCone]],
  viajes: [['Auto', Car], ['Bus', Bus], ['Tren', Train], ['Avión', Plane], ['Bicicleta', Bike], ['Camión', Truck], ['Tractor', Tractor], ['Helicóptero', Helicopter]],
  fiesta: [['Torta', Cake], ['Regalo', Gift], ['Fiesta', PartyPopper], ['Música', Music], ['Pinturas', Palette], ['Corona', Crown], ['Gema', Gem], ['Copa', Trophy]],
};

/**
 * Stickers del álbum. Son dibujos propios hechos con íconos de uso libre (lucide, ISC):
 * no usan personajes con derechos de terceros.
 */
export const STICKERS: StickerInfo[] = PAGINAS.flatMap((p, pi) =>
  POR_PAGINA[p.id].map(([nombre, Icono], i) => ({
    id: `${p.id}-${i}`,
    nombre,
    Icono,
    fondo: COLORES[(pi + i) % COLORES.length],
    pagina: p.id,
  }))
);

const hash = (texto: string) => [...texto].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 11);

/**
 * Orden en que cada niño va ganando los stickers. Es distinto para cada alumno (no todos reciben el
 * mismo primero) pero estable: no cambia entre sesiones, así el álbum no necesita guardarse aparte.
 */
export const ordenDeStickers = (alumnoId: string): number[] => {
  let a = hash(alumnoId);
  const azar = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const orden = STICKERS.map((_, i) => i);
  for (let i = orden.length - 1; i > 0; i -= 1) {
    const j = Math.floor(azar() * (i + 1));
    [orden[i], orden[j]] = [orden[j], orden[i]];
  }
  return orden;
};

/** Inclinación fija por sticker (entre -5° y 5°), para que parezcan pegados a mano y no en fila. */
export const inclinacion = (indice: number) => ((indice * 37) % 11) - 5;
