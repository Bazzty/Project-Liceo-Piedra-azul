// Voces disponibles (mismas opciones que usePlayerStore)
export type VozId = 'catalina-cl';

/** Ajustes de apoyo que la docente del PIE deja configurados para un niño. */
export type ApoyoId = 'vozLenta' | 'sinMovimiento' | 'barrido' | 'pocasOpciones';

export interface Apoyo {
  activo: boolean;
  /** Por qué se usa este apoyo con este niño (queda en su ficha). */
  motivo?: string;
  /** Desde cuándo (ISO). */
  desde?: string;
}

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
  apoyos?: Partial<Record<ApoyoId, Apoyo>>; // Apoyos del PIE: se aplican solos cuando el niño entra
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
	/** Las del catálogo: basicas, necesidades, emociones, personas, acciones u objetos. Abierta porque la docente crea dibujos propios. */
	categoria: string;
	imagenUrl: string;
	audioUrl?: string;
	esFotoReal: boolean;
}

// 3b. Tablero de comunicación editable (estilo Asterics Grid)
/** Colores que puede elegir el profesor: salen de los temas, así conservan el contraste y el bajo estímulo. */
export type ColorTablero = 'aprender' | 'hablar' | 'colores' | 'logros' | 'alerta' | 'info';

export interface CategoriaTablero {
	id: string;
	nombre: string;
	color: ColorTablero;
	orden: number;
}

export type TipoCelda = 'palabra' | 'carpeta';

/** Una celda dice una palabra o abre otro tablero (carpeta). */
export interface CeldaTablero {
	id: string;
	tipo: TipoCelda;
	/** Pictograma de la palabra (en una carpeta, dibujo opcional). */
	pictogramaId?: string;
	textoMostrado: string;
	/** Lo que se dice si es distinto de lo que se muestra («Agua» → «Quiero agua»). */
	textoHablado?: string;
	categoriaId: string;
	/** Solo carpetas: el tablero que abre. */
	destinoTableroId?: string;
	/** Palabra núcleo: se ve siempre, también dentro de las carpetas. */
	esNucleo?: boolean;
	/** Audio generado (voz del proyecto) de lo que dice la celda, y el texto para el que se generó: si el texto cambia, deja de valer. */
	audioUrl?: string;
	audioTexto?: string;
}

/**
 * Un tablero con sus celdas en orden. La plantilla general (`esPlantilla`) la trae la app; un niño usa
 * esa mientras la docente no edite, y desde su primera edición tiene copia propia (`alumnoId`, `copiadoDe`).
 */
export interface Tablero {
	id: string;
	nombre: string;
	esPlantilla: boolean;
	alumnoId?: string;
	copiadoDe?: string;
	/** Tablero de entrada; los demás se alcanzan por carpetas. */
	principal: boolean;
	/** En el tablero principal: si al elegir una palabra dentro de una carpeta se vuelve solo al principal. Por defecto, sí. */
	volverAlElegir?: boolean;
	celdas: CeldaTablero[];
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
export type ActividadCalma = 'respirar' | 'burbujas' | 'luciernagas' | 'dibujar';

/** Un momento de calma: qué hizo el niño, cuánto duró y cómo dijo sentirse al salir (con caritas). */
export interface RegistroCalma {
  actividades: ActividadCalma[];
  animo?: 'peor' | 'igual' | 'mejor';
  segundos: number;
}

export interface Registro {
  id?: string;
  alumnoId: string;
  tipo: 'sesion' | 'lectura' | 'tablero' | 'actividad' | 'calma';
  cuentoId?: string; // Solo para tipo 'actividad': cuento al que pertenecen los juegos
  aciertos?: number; // Solo para tipo 'actividad': juegos resueltos sin ayuda
  total?: number; // Solo para tipo 'actividad': juegos de la sesión
  dificiles?: string[]; // Solo para tipo 'actividad': palabras en las que necesitó ayuda
  descanso?: boolean; // Solo para tipo 'actividad': el juego le ofreció descansar y aceptó
  demo?: boolean; // Dato de ejemplo (se puede reemplazar al actualizar la demostración)
  detalle: string; // Ej: Leyó «El Auto de Ana» hasta la página 1
  lugar: 'liceo' | 'casa';
  fecha: string; // ISO
  palabrasEscuchadas?: number;
  pictogramaIds?: string[]; // Solo para tipo 'tablero'
  calma?: RegistroCalma; // Solo para tipo 'calma'
}
