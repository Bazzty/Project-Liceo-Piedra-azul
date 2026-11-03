import type { Table } from 'dexie';
import type { Nivel } from '@/types';

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
