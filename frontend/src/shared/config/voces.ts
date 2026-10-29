import type { VozId } from '@/types';

export interface VozConfig {
  id: VozId;
  nombre: string;
  descripcion: string;
}

export const VOCES_CONFIG: VozConfig[] = [
  { id: 'catalina-cl', nombre: 'Catalina', descripcion: 'Voz chilena generada con IA' },
];

export const VOZ_POR_DEFECTO: VozId = 'catalina-cl';
