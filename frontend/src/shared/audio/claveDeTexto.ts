/**
 * Forma normalizada de un texto para buscarlo en el índice de audios (minúsculas, sin puntuación ni
 * espacios de más). Debe dar lo mismo que claveDeTexto en scripts/indice-audios.mjs: hay un test que lo comprueba.
 */
export const claveDeTexto = (texto: string): string =>
  texto
    .normalize('NFC')
    .toLowerCase()
    .replace(/[.,;:!?¡¿«»"()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
