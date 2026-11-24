/** Lado mayor, en píxeles, con que se guarda un dibujo: de sobra para una tarjeta del tablero y liviano para el navegador. */
export const LADO_MAXIMO_DEL_DIBUJO = 400;

/** Una foto de más de esto no se acepta: ni siquiera se alcanzaría a abrir en un teléfono antiguo. */
export const BYTES_MAXIMOS_DE_FOTO = 10 * 1024 * 1024;

/** El tamaño que cabe en `maximo` sin deformar la imagen y sin agrandarla. */
export function tamanoAjustado(ancho: number, alto: number, maximo: number): { ancho: number; alto: number } {
  const mayor = Math.max(ancho, alto);
  if (mayor <= maximo || mayor <= 0) return { ancho, alto };
  const razon = maximo / mayor;
  return { ancho: Math.max(1, Math.round(ancho * razon)), alto: Math.max(1, Math.round(alto * razon)) };
}

/** `null` si el archivo sirve; si no, qué le diría la pantalla a la docente. */
export function motivoDeRechazo(archivo: Pick<File, 'type' | 'size'>): string | null {
  if (!archivo.type.startsWith('image/')) return 'Ese archivo no es una imagen. Elige una foto (JPG, PNG o WebP).';
  if (archivo.size > BYTES_MAXIMOS_DE_FOTO) return 'La foto pesa más de 10 MB. Elige una más pequeña.';
  return null;
}

/**
 * Reduce una imagen y la devuelve como dato WebP listo para guardar en el navegador. Al dibujarla de nuevo se pierden
 * los metadatos (ubicación, fecha, cámara), y se respeta la orientación de la foto; la transparencia se conserva.
 */
export async function reducirImagen(origen: Blob, maximo = LADO_MAXIMO_DEL_DIBUJO): Promise<string> {
  const imagen = await createImageBitmap(origen);
  try {
    const { ancho, alto } = tamanoAjustado(imagen.width, imagen.height, maximo);
    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    const contexto = lienzo.getContext('2d');
    if (!contexto) throw new Error('El navegador no puede preparar la imagen');
    contexto.drawImage(imagen, 0, 0, ancho, alto);
    return lienzo.toDataURL('image/webp', 0.85);
  } finally {
    imagen.close();
  }
}

/**
 * Baja un dibujo de internet y lo deja guardado como dato, para que se vea sin conexión. `null` si no se pudo
 * (sin internet, o el sitio no permite bajarlo desde la app): en ese caso el dibujo sigue funcionando con conexión.
 */
export async function descargarDibujo(url: string, reducir: (imagen: Blob) => Promise<string> = reducirImagen): Promise<string | null> {
  try {
    const respuesta = await fetch(url);
    return respuesta.ok ? await reducir(await respuesta.blob()) : null;
  } catch {
    return null;
  }
}
