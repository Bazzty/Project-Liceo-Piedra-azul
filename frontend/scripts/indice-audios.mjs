/**
 * Índice texto → archivo de audio. La app lo consulta antes de usar la voz del navegador: si el texto
 * que va a decir tiene un archivo grabado (una palabra, un número, el nombre de un sticker…), suena el
 * archivo, con la voz del osito.
 *
 *   node scripts/indice-audios.mjs     # reescribe src/shared/config/audiosPorTexto.json
 *
 * Sale de scripts/audios.manifest.json. Una entrada dice `texto` (lo que se graba) y, si la app lo pide
 * con otras palabras, `para` (los textos que deben sonar con ese archivo). `interfaz/` y `personaje/`
 * no entran: esos se piden por clave (ver audiosInterfaz.ts).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Debe dar lo mismo que claveDeTexto en src/shared/audio/claveDeTexto.ts (hay un test que lo comprueba). */
export const claveDeTexto = (texto) =>
  texto
    .normalize('NFC')
    .toLowerCase()
    .replace(/[.,;:!?¡¿«»"()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Carpetas que entran al índice, de más a menos preferida cuando dos archivos dicen lo mismo. */
const CARPETAS = ['textos', 'pictogramas', 'palabras', 'cuentos', 'fonemas'];

export function construirIndice(manifiesto) {
  const indice = {};
  for (const carpeta of CARPETAS) {
    for (const e of manifiesto) {
      if (!e.archivo.startsWith(`${carpeta}/`)) continue;
      for (const t of e.para ?? [e.texto]) {
        const clave = claveDeTexto(t);
        if (clave && !(clave in indice)) indice[clave] = `/audio/${e.archivo}`;
      }
    }
  }
  return Object.fromEntries(Object.entries(indice).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
  const manifiesto = JSON.parse(readFileSync(join(raiz, 'scripts', 'audios.manifest.json'), 'utf8'));
  const indice = construirIndice(manifiesto);
  writeFileSync(join(raiz, 'src', 'shared', 'config', 'audiosPorTexto.json'), `${JSON.stringify(indice, null, 2)}\n`);
  console.log(`Índice: ${Object.keys(indice).length} textos → archivo`);
}
