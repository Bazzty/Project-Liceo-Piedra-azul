import { describe, expect, it } from 'vitest';
import manifiesto from '../../../scripts/audios.manifest.json';
import { AUDIOS_INTERFAZ } from '@/shared/config/audiosInterfaz';
import { letraDeNivel, NIVELES_CAMINO } from '@/shared/config/niveles';

describe('NIVELES_CAMINO', () => {
  it('empieza por sílabas y sigue con vocales', () => {
    expect(NIVELES_CAMINO.map((n) => n.nombre)).toEqual(['Sílabas', 'Vocales', 'Palabras', 'Cuentos', 'Historias']);
    expect(letraDeNivel('nivel-a')).toBe('A');
    expect(letraDeNivel('nivel-vocales')).toBe('B');
  });

  it('cada nivel trae instrucciones para que el osito las diga', () => {
    for (const nivel of NIVELES_CAMINO) expect(nivel.instrucciones.trim().length).toBeGreaterThan(0);
  });

  it('la grabación de las instrucciones dice lo mismo que el texto de la burbuja', () => {
    for (const nivel of NIVELES_CAMINO) {
      const archivo = AUDIOS_INTERFAZ[nivel.claveInstrucciones].replace('/audio/', '');
      expect(manifiesto.find((a) => a.archivo === archivo)?.texto).toBe(nivel.instrucciones);
    }
  });
});
