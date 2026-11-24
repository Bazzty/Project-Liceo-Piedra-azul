import Dexie, { type Table } from 'dexie';
import { imagenesDeCarpetaUnaVez, silabasAntesQueVocales } from '@/db/migraciones';
import type {
  Alumno,
  CategoriaTablero,
  Cuento,
  MiCuento,
  Nivel,
  Pictograma,
  Progreso,
  Registro,
  Tablero,
} from '@/types';

// Clases e Inicialización de Dexie.js
export class LeerParaTodosDB extends Dexie {
  alumnos!: Table<Alumno>;
  niveles!: Table<Nivel>;
  pictogramas!: Table<Pictograma>;
  cuentos!: Table<Cuento>;
  progresos!: Table<Progreso>;
  registros!: Table<Registro>;
  misCuentos!: Table<MiCuento>;
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

    // v4: los cuentos que el niño arma en «Mi cuento» (solo ids de opciones; las demás tablas no cambian)
    this.version(4).stores({
      misCuentos: '++id, alumnoId, fecha',
    });

    // v5: tableros de comunicación editables (plantilla general y copias por niño) y sus categorías.
    // Va en una versión aparte de la v4 para que los navegadores que ya abrieron la v4 creen estas tablas.
    // La plantilla se carga al iniciar (seedDatabase), así que no hace falta migrar datos.
    this.version(5).stores({
      categorias: 'id, orden',
      tableros: 'id, alumnoId, esPlantilla',
    });

    // v6: el dibujo de las carpetas de la plantilla general que se guardaron sin él se rellena aquí, una sola vez,
    // y no en cada inicio: así, si la docente le quita el dibujo a una carpeta, no reaparece al recargar.
    this.version(6)
      .stores({})
      .upgrade((tx) => imagenesDeCarpetaUnaVez(tx.table('tableros'), tx.table('pictogramas')));
  }
}

// Exporta la instancia única de la base de datos
export const db = new LeerParaTodosDB();