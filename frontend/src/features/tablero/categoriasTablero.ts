import { Footprints, HandHelping, LayoutGrid, Package, Smile, Sparkles, Star, Users, Zap, type LucideIcon } from 'lucide-react';

export interface CategoriaTablero {
  id: string;
  nombre: string;
  Icono: LucideIcon;
  /** Color de la franja de cada pictograma: así el niño reconoce la categoría sin leer. */
  franja: string;
}

export const CATEGORIAS_TABLERO: CategoriaTablero[] = [
  { id: 'rapidas', nombre: 'Frases', Icono: Zap, franja: 'bg-btnColores-bg text-btnColores-text' },
  { id: 'frecuentes', nombre: 'Mis palabras', Icono: Star, franja: 'bg-accent text-onAccent' },
  { id: 'todos', nombre: 'Todo', Icono: LayoutGrid, franja: 'bg-surface text-primary' },
  { id: 'basicas', nombre: 'Siempre', Icono: Sparkles, franja: 'bg-btnAprender-bg text-btnAprender-text' },
  { id: 'necesidades', nombre: 'Necesito', Icono: HandHelping, franja: 'bg-statusDanger text-onStatus' },
  { id: 'emociones', nombre: 'Siento', Icono: Smile, franja: 'bg-btnColores-bg text-btnColores-text' },
  { id: 'personas', nombre: 'Personas', Icono: Users, franja: 'bg-btnLogros-bg text-btnLogros-text' },
  { id: 'acciones', nombre: 'Hago', Icono: Footprints, franja: 'bg-btnHablar-bg text-btnHablar-text' },
  { id: 'objetos', nombre: 'Cosas', Icono: Package, franja: 'bg-btnAprender-bg text-btnAprender-text' },
];

export const franjaDe = (categoria: string): string => CATEGORIAS_TABLERO.find((c) => c.id === categoria)?.franja ?? 'bg-surface text-primary';

/** Frases ya armadas (con los pictogramas del tablero): un toque y se dicen. Estilo telegráfico, como en la comunicación aumentativa. */
export const FRASES_LISTAS: string[][] = [
  ['pic-yo', 'pic-quiero', 'pic-agua'],
  ['pic-yo', 'pic-quiero', 'pic-comer'],
  ['pic-yo', 'pic-quiero', 'pic-jugar'],
  ['pic-quiero', 'pic-bano'],
  ['pic-quiero', 'pic-mas'],
  ['pic-yo', 'pic-feliz'],
  ['pic-yo', 'pic-triste'],
  ['pic-yo', 'pic-cansado'],
  ['pic-yo', 'pic-dolor'],
  ['pic-gracias'],
  ['pic-terminado'],
  ['pic-quiero', 'pic-abrazar'],
];
