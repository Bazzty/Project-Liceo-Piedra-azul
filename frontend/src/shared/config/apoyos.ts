import type { ApoyoId } from '@/types';

export interface ApoyoConfig {
  id: ApoyoId;
  nombre: string;
  descripcion: string;
  /** Ejemplo de motivo, para orientar a la docente al escribirlo. */
  ejemplo: string;
}

/** Apoyos que la docente puede dejar configurados por niño; se aplican solos cuando él entra. */
export const APOYOS: ApoyoConfig[] = [
  { id: 'vozLenta', nombre: 'Voz lenta', descripcion: 'Todo se dice más despacio.', ejemplo: 'Necesita más tiempo para procesar lo que escucha' },
  { id: 'sinMovimiento', nombre: 'Sin movimiento', descripcion: 'La pantalla queda quieta, sin animaciones.', ejemplo: 'Se sobreestimula con el movimiento' },
  { id: 'barrido', nombre: 'Un solo botón', descripcion: 'Las opciones se recorren solas y se elige la marcada.', ejemplo: 'Dificultad motora para tocar con precisión' },
  { id: 'pocasOpciones', nombre: 'Pocas opciones', descripcion: 'Los juegos muestran dos opciones en vez de tres.', ejemplo: 'Se abruma con muchas opciones' },
];
