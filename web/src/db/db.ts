import Dexie, { type Table } from 'dexie';

// 1. Perfil del Estudiante
export interface Alumno {
  id?: string;
  nombre: string;
  avatarUrl?: string;
  temaId: string;
  personajeId?: string;
  fechaCreacion: string;
}

// 2. Niveles de Aprendizaje Pedagógico (Vocales, Consonantes M, L, S, etc.)
export interface Nivel {
  id: string; // ej: 'nivel-a', 'nivel-b'
  codigo: string; // 'A', 'B', 'C'
  nombre: string;
  descripcion: string;
  orden: number;
}

// 3. Catálogo de Pictogramas (ARASAAC / Fotos Reales)
export interface Pictograma {
  id?: string;
  palabra: string;
  categoria: 'necesidades' | 'emociones' | 'personas' | 'acciones' | 'objetos';
  imagenUrl: string;
  audioUrl?: string;
  esFotoReal: boolean;
}

// 4. Estructura de Lectura Dual (Palabra + Pictograma + Audio)
export interface CuentoPalabra {
  texto: string;
  pictogramaUrl?: string;
  audioUrl?: string;
}

export interface CuentoPagina {
  numeroPagina: number;
  textoCompleto: string;
  palabras: CuentoPalabra[];
  audioPaginaUrl?: string;
  imagenPaginaUrl?: string;
}

export interface Cuento {
  id?: string;
  nivelId: string;
  titulo: string;
  descripcion: string;
  portadaUrl?: string;
  paginas: CuentoPagina[];
  estado: 'borrador' | 'publicado'; // RF-13
  fechaCreacion: string;
}

// 5. Registro de Progreso Individual por Alumno
export interface Progreso {
  id?: string;
  alumnoId: string;
  cuentoId: string;
  completado: boolean;
  fechaUltimoAcceso: string;
}

// Clases e Inicialización de Dexie.js
export class LeerParaTodosDB extends Dexie {
  alumnos!: Table<Alumno>;
  niveles!: Table<Nivel>;
  pictogramas!: Table<Pictograma>;
  cuentos!: Table<Cuento>;
  progresos!: Table<Progreso>;

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
  }
}

// Exporta la instancia única de la base de datos
export const db = new LeerParaTodosDB();