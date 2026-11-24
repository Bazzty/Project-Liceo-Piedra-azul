import { describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { imagenesDeCarpetaUnaVez, silabasAntesQueVocales } from '@/db/migraciones';
import { catalogo } from '@/features/tablero/catalogoDePrueba';
import { construirPlantillaGeneral, ID_PLANTILLA_GENERAL } from '@/features/tablero/plantillaGeneral';
import type { Nivel, Tablero } from '@/types';

const tablaFalsa = (niveles: Nivel[]) => {
  const filas = new Map(niveles.map((n) => [n.id as string, { ...n }]));
  return {
    filas,
    // Como Dexie, entrega una copia y no la fila guardada
    get: async (id: string) => ({ ...filas.get(id) }),
    update: async (id: string, cambios: Partial<Nivel>) => {
      Object.assign(filas.get(id) ?? {}, cambios);
      return 1;
    },
  };
};

const vocales: Nivel = { id: 'nivel-vocales', codigo: 'A', nombre: 'Las vocales', descripcion: '', orden: 1 };
const silabas: Nivel = { id: 'nivel-a', codigo: 'B', nombre: 'Sílabas', descripcion: '', orden: 2 };

describe('silabasAntesQueVocales', () => {
  it('intercambia letra y orden sin tocar los nombres que editó la docente', async () => {
    const tabla = tablaFalsa([vocales, silabas]);

    await silabasAntesQueVocales(tabla as never);

    expect(tabla.filas.get('nivel-a')).toMatchObject({ codigo: 'A', orden: 1, nombre: 'Sílabas' });
    expect(tabla.filas.get('nivel-vocales')).toMatchObject({ codigo: 'B', orden: 2, nombre: 'Las vocales' });
  });

  it('no hace nada si los niveles ya no tienen las letras antiguas', async () => {
    const tabla = tablaFalsa([{ ...vocales, codigo: 'B', orden: 2 }, { ...silabas, codigo: 'A', orden: 1 }]);

    await silabasAntesQueVocales(tabla as never);

    expect(tabla.filas.get('nivel-a')).toMatchObject({ codigo: 'A', orden: 1 });
    expect(tabla.filas.get('nivel-vocales')).toMatchObject({ codigo: 'B', orden: 2 });
  });
});

describe('imagenesDeCarpetaUnaVez', () => {
  const conPlantilla = (quitarDibujo: boolean) => {
    const original = construirPlantillaGeneral(catalogo)[0];
    const guardada: Tablero = quitarDibujo
      ? { ...original, celdas: original.celdas.map((c) => (c.tipo === 'carpeta' ? { ...c, pictogramaId: undefined } : c)) }
      : original;
    const puestos: Tablero[] = [];
    const tableros = {
      get: async (id: string) => (id === ID_PLANTILLA_GENERAL ? guardada : undefined),
      put: async (t: Tablero) => {
        puestos.push(t);
        return t.id;
      },
    };
    return { tableros, puestos, pictogramas: { toArray: async () => catalogo } };
  };

  it('rellena el dibujo de las carpetas guardadas sin él', async () => {
    const { tableros, puestos, pictogramas } = conPlantilla(true);
    await imagenesDeCarpetaUnaVez(tableros as never, pictogramas as never);
    expect(puestos).toHaveLength(1);
    expect(puestos[0].celdas.filter((c) => c.tipo === 'carpeta').every((c) => c.pictogramaId)).toBe(true);
  });

  it('no escribe nada si ya tienen dibujo, ni si no hay plantilla guardada', async () => {
    const lleno = conPlantilla(false);
    await imagenesDeCarpetaUnaVez(lleno.tableros as never, lleno.pictogramas as never);
    expect(lleno.puestos).toHaveLength(0);
    await imagenesDeCarpetaUnaVez({ get: async () => undefined, put: async () => '' } as never, lleno.pictogramas as never);
  });
});

describe('esquema de la base local', () => {
  it('«misCuentos» (por niño y fecha) convive con las tablas anteriores', () => {
    expect(db.verno).toBe(6);
    expect(db.tables.map((t) => t.name).sort()).toEqual(['alumnos', 'categorias', 'cuentos', 'misCuentos', 'niveles', 'pictogramas', 'progresos', 'registros', 'tableros']);
    expect(db.table('misCuentos').schema.indexes.map((i) => i.name)).toEqual(['alumnoId', 'fecha']);
    // Los datos de un navegador que ya estaba en la versión 3 siguen como estaban: la 4 no tiene migración
    expect(db.table('registros').schema.indexes.map((i) => i.name)).toEqual(['alumnoId', 'tipo', 'fecha']);
  });
});
