// Debe ir antes que Dexie: pone una IndexedDB en memoria (jsdom no trae una).
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { LeerParaTodosDB } from '@/db/db';
import { catalogo } from '@/features/tablero/catalogoDePrueba';
import { construirPlantillaGeneral, ID_PLANTILLA_GENERAL } from '@/features/tablero/plantillaGeneral';
import type { Pictograma, Tablero } from '@/types';

const NOMBRE = 'LeerParaTodosDB';

/** La base tal como la dejó una versión anterior de la app, con sus mismos esquemas, para abrirla con el código actual. */
const baseAntigua = (hastaVersion: 4 | 5) => {
  const vieja = new Dexie(NOMBRE);
  vieja.version(1).stores({
    alumnos: '++id, nombre, fechaCreacion',
    niveles: 'id, codigo, orden',
    pictogramas: '++id, palabra, categoria, esFotoReal',
    cuentos: '++id, nivelId, estado, fechaCreacion',
    progresos: '++id, alumnoId, cuentoId, completado, fechaUltimoAcceso',
  });
  vieja.version(2).stores({ registros: '++id, alumnoId, tipo, fecha' });
  vieja.version(3).stores({});
  vieja.version(4).stores({ misCuentos: '++id, alumnoId, fecha' });
  if (hastaVersion === 5) vieja.version(5).stores({ categorias: 'id, orden', tableros: 'id, alumnoId, esPlantilla' });
  return vieja;
};

afterEach(async () => {
  await Dexie.delete(NOMBRE);
});

describe('abrir con el código actual una base que ya existía', () => {
  it('desde la v4 (la del PR de «Mi cuento») aparecen categorías y tableros y los datos siguen ahí', async () => {
    const vieja = baseAntigua(4);
    await vieja.open();
    await vieja.table('misCuentos').add({ alumnoId: 'ana', fecha: '2026-11-10' });
    await vieja.table('registros').add({ alumnoId: 'ana', tipo: 'tablero', fecha: '2026-11-10' });
    vieja.close();

    const nueva = new LeerParaTodosDB();
    await nueva.open();
    try {
      expect(nueva.verno).toBe(6);
      const tablas = nueva.tables.map((t) => t.name);
      expect(tablas).toEqual(expect.arrayContaining(['categorias', 'tableros', 'misCuentos', 'registros']));
      expect(await nueva.misCuentos.count()).toBe(1);
      expect(await nueva.registros.count()).toBe(1);
      // Las tablas nuevas se pueden usar de inmediato
      await nueva.tableros.put({ id: 't1', nombre: 'Prueba', esPlantilla: true, principal: true, celdas: [] } as unknown as Tablero);
      expect(await nueva.tableros.count()).toBe(1);
    } finally {
      nueva.close();
    }
  });

  it('desde la v5, la v6 rellena una sola vez el dibujo de las carpetas guardadas sin él', async () => {
    const original = construirPlantillaGeneral(catalogo)[0];
    const sinDibujo: Tablero = {
      ...original,
      celdas: original.celdas.map((c) => (c.tipo === 'carpeta' ? { ...c, pictogramaId: undefined } : c)),
    };
    const vieja = baseAntigua(5);
    await vieja.open();
    await vieja.table('pictogramas').bulkAdd(catalogo.map((p) => ({ ...p }) as Pictograma));
    await vieja.table('tableros').put(sinDibujo);
    vieja.close();

    const carpetasDe = (t?: Tablero) => (t?.celdas ?? []).filter((c) => c.tipo === 'carpeta');

    const migrada = new LeerParaTodosDB();
    await migrada.open();
    try {
      const principal = await migrada.tableros.get(ID_PLANTILLA_GENERAL);
      expect(carpetasDe(principal).length).toBeGreaterThan(0);
      expect(carpetasDe(principal).every((c) => c.pictogramaId)).toBe(true);

      // La docente le quita el dibujo a una carpeta...
      const primera = carpetasDe(principal)[0];
      await migrada.tableros.put({
        ...(principal as Tablero),
        celdas: (principal as Tablero).celdas.map((c) => (c.id === primera.id ? { ...c, pictogramaId: undefined } : c)),
      });
    } finally {
      migrada.close();
    }

    // ...y al volver a abrir la app no reaparece
    const otraVez = new LeerParaTodosDB();
    await otraVez.open();
    try {
      const principal = await otraVez.tableros.get(ID_PLANTILLA_GENERAL);
      const primera = carpetasDe(principal)[0];
      expect(primera.pictogramaId).toBeUndefined();
    } finally {
      otraVez.close();
    }
  });
});
