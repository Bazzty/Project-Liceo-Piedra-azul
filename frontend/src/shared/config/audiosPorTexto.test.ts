import { describe, expect, it } from 'vitest';
import { claveDeTexto as claveDeTextoScript, construirIndice } from '../../../scripts/indice-audios.mjs';
import manifiesto from '../../../scripts/audios.manifest.json';
import { claveDeTexto } from '@/shared/audio/claveDeTexto';
import AUDIO_POR_TEXTO from '@/shared/config/audiosPorTexto.json';

const INDICE: Record<string, string> = AUDIO_POR_TEXTO;
// Los archivos reales de public/audio (Vite los lista sin cargarlos)
const ARCHIVOS = new Set(Object.keys(import.meta.glob('/public/audio/**/*.mp3')).map((ruta) => ruta.replace('/public', '')));

describe('audiosPorTexto.json', () => {
  it('está al día con el manifiesto (si falla: npm run audios:indice)', () => {
    expect(INDICE).toEqual(construirIndice(manifiesto));
  });

  it('cada texto del índice apunta a un archivo que existe', () => {
    expect(Object.values(INDICE).filter((url) => !ARCHIVOS.has(url))).toEqual([]);
  });

  it('cada audio del manifiesto tiene su archivo', () => {
    const faltan = manifiesto.map((e) => `/audio/${e.archivo}`).filter((url) => !ARCHIVOS.has(url));

    expect(faltan).toEqual([]);
  });

  it('el normalizador de la app y el del script dan lo mismo', () => {
    for (const t of ['  ¡COMO!  ', 'Imán', 'Mis Primeras Palabras (M, L, S, P, D)', 'Lunes: ¡jugaste!', 'a  b', '«Hola», dijo.']) {
      expect(claveDeTexto(t)).toBe(claveDeTextoScript(t));
    }
  });

  it('las claves ya están normalizadas (si no, nunca se encontrarían)', () => {
    for (const clave of Object.keys(INDICE)) expect(claveDeTexto(clave)).toBe(clave);
  });

  it('cada dígito del ingreso del niño tiene su grabación', () => {
    expect([...'0123456789'].filter((d) => !Object.hasOwn(INDICE, claveDeTexto(d)))).toEqual([]);
  });

  it('el manifiesto no repite archivos ni deja textos vacíos', () => {
    const nombres = manifiesto.map((e) => e.archivo);

    expect(new Set(nombres).size).toBe(nombres.length);
    expect(manifiesto.every((e) => e.texto.trim().length > 0)).toBe(true);
  });
});
