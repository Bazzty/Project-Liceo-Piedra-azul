import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorDeServidor, generarAudio, iniciarSesionEnServidor, olvidarSesionDelServidor } from '@/api/servidor';

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
