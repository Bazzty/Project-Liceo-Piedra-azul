import { generarAudio } from '@/api/servidor';
import type { CuentoPagina } from '@/types';

export interface AudiosDeCuento {
  /** URL del audio de cada página, por su texto. */
  urls: Record<string, string>;
  /** Alguna página se generó con la voz local de respaldo. */
  respaldo: boolean;
}

/**
 * Genera el audio de cada página, una a la vez (no se manda todo junto para cuidar la cuota de la API).
 * Si una falla se corta con su error; las ya generadas quedan en el servidor, así que reintentar no gasta de nuevo.
 */
export async function generarAudiosDeCuento(
  paginas: CuentoPagina[],
  alAvanzar?: (hechas: number, total: number) => void,
): Promise<AudiosDeCuento> {
  const textos = [...new Set(paginas.map((p) => p.textoCompleto))];
  const urls: Record<string, string> = {};
  let respaldo = false;

  alAvanzar?.(0, textos.length);
  for (const [i, texto] of textos.entries()) {
    const audio = await generarAudio(texto);
    urls[texto] = audio.url;
    respaldo ||= audio.respaldo;
    alAvanzar?.(i + 1, textos.length);
  }
  return { urls, respaldo };
}

/** Pone a cada página el audio de su texto. Si la docente la cambió mientras se generaba, esa página no lo recibe. */
export const conAudios = (paginas: CuentoPagina[], urls: Record<string, string>): CuentoPagina[] =>
  paginas.map((p) => (urls[p.textoCompleto] ? { ...p, audioPaginaUrl: urls[p.textoCompleto] } : p));
