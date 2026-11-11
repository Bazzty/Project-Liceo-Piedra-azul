import Dexie, { type Table } from 'dexie';
import { silabasAntesQueVocales } from '@/db/migraciones';
import type { Alumno, CategoriaTablero, Cuento, Nivel, Pictograma, Progreso, Registro, Tablero } from '@/types';

// Clases e Inicialización de Dexie.js
export class LeerParaTodosDB extends Dexie {
  alumnos!: Table<Alumno>;
  niveles!: Table<Nivel>;
  pictogramas!: Table<Pictograma>;
  cuentos!: Table<Cuento>;
  progresos!: Table<Progreso>;
  registros!: Table<Registro>;
  categorias!: Table<CategoriaTablero, string>;
  tableros!: Table<Tablero, string>;

  constructor() {
    super('LeerParaTodosDB');
    
    // Define los esquemas e índices principales (id autoincremental o plano)
    this.version(1).stores({
      alumnos: '++id, nombre, fechaCreacion',
      niveles: 'id, codigo, orden',
      pictogramas: '++id, palabra, categoria, esFotoReal',
      cuentos: '++id, nivelId, estado, fechaCreacion',
      progresos: '++id, alumnoId, cuentoId, completado, fechaUltimoAcceso',
    });

    // v2: bitácora de actividad para el panel docente (las demás tablas no cambian)
    this.version(2).stores({
      registros: '++id, alumnoId, tipo, fecha',
    });

    // v3: sílabas antes que vocales, también en los navegadores que ya tenían datos
    this.version(3).stores({}).upgrade((tx) => silabasAntesQueVocales(tx.table('niveles')));

    // v4: tableros de comunicación editables (plantilla general y copias por niño) y sus categorías.
    // La plantilla se carga al iniciar (seedDatabase), así que no hace falta migrar datos.
    this.version(4).stores({
      categorias: 'id, orden',
      tableros: 'id, alumnoId, esPlantilla',
    });
  }
}

// Exporta la instancia única de la base de datos
export const db = new LeerParaTodosDB();