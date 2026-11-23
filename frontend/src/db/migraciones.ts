import type { Table } from 'dexie';
import { conImagenesDeCarpeta, ID_PLANTILLA_GENERAL } from '@/features/tablero/plantillaGeneral';
import type { Nivel, Pictograma, Tablero } from '@/types';

/**
 * Sílabas pasa a ser el nivel A y Vocales el B. Solo se intercambian letra y orden: los ids (de los que
 * cuelga el avance de los niños) y los nombres que haya editado la docente no se tocan.
 */
export async function silabasAntesQueVocales(niveles: Pick<Table<Nivel, string>, 'get' | 'update'>) {
  const vocales = await niveles.get('nivel-vocales');
  const silabas = await niveles.get('nivel-a');
  if (vocales?.codigo !== 'A' || silabas?.codigo !== 'B') return;
  await niveles.update('nivel-a', { codigo: vocales.codigo, orden: vocales.orden });
  await niveles.update('nivel-vocales', { codigo: silabas.codigo, orden: silabas.orden });
}

/**
 * Pone su dibujo a las carpetas de la plantilla general que se guardaron antes de que lo tuvieran. Corre una sola vez
 * (al subir de versión): si la docente después le quita el dibujo a una carpeta, no vuelve a aparecer al recargar.
 * Sin plantilla guardada o sin catálogo no hace nada: un navegador nuevo ya recibe la plantilla completa.
 */
export async function imagenesDeCarpetaUnaVez(
  tableros: Pick<Table<Tablero, string>, 'get' | 'put'>,
  pictogramas: Pick<Table<Pictograma>, 'toArray'>,
) {
  const principal = await tableros.get(ID_PLANTILLA_GENERAL);
  if (!principal) return;
  const completo = conImagenesDeCarpeta(principal, await pictogramas.toArray());
  if (completo !== principal) await tableros.put(completo);
}
