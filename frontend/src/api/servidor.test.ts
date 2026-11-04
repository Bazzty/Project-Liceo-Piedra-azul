import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorDeServidor, generarAudio, generarCuentoConIa, iniciarSesionEnServidor, olvidarSesionDelServidor } from '@/api/servidor';

const responder = (cuerpo: unknown, estado = 200) =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'Content-Type': 'application/json' } }));

const AUDIO = { url: '/audio-generado/abc.mp3', voz: 'elevenlabs', enCache: false, respaldo: false };

describe('servidor', () => {
  beforeEach(() => olvidarSesionDelServidor());
  afterEach(() => vi.unstubAllGlobals());

  it('inicia sesión y guarda el token para las siguientes peticiones', async () => {
    vi.stubGlobal('fetch', responder({ token: '1|abc', usuario: {} }));
    expect(await iniciarSesionEnServidor('profe@liceo.cl', 'clave')).toBe(true);

    const fetchAudio = responder(AUDIO);
    vi.stubGlobal('fetch', fetchAudio);
    await generarAudio('Hola oso');

    const [url, opciones] = fetchAudio.mock.calls[0];
    expect(url).toBe('/api/v1/audio');
    expect(opciones.headers.Authorization).toBe('Bearer 1|abc');
    expect(JSON.parse(opciones.body)).toEqual({ texto: 'Hola oso' });
  });

  it('si se cierra la sesión mientras inicia, revoca el token que llega tarde y no lo guarda', async () => {
    let terminarLogin!: (r: Response) => void;
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise<Response>((resolver) => (terminarLogin = resolver))));
    const sesion = iniciarSesionEnServidor('a@b.cl', 'x');
    olvidarSesionDelServidor();

    const fetchLogout = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchLogout);
    terminarLogin(new Response(JSON.stringify({ token: '9|tardio' }), { status: 200 }));

    await expect(sesion).resolves.toBe(false);
    expect(fetchLogout.mock.calls[0][0]).toBe('/api/v1/auth/logout');
    expect(fetchLogout.mock.calls[0][1].headers.Authorization).toBe('Bearer 9|tardio');
    await expect(generarAudio('Hola')).rejects.toMatchObject({ estado: 401 });
  });

  it('un inicio nuevo revoca el token anterior, aunque el nuevo falle', async () => {
    vi.stubGlobal('fetch', responder({ token: '1|viejo' }));
    await iniciarSesionEnServidor('a@b.cl', 'x');

    const llamadas = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ message: 'no' }), { status: 401 }));
    vi.stubGlobal('fetch', llamadas);
    await expect(iniciarSesionEnServidor('otra@b.cl', 'mala')).resolves.toBe(false);

    const revocacion = llamadas.mock.calls.find(([url]) => url === '/api/v1/auth/logout');
    expect(revocacion?.[1].headers.Authorization).toBe('Bearer 1|viejo');
    await expect(generarAudio('Hola')).rejects.toMatchObject({ estado: 401 });
  });

  describe('generarCuentoConIa', () => {
    const PEDIDO = { tema: 'un gato', nivel: 'B', paginas: 4 } as const;
    const conSesion = async () => {
      vi.stubGlobal('fetch', responder({ token: '1|abc' }));
      await iniciarSesionEnServidor('a@b.cl', 'x');
    };

    it('manda el pedido con la sesión y devuelve el borrador', async () => {
      await conSesion();
      const borrador = { titulo: 'El gato', descripcion: '', frases: ['El gato come'] };
      const fetchCuento = responder(borrador);
      vi.stubGlobal('fetch', fetchCuento);

      await expect(generarCuentoConIa(PEDIDO)).resolves.toEqual(borrador);

      const [url, opciones] = fetchCuento.mock.calls[0];
      expect(url).toBe('/api/v1/cuentos/generar');
      expect(opciones.headers.Authorization).toBe('Bearer 1|abc');
      expect(JSON.parse(opciones.body)).toEqual(PEDIDO);
    });

    it('sin sesión pide ingresar, sin llamar al servidor', async () => {
      const sinLlamar = vi.fn();
      vi.stubGlobal('fetch', sinLlamar);

      await expect(generarCuentoConIa(PEDIDO)).rejects.toThrow('Para crear el cuento, vuelve a ingresar');
      expect(sinLlamar).not.toHaveBeenCalled();
    });

    it.each([
      [403, 'Tu cuenta no puede crear el cuento: es solo para docentes.'],
      [429, 'Se pidieron muchos cuentos seguidos. Espera un minuto y vuelve a intentar.'],
      [503, 'La IA de cuentos aún no está activada en este servidor.'],
    ])('explica en español un %i', async (estado, mensaje) => {
      await conSesion();
      vi.stubGlobal('fetch', responder({ message: estado === 503 ? mensaje : 'Too Many Attempts.' }, estado));

      await expect(generarCuentoConIa(PEDIDO)).rejects.toMatchObject({ message: mensaje, estado });
    });

    it('rechaza una respuesta sin frases', async () => {
      await conSesion();
      vi.stubGlobal('fetch', responder({ titulo: 'Vacío', frases: [] }));

      await expect(generarCuentoConIa(PEDIDO)).rejects.toMatchObject({ estado: 502 });
    });
  });

  it('al olvidar la sesión revoca el token en el servidor y lo borra aquí', async () => {
    vi.stubGlobal('fetch', responder({ token: '1|abc' }));
    await iniciarSesionEnServidor('a@b.cl', 'x');

    const fetchLogout = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchLogout);
    olvidarSesionDelServidor();

    const [url, opciones] = fetchLogout.mock.calls[0];
    expect(url).toBe('/api/v1/auth/logout');
    expect(opciones.method).toBe('POST');
    expect(opciones.headers.Authorization).toBe('Bearer 1|abc');
    await expect(generarAudio('Hola')).rejects.toMatchObject({ estado: 401 });
    expect(fetchLogout).toHaveBeenCalledTimes(1);
  });

  it('sin token no llama al servidor, y si no hay conexión al cerrar sesión no falla', async () => {
    const sinLlamar = vi.fn();
    vi.stubGlobal('fetch', sinLlamar);
    olvidarSesionDelServidor();
    expect(sinLlamar).not.toHaveBeenCalled();

    vi.stubGlobal('fetch', responder({ token: '1|abc' }));
    await iniciarSesionEnServidor('a@b.cl', 'x');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('sin red')));
    expect(() => olvidarSesionDelServidor()).not.toThrow();
  });

  it('si el inicio de sesión sigue en camino, espera en vez de decir que no hay sesión', async () => {
    let terminarLogin!: (r: Response) => void;
    const login = vi.fn().mockReturnValue(new Promise<Response>((resolver) => (terminarLogin = resolver)));
    vi.stubGlobal('fetch', login);
    const sesion = iniciarSesionEnServidor('a@b.cl', 'x');

    const fetchAudio = responder(AUDIO);
    const audio = generarAudio('Hola');
    vi.stubGlobal('fetch', fetchAudio);
    terminarLogin(new Response(JSON.stringify({ token: '9|tardio' }), { status: 200 }));

    await expect(sesion).resolves.toBe(true);
    await expect(audio).resolves.toMatchObject({ url: AUDIO.url });
    expect(fetchAudio.mock.calls[0][1].headers.Authorization).toBe('Bearer 9|tardio');
  });

  it('con credenciales malas o sin servidor devuelve false sin lanzar error', async () => {
    vi.stubGlobal('fetch', responder({ message: 'no' }, 401));
    expect(await iniciarSesionEnServidor('a@b.cl', 'mala')).toBe(false);

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('red caída')));
    expect(await iniciarSesionEnServidor('a@b.cl', 'x')).toBe(false);
  });

  it('sin sesión pide ingresar y no llama al servidor', async () => {
    const fetchMock = responder(AUDIO);
    vi.stubGlobal('fetch', fetchMock);

    await expect(generarAudio('Hola')).rejects.toMatchObject({ estado: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('si el token venció avisa y lo olvida', async () => {
    vi.stubGlobal('fetch', responder({ token: 't' }));
    await iniciarSesionEnServidor('a@b.cl', 'x');
    vi.stubGlobal('fetch', responder({ message: 'Unauthenticated.' }, 401));

    await expect(generarAudio('Hola')).rejects.toThrow(/venció/);

    const fetchMock = responder(AUDIO);
    vi.stubGlobal('fetch', fetchMock);
    await expect(generarAudio('Hola')).rejects.toThrow(/vuelve a ingresar/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [403, 'Tu cuenta no puede generar audio: es solo para docentes.'],
    [429, 'Se pidieron muchos audios seguidos. Espera un minuto y vuelve a intentar.'],
    [500, 'El servidor tuvo un problema. Intenta de nuevo.'],
    [404, 'No se pudo generar el audio.'],
  ])('traduce el error %i en vez de mostrar el texto en inglés de Laravel', async (estado, mensaje) => {
    vi.stubGlobal('fetch', responder({ token: 't' }));
    await iniciarSesionEnServidor('a@b.cl', 'x');
    vi.stubGlobal('fetch', responder({ message: 'Too Many Attempts. / This action is unauthorized.' }, estado));

    await expect(generarAudio('Hola')).rejects.toMatchObject({ message: mensaje, estado });
  });

  it('una respuesta que no es de la API (p. ej. el index.html de un servidor sin proxy) no se toma por un audio', async () => {
    vi.stubGlobal('fetch', responder({ token: 't' }));
    await iniciarSesionEnServidor('a@b.cl', 'x');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<!doctype html><html></html>', { status: 200 })));

    await expect(generarAudio('Hola')).rejects.toThrow('El servidor no respondió como se esperaba');
  });

  it('muestra el mensaje del servidor cuando rechaza el texto o no hay voz', async () => {
    vi.stubGlobal('fetch', responder({ token: 't' }));
    await iniciarSesionEnServidor('a@b.cl', 'x');

    vi.stubGlobal('fetch', responder({ message: 'El texto es muy largo: máximo 600 caracteres por audio.' }, 422));
    await expect(generarAudio('x')).rejects.toThrow('El texto es muy largo: máximo 600 caracteres por audio.');

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('red caída')));
    const error = await generarAudio('x').catch((e) => e);
    expect(error).toBeInstanceOf(ErrorDeServidor);
    expect(error.message).toBe('No hay conexión con el servidor.');
  });
});
