import { describe, expect, it } from 'vitest';
import manifiesto from '../../../scripts/audios.manifest.json';
import { audioDe, FINAL, OPCIONES, partesDelCuento, PASOS, resumenParaDocente, urlPictograma, type OpcionCuento } from '@/features/micuento/frases';

const TODAS: OpcionCuento[] = [...PASOS.flatMap((p) => OPCIONES[p]), FINAL];
// Archivos reales de public/ (Vite los lista sin cargarlos)
const ARCHIVOS = new Set(Object.keys(import.meta.glob('/public/{audio,pictogramas}/**/*.{mp3,png}')).map((ruta) => ruta.replace('/public', '')));

describe('frases de Mi cuento', () => {
  it('son 4 + 4 + 4 y un final: con 13 grabaciones se cubren las 64 combinaciones', () => {
    expect(PASOS.map((p) => OPCIONES[p].length)).toEqual([4, 4, 4]);
    expect(TODAS).toHaveLength(13);
    expect(new Set(TODAS.map((o) => o.frase)).size).toBe(13);
  });

  it('cada frase tiene su grabación con la voz del osito y dice exactamente lo mismo que el manifiesto', () => {
    for (const o of TODAS) {
      const url = audioDe(o);
      expect(url, o.frase).toBeDefined();
      expect(ARCHIVOS.has(url as string), url).toBe(true);
      expect(manifiesto.find((a) => `/audio/${a.archivo}` === url)?.texto).toBe(o.frase);
    }
  });

  it('cada pictograma existe en el catálogo local (funciona sin internet) y trae texto alternativo', () => {
    for (const o of TODAS) {
      expect(ARCHIVOS.has(urlPictograma(o)), urlPictograma(o)).toBe(true);
      expect(o.alt.trim().length).toBeGreaterThan(2);
    }
  });

  it('el orden deja dos opciones bien distintas primero (para «pocas opciones»)', () => {
    for (const p of PASOS) expect(OPCIONES[p][0].pictograma).not.toBe(OPCIONES[p][1].pictograma);
  });

  it('cada parte cumple su forma: sirve con cualquier otra elección, sin género ni tiempos mezclados', () => {
    for (const o of OPCIONES.quien) expect(o.frase).toMatch(/^Había una vez (un|una) \p{L}+\.$/u);
    for (const o of OPCIONES.donde) expect(o.frase).toMatch(/^Estaba en (el|la|una|su) \p{L}+\.$/u);
    for (const o of OPCIONES.accion) expect(o.frase).toMatch(/^Allí \p{L}+ó [\p{L} ]+\.$/u);
    // Nada que dependa del género o del número del personaje: pronombres, participios ni adjetivos concordados
    const dependeDelPersonaje = /\b(él|ella|ellos|ellas|lo|le|se|dormid[oa]s?|content[oa]s?|cansad[oa]s?|sol[oa]s?)\b/iu;
    for (const o of [...OPCIONES.donde, ...OPCIONES.accion, FINAL]) expect(o.frase, o.frase).not.toMatch(dependeDelPersonaje);
  });

  it('las 64 combinaciones forman un cuento natural de cuatro frases', () => {
    const cuentos = new Set<string>();
    for (const q of OPCIONES.quien) {
      for (const d of OPCIONES.donde) {
        for (const a of OPCIONES.accion) {
          const partes = partesDelCuento({ quien: q.id, donde: d.id, accion: a.id });
          expect(partes).toHaveLength(4);
          const texto = (partes ?? []).map((p) => p.frase).join(' ');
          expect(texto).toMatch(/^Había una vez (un|una) \p{L}+\. Estaba en [\p{L} ]+\. Allí \p{L}+ó [\p{L} ]+\. Y fue un día muy feliz\. Fin\.$/u);
          expect(texto).not.toMatch(/ {2}|\.\./);
          cuentos.add(texto);
        }
      }
    }
    expect(cuentos.size).toBe(64);
  });

  it('un cuento guardado con una opción que ya no existe no rompe la pantalla', () => {
    expect(partesDelCuento({ quien: 'dragon', donde: 'isla', accion: 'saltar' })).toBeNull();
    expect(resumenParaDocente({ quien: 'dragon', donde: 'isla', accion: 'saltar' })).toBe('Creó su cuento: cuento de opciones');
  });

  it('el registro para la docente nombra las elecciones, sin datos del niño', () => {
    expect(resumenParaDocente({ quien: 'gato', donde: 'sala', accion: 'saltar' })).toBe('Creó su cuento: Un gato · La sala · Saltar');
  });
});
