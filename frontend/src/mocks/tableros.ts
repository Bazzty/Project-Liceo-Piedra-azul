import { db } from '@/db/db';
import { CATEGORIAS_INICIALES, conImagenesDeCarpeta, construirPlantillaGeneral, ID_PLANTILLA_GENERAL } from '@/features/tablero/plantillaGeneral';

/**
 * Carga las categorías y la plantilla general del tablero si faltan (primer inicio o navegador que venía de
 * una versión anterior). No pisa nada: si la docente ya cambió categorías o la plantilla, se respeta; solo se
 * rellena el dibujo de las carpetas que aún no lo tenían. Debe correr después de sembrar los pictogramas.
 */
export async function sembrarTableros() {
  if ((await db.categorias.count()) === 0) await db.categorias.bulkPut(CATEGORIAS_INICIALES);
  const catalogo = await db.pictogramas.toArray();
  const principal = await db.tableros.get(ID_PLANTILLA_GENERAL);
  if (!principal) {
    await db.tableros.bulkPut(construirPlantillaGeneral(catalogo));
    return;
  }
  const completo = conImagenesDeCarpeta(principal, catalogo);
  if (completo !== principal) await db.tableros.put(completo);
}
