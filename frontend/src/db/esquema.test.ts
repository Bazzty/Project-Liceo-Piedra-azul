import { describe, expect, it } from 'vitest';
import { LeerParaTodosDB } from '@/db/db';

describe('esquema de la base local', () => {
  const base = new LeerParaTodosDB();

  it('está en la versión 4', () => {
    expect(base.verno).toBe(4);
  });

  it('conserva las tablas anteriores y suma categorías y tableros', () => {
    const nombres = base.tables.map((t) => t.name).sort();
    expect(nombres).toEqual(['alumnos', 'categorias', 'cuentos', 'niveles', 'pictogramas', 'progresos', 'registros', 'tableros']);
  });

  it('los tableros se buscan por niño y por plantilla', () => {
    const indices = base.table('tableros').schema.indexes.map((i) => i.name);
    expect(indices).toEqual(expect.arrayContaining(['alumnoId', 'esPlantilla']));
  });
});
