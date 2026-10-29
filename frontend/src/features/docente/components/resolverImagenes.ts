import { listarPictogramas } from '@/api';
import { normalizar } from '@/features/docente/components/format';
import { fetchArasaacPictogramId, getArasaacImageUrl } from '@/features/tablero/arasaac';

const existeImagen = async (url: string) => {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    return r.ok && (r.headers.get('content-type') ?? '').startsWith('image');
  } catch {
    return false;
  }
};

/**
 * Busca un dibujo para cada palabra: primero los que ya están en el proyecto (funciona sin internet) y,
 * si no hay, en ARASAAC. Devuelve la dirección de la imagen o undefined si no encontró ninguna.
 */
export async function resolverImagenes(palabras: string[]): Promise<Map<string, string | undefined>> {
  const catalogo = new Map((await listarPictogramas()).map((p) => [normalizar(p.palabra), p.imagenUrl]));
  const resultado = new Map<string, string | undefined>();
  for (const palabra of palabras) {
    const clave = normalizar(palabra);
    const local = `/pictogramas/arasaac/${clave}.png`;
    let url = catalogo.get(clave);
    if (!url && (await existeImagen(local))) url = local;
    if (!url) {
      const id = await fetchArasaacPictogramId(palabra);
      if (id) url = getArasaacImageUrl(id);
    }
    resultado.set(palabra, url);
  }
  return resultado;
}
