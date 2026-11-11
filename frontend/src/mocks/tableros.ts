import { db } from '@/db/db';
import { CATEGORIAS_INICIALES, construirPlantillaGeneral, ID_PLANTILLA_GENERAL } from '@/features/tablero/plantillaGeneral';

/**
 * Carga las categorías y la plantilla general del tablero si faltan (primer inicio o navegador que venía de
 * una versión anterior). No pisa nada: si la docente ya cambió categorías, se respetan.
 * Debe correr después de sembrar los pictogramas.
 */
export async function sembrarTableros() {
  if ((await db.categorias.count()) === 0) await db.categorias.bulkPut(CATEGORIAS_INICIALES);
  if (!(await db.tableros.get(ID_PLANTILLA_GENERAL))) {
    await db.tableros.bulkPut(construirPlantillaGeneral(await db.pictogramas.toArray()));
  }
}
