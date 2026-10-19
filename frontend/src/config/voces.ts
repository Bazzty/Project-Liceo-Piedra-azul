import type { VozId } from '../db/db';

export interface VozConfig {
  id: VozId;
  nombre: string;
  descripcion: string;
}

export const VOCES_CONFIG: VozConfig[] = [
  { id: 'catalina-cl', nombre: 'Catalina', descripcion: 'Voz chilena generada con IA' },
  { id: 'profesora-clonada', nombre: 'Voz de la educadora', descripcion: 'Voz clonada de la profesora' },
];

export const VOZ_POR_DEFECTO: VozId = 'catalina-cl';
