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
  notaDocente?: string; // Observaciones de la docente (visibles solo para docentes y revisores)
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
	/** Palabra base para buscar el pictograma si falta (p. ej. «saltar» para «salta»). */
	clave?: string;
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
	/** borrador → en_revision (la docente lo envía) → publicado (el revisor lo valida) */
	estado: 'borrador' | 'en_revision' | 'publicado'; // RF-13
	/** Posición en el catálogo del nivel (menor primero). Sin valor, va después de los que lo tienen. */
	orden?: number;
	/** Motivo por el que el revisor devolvió el cuento a borrador. */
	comentarioRevision?: string;
	fechaCreacion: string;
	fechaCambio?: string;
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
  tipo: 'sesion' | 'lectura' | 'tablero' | 'actividad';
  cuentoId?: string; // Solo para tipo 'actividad': cuento al que pertenecen los juegos
  aciertos?: number; // Solo para tipo 'actividad': juegos resueltos sin ayuda
  total?: number; // Solo para tipo 'actividad': juegos de la sesión
  dificiles?: string[]; // Solo para tipo 'actividad': palabras en las que necesitó ayuda
  detalle: string; // Ej: Leyó «El Auto de Ana» hasta la página 1
  lugar: 'liceo' | 'casa';
  fecha: string; // ISO
  palabrasEscuchadas?: number;
  pictogramaIds?: string[]; // Solo para tipo 'tablero'
}
