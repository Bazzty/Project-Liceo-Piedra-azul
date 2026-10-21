/**
 * Vínculo entre los niveles del camino y el currículum de Educación Parvularia (Bases Curriculares 2018,
 * ámbito Comunicación Integral, núcleo Lenguaje Verbal, segundo nivel de transición / Kinder).
 *
 * ATENCIÓN: solo el texto del OA 3 está verificado en una fuente oficial. Los demás son descripciones del
 * eje con nuestras palabras (sin número de OA) y deben revisarlos las docentes del PIE contra el documento
 * oficial: https://www.curriculumnacional.cl (Bases Curriculares de la Educación Parvularia).
 */
export interface EjeCurricular {
  id: string;
  eje: string;
  /** Número de OA, solo si está verificado. */
  oa: string | null;
  texto: string;
  /** El texto es el oficial, tal cual. Si es false, es una descripción nuestra por verificar. */
  verificado: boolean;
  /** Niveles del camino (ids) donde se trabaja. */
  niveles: string[];
  /** Juegos que lo trabajan. */
  juegos: string[];
}

export const NOMBRE_JUEGO: Record<string, string> = {
  escucha: 'Escucha y elige',
  lee: 'Lee y elige',
  sonido: '¿Con qué empieza?',
  memoria: 'Memoria de parejas',
  completa: 'Completa la frase',
  ordena: 'Ordena la oración',
};

export const EJES_CURRICULARES: EjeCurricular[] = [
  {
    id: 'fonologica',
    eje: 'Conciencia fonológica',
    oa: 'OA 3',
    verificado: true,
    texto: 'Descubrir en contextos lúdicos, atributos fonológicos de palabras conocidas, tales como conteo de palabras, segmentación y conteo de sílabas, identificación de sonidos finales e iniciales.',
    niveles: ['nivel-vocales', 'nivel-a'],
    juegos: ['sonido', 'memoria'],
  },
  {
    id: 'lectura-inicial',
    eje: 'Iniciación a la lectura',
    oa: null,
    verificado: false,
    texto: 'Reconocer palabras escritas conocidas y asociarlas con su imagen y su significado.',
    niveles: ['nivel-a', 'nivel-c'],
    juegos: ['lee', 'memoria'],
  },
  {
    id: 'comprension',
    eje: 'Comprensión de textos escuchados',
    oa: null,
    verificado: false,
    texto: 'Comprender el contenido explícito de textos literarios y no literarios a partir de la escucha atenta.',
    niveles: ['nivel-b', 'nivel-d'],
    juegos: ['escucha', 'completa', 'ordena'],
  },
  {
    id: 'vocabulario',
    eje: 'Vocabulario y comunicación oral',
    oa: null,
    verificado: false,
    texto: 'Ampliar su vocabulario y comunicarse oralmente con palabras nuevas y adecuadas a cada situación.',
    niveles: ['nivel-c', 'nivel-b'],
    juegos: ['escucha', 'memoria'],
  },
];
