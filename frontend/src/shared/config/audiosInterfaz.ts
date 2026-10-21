/**
 * Audios grabados de la interfaz del niño (la voz suave del proyecto).
 *
 * Los que ya existen apuntan a archivos reales. Los marcados "por grabar" esperan su archivo en
 * public/audio/interfaz/: mientras no exista, la app usa la voz del navegador como respaldo.
 * La lista completa de frases para grabar está en docs/audios-interfaz.md.
 */
export const AUDIOS_INTERFAZ = {
  // Ya grabados
  hola: '/audio/personaje/bienvenida.mp3',
  felicitaciones: '/audio/personaje/felicitaciones.mp3',
  despedida: '/audio/personaje/despedida.mp3',
  espera: '/audio/personaje/esperando_profesora.mp3',

  // Por grabar (public/audio/interfaz/<clave>.mp3)
  toca_numeros: '/audio/interfaz/toca_numeros.mp3',
  intentemos: '/audio/interfaz/intentemos.mp3',
  descansemos: '/audio/interfaz/descansemos.mp3',
  leer: '/audio/interfaz/leer.mp3',
  hablar: '/audio/interfaz/hablar.mp3',
  estrellas: '/audio/interfaz/estrellas.mp3',
  elige_nivel: '/audio/interfaz/elige_nivel.mp3',
  elige_cuento: '/audio/interfaz/elige_cuento.mp3',
  nivel_a: '/audio/interfaz/nivel_a.mp3',
  nivel_b: '/audio/interfaz/nivel_b.mp3',
  nivel_c: '/audio/interfaz/nivel_c.mp3',
  nivel_d: '/audio/interfaz/nivel_d.mp3',
  nivel_e: '/audio/interfaz/nivel_e.mp3',
  pronto: '/audio/interfaz/pronto.mp3',
  respira: '/audio/interfaz/respira.mp3',
  sigues_ahi: '/audio/interfaz/sigues_ahi.mp3',
} as const;

export type ClaveAudio = keyof typeof AUDIOS_INTERFAZ;
