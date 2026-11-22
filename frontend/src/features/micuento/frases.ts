import { audioDeTexto } from '@/shared/audio/audioDeTexto';
import type { MiCuento } from '@/types';

export type PasoCuento = 'quien' | 'donde' | 'accion';

export interface OpcionCuento {
  id: string;
  /** Archivo del catálogo local (public/pictogramas/arasaac/). Funciona sin internet. */
  pictograma: string;
  /** Texto alternativo del pictograma. */
  alt: string;
  /** Frase que lee el osito. Cada una tiene su grabación (scripts/audios.manifest.json). */
  frase: string;
}

/**
 * Las frases son fijas, revisadas por adultos y no dependen unas de otras: cualquier quién, dónde y qué hace
 * forman un cuento correcto (por eso 4 + 4 + 4 + 1 grabaciones cubren las 64 combinaciones). No lleva
 * adjetivos ni pronombres que dependan del género del personaje. Narración en pasado.
 * El orden importa: con «pocas opciones» solo se muestran las dos primeras de cada paso.
 */
export const OPCIONES: Record<PasoCuento, OpcionCuento[]> = {
  quien: [
    { id: 'nina', pictograma: 'nina', alt: 'Una niña', frase: 'Había una vez una niña.' },
    { id: 'gato', pictograma: 'gato', alt: 'Un gato', frase: 'Había una vez un gato.' },
    { id: 'sapo', pictograma: 'sapo', alt: 'Un sapo', frase: 'Había una vez un sapo.' },
    { id: 'elefante', pictograma: 'elefante', alt: 'Un elefante', frase: 'Había una vez un elefante.' },
  ],
  donde: [
    { id: 'colegio', pictograma: 'colegio', alt: 'El colegio', frase: 'Estaba en el colegio.' },
    { id: 'isla', pictograma: 'isla', alt: 'Una isla', frase: 'Estaba en una isla.' },
    { id: 'sala', pictograma: 'sala', alt: 'La sala', frase: 'Estaba en la sala.' },
    { id: 'cama', pictograma: 'cama', alt: 'Su cama', frase: 'Estaba en su cama.' },
  ],
  accion: [
    { id: 'saltar', pictograma: 'saltar', alt: 'Saltar', frase: 'Allí saltó muy alto.' },
    { id: 'sopa', pictograma: 'sopa', alt: 'Comer sopa', frase: 'Allí comió una sopa muy rica.' },
    { id: 'jugar', pictograma: 'jugar', alt: 'Jugar con un amigo', frase: 'Allí jugó con un amigo.' },
    { id: 'dormir', pictograma: 'dormir', alt: 'Dormir una siesta', frase: 'Allí durmió una siesta.' },
  ],
};

export const FINAL: OpcionCuento = { id: 'final', pictograma: 'feliz', alt: 'Un día muy feliz', frase: 'Y fue un día muy feliz. Fin.' };

export const PASOS: PasoCuento[] = ['quien', 'donde', 'accion'];

export type Eleccion = Pick<MiCuento, PasoCuento>;

export const urlPictograma = (o: OpcionCuento) => `/pictogramas/arasaac/${o.pictograma}.png`;

export const opcionDe = (paso: PasoCuento, id: string): OpcionCuento | undefined => OPCIONES[paso].find((o) => o.id === id);

/** Las cuatro partes del cuento, en orden, o `null` si falta una (un dato guardado que ya no existe). */
export const partesDelCuento = (eleccion: Eleccion): OpcionCuento[] | null => {
  const partes = PASOS.map((p) => opcionDe(p, eleccion[p]));
  return partes.every(Boolean) ? [...(partes as OpcionCuento[]), FINAL] : null;
};

export const audioDe = (o: OpcionCuento) => audioDeTexto(o.frase);

/** Resumen corto para la docente: «Creó su cuento: Un gato · La sala · Saltar». */
export const resumenParaDocente = (eleccion: Eleccion): string => {
  const partes = partesDelCuento(eleccion);
  return `Creó su cuento: ${partes ? partes.slice(0, 3).map((o) => o.alt).join(' · ') : 'cuento de opciones'}`;
};
