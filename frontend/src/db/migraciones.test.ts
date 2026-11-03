import { describe, expect, it } from 'vitest';
import { silabasAntesQueVocales } from '@/db/migraciones';
import type { Nivel } from '@/types';

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
