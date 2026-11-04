import { normalizar } from '@/features/docente/components/format';

/** Mismos límites que valida el servidor (GenerarCuentoRequest). */
export const MAX_PALABRAS = 6;
const LETRAS = /^\p{L}[\p{L} ]*$/u;

/** Una palabra que el servidor aceptaría: de 2 a 30 caracteres, solo letras y espacios. */
export const esPalabraValida = (palabra: string) => palabra.length >= 2 && palabra.length <= 30 && LETRAS.test(palabra);

/** Separa el texto del campo (por comas) en palabras únicas. Devuelve también el motivo si algo no sirve. */
export const leerPalabras = (texto: string): { palabras: string[]; error: string | null } => {
  const vistas = new Set<string>();
  const palabras: string[] = [];
  for (const parte of texto.split(/[,;\n]/)) {
    const palabra = parte.replace(/\s+/g, ' ').trim();
    if (!palabra || vistas.has(normalizar(palabra))) continue;
    vistas.add(normalizar(palabra));
    palabras.push(palabra);
  }
  if (palabras.length > MAX_PALABRAS) return { palabras, error: `Puedes pedir hasta ${MAX_PALABRAS} palabras.` };
  const mala = palabras.find((p) => !esPalabraValida(p));
  if (mala) return { palabras, error: `«${mala}» no sirve: usa solo letras, de 2 a 30, separadas por comas.` };
  return { palabras, error: null };
};

/** Si la palabra (o frase) aparece completa en el texto, sin importar mayúsculas ni tildes. */
export const apareceEnTexto = (texto: string, palabra: string): boolean => {
  const limpio = (t: string) => ` ${normalizar(t).replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ')} `;
  return limpio(texto).includes(limpio(palabra));
};
