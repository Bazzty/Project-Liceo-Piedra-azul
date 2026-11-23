/** Id aleatorio de 32 caracteres. `crypto.randomUUID` solo existe con HTTPS o localhost; esto funciona también por la IP de la red local. */
export const idUnico = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('');
