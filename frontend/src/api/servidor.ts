/**
 * Cliente de la API del servidor (Laravel). Es opcional: sin servidor la app sigue funcionando con sus datos
 * locales, y solo las funciones que lo necesitan (como generar audio) avisan que no hay conexión.
 * El token vive en sessionStorage: se borra al cerrar la pestaña y vence a las 12 horas.
 */
const BASE = '/api/v1';
const CLAVE_TOKEN = 'servidor.token';

export class ErrorDeServidor extends Error {
  readonly estado: number;

  constructor(mensaje: string, estado: number) {
    super(mensaje);
    this.name = 'ErrorDeServidor';
    this.estado = estado;
  }
}

const leerToken = (): string | null => {
  try {
    return sessionStorage.getItem(CLAVE_TOKEN);
  } catch {
    return null;
  }
};

const guardarToken = (token: string | null) => {
  try {
    if (token) sessionStorage.setItem(CLAVE_TOKEN, token);
    else sessionStorage.removeItem(CLAVE_TOKEN);
  } catch {
    // Sin sessionStorage (modo privado estricto): el audio pedirá ingresar de nuevo.
  }
};

/** Estados en los que el mensaje del servidor ya viene en español y dice algo útil (texto largo, sin voz). */
const CON_MENSAJE_PROPIO = new Set([422, 503]);

/** Sin conexión no se insiste: el token vence solo a las 12 horas. */
const revocarToken = (token: string) => {
  fetch(`${BASE}/auth/logout`, {
    method: 'POST',
    keepalive: true,
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  }).catch(() => undefined);
};

/** Sube cada vez que la sesión termina: un inicio que responde tarde ve que ya no vale y revoca su token. */
let turnoDeSesion = 0;

/** Borra el token de esta pestaña y lo revoca en el servidor. */
export const olvidarSesionDelServidor = () => {
  turnoDeSesion += 1;
  const token = leerToken();
  guardarToken(null);
  if (token) revocarToken(token);
};

let inicioEnCurso: Promise<boolean> | null = null;

/**
 * Inicia sesión en el servidor sin molestar: devuelve false si no hay servidor o las credenciales no sirven.
 * Si la docente pide un audio antes de que termine, `generarAudio` espera este inicio en vez de decir que no hay sesión.
 * Parte de cero: el token anterior, si había, se revoca para que no quede vivo sin que nadie lo tenga.
 */
export function iniciarSesionEnServidor(email: string, password: string): Promise<boolean> {
  olvidarSesionDelServidor();
  const inicio = pedirSesion(email, password, turnoDeSesion).finally(() => {
    if (inicioEnCurso === inicio) inicioEnCurso = null;
  });
  inicioEnCurso = inicio;
  return inicio;
}

async function pedirSesion(email: string, password: string, turno: number): Promise<boolean> {
  try {
    const respuesta = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!respuesta.ok) return false;
    const { token } = (await respuesta.json()) as { token?: string };
    if (turno !== turnoDeSesion) {
      if (token) revocarToken(token);
      return false;
    }
    guardarToken(token ?? null);
    return Boolean(token);
  } catch {
    return false;
  }
}

export interface AudioGenerado {
  /** Ruta pública del MP3 (relativa: sirve en cualquier dominio). */
  url: string;
  voz: 'elevenlabs' | 'piper';
  /** El servidor ya lo tenía: no gastó cuota de la API de voz. */
  enCache: boolean;
  /** Se usó la voz local porque la API de voz no respondió. */
  respaldo: boolean;
}

/** Lo que cambia entre una petición y otra: cómo se le nombra la acción a la docente. */
interface Accion {
  /** Qué se estaba haciendo, para los mensajes: «generar audio», «crear el cuento». */
  nombre: string;
  /** Mensaje cuando falla sin una explicación mejor. */
  fallo: string;
  /** Mensaje cuando el servidor dice que se pidió demasiado (429). */
  demasiado: string;
}

/** Hace una petición con la sesión de la docente. Laravel responde en inglés a un 403 o 429, así que no se muestra tal cual. */
async function pedirConSesion<T extends object>(ruta: string, cuerpo: object, accion: Accion, esValida: (r: T) => boolean): Promise<T> {
  await inicioEnCurso;
  const token = leerToken();
  if (!token) throw new ErrorDeServidor(`Para ${accion.nombre}, vuelve a ingresar con tu cuenta de docente.`, 401);

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE}${ruta}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(cuerpo),
    });
  } catch {
    throw new ErrorDeServidor('No hay conexión con el servidor.', 0);
  }

  if (respuesta.status === 401) {
    guardarToken(null);
    throw new ErrorDeServidor('Tu sesión con el servidor venció. Vuelve a ingresar.', 401);
  }
  if (!respuesta.ok) {
    const { message } = ((await respuesta.json().catch(() => null)) ?? {}) as { message?: string };
    const propio = CON_MENSAJE_PROPIO.has(respuesta.status) ? message : undefined;
    const porEstado: Record<number, string> = {
      403: `Tu cuenta no puede ${accion.nombre}: es solo para docentes.`,
      429: accion.demasiado,
    };
    const generico = respuesta.status >= 500 ? 'El servidor tuvo un problema. Intenta de nuevo.' : accion.fallo;
    throw new ErrorDeServidor(porEstado[respuesta.status] ?? propio ?? generico, respuesta.status);
  }

  // Sin proxy (p. ej. un servidor estático), /api devuelve el index.html con 200: no es una respuesta de la API.
  const datos = (await respuesta.json().catch(() => null)) as T | null;
  if (!datos || !esValida(datos)) {
    throw new ErrorDeServidor('El servidor no respondió como se esperaba. Revisa que esté encendido.', 502);
  }
  return datos;
}

/** Pide al servidor el audio de un texto con la voz del proyecto. */
export const generarAudio = (texto: string) =>
  pedirConSesion<AudioGenerado>(
    '/audio',
    { texto },
    {
      nombre: 'generar audio',
      fallo: 'No se pudo generar el audio.',
      demasiado: 'Se pidieron muchos audios seguidos. Espera un minuto y vuelve a intentar.',
    },
    (a) => Boolean(a.url),
  );

export interface BorradorDeCuento {
  titulo: string;
  descripcion: string;
  /** Una por página. */
  frases: string[];
}

export interface PedidoDeCuento {
  tema: string;
  nivel: 'A' | 'B';
  paginas: number;
}

/** Pide a la IA del servidor un borrador de cuento. Es solo texto: la docente lo revisa antes de guardarlo. */
export const generarCuentoConIa = (pedido: PedidoDeCuento) =>
  pedirConSesion<BorradorDeCuento>(
    '/cuentos/generar',
    pedido,
    {
      nombre: 'crear el cuento',
      fallo: 'No se pudo crear el cuento.',
      demasiado: 'Se pidieron muchos cuentos seguidos. Espera un minuto y vuelve a intentar.',
    },
    (c) => Array.isArray(c.frases) && c.frases.length > 0,
  );
