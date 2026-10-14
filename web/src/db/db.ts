import Dexie, { type Table } from 'dexie';

// Voces disponibles (mismas opciones que usePlayerStore)
export type VozId = 'catalina-cl' | 'profesora-clonada';

// 1. Perfil del Estudiante
export interface Alumno {
  id?: string;
  nombre: string;
  apellido: string;
  avatarUrl?: string;
  temaId: string;
  personajeId?: string;
  vozId?: VozId; // Voz asignada por el docente (si no existe, se usa la voz por defecto)
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
export interface Silaba {
	texto: string;
	audioUrl: string;
}

export interface CuentoPalabra {
	texto: string;
	pictogramaUrl?: string;
	audioUrl?: string;
	silabas?: Silaba[];
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
  paginaActual?: number; // Última página leída (para calcular el porcentaje de avance)
  fechaUltimoAcceso: string;
}

// 6. Bitácora de actividad (alimenta el panel docente: sesiones, palabras escuchadas, registro)
export interface Registro {
  id?: string;
  alumnoId: string;
  tipo: 'sesion' | 'lectura' | 'tablero';
  detalle: string; // Ej: Leyó «El Auto de Ana» hasta la página 1
  lugar: 'liceo' | 'casa';
  fecha: string; // ISO
  palabrasEscuchadas?: number;
  pictogramaIds?: string[]; // Solo para tipo 'tablero'
}

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