import { describe, expect, it } from 'vitest';
import { LeerParaTodosDB } from '@/db/db';

describe('esquema de la base local', () => {
  const base = new LeerParaTodosDB();

  /** Lo que cada versión declara por su cuenta (Dexie la guarda en `_cfg.storesSource`). */
  const declaradoPorVersion = (v: number) =>
    Object.keys(
      (base as unknown as { _versions: { _cfg: { version: number; storesSource: Record<string, string | null> } }[] })._versions.find(
        (x) => x._cfg.version === v,
      )?._cfg.storesSource ?? {},
    ).sort();

  it('está en la versión 5', () => {
    expect(base.verno).toBe(5);
  });

  it('conserva las tablas anteriores y suma «misCuentos», categorías y tableros', () => {
    const nombres = base.tables.map((t) => t.name).sort();
    expect(nombres).toEqual([
      'alumnos',
      'categorias',
      'cuentos',
      'misCuentos',
      'niveles',
      'pictogramas',
      'progresos',
      'registros',
      'tableros',
    ]);
  });

  it('la v4 ya publicada solo trae «misCuentos»; categorías y tableros llegan en la v5', () => {
    // Un navegador que ya abrió la v4 solo crea tablas nuevas si están en una versión posterior.
    expect(declaradoPorVersion(4)).toEqual(['misCuentos']);
    expect(declaradoPorVersion(5)).toEqual(['categorias', 'tableros']);
  });

  it('los tableros se buscan por niño y por plantilla', () => {
    const indices = base.table('tableros').schema.indexes.map((i) => i.name);
    expect(indices).toEqual(expect.arrayContaining(['alumnoId', 'esPlantilla']));
  });
});
