import Dexie, { type Table } from 'dexie';
import type { Alumno, Cuento, Nivel, Pictograma, Progreso, Registro } from '@/types';

// Clases e Inicialización de Dexie.js
export class LeerParaTodosDB extends Dexie {
  alumnos!: Table<Alumno>;
  niveles!: Table<Nivel>;
  pictogramas!: Table<Pictograma>;
  cuentos!: Table<Cuento>;
  progresos!: Table<Progreso>;
  registros!: Table<Registro>;

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
  }
}

// Exporta la instancia única de la base de datos
export const db = new LeerParaTodosDB();