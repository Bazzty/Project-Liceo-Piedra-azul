import { afterEach, describe, expect, it, vi } from 'vitest';
import { BYTES_MAXIMOS_DE_FOTO, descargarDibujo, motivoDeRechazo, tamanoAjustado } from '@/features/tablero/imagenes';

describe('tamanoAjustado', () => {
  it('reduce el lado mayor al máximo y mantiene la proporción', () => {
    expect(tamanoAjustado(4000, 3000, 400)).toEqual({ ancho: 400, alto: 300 });
    expect(tamanoAjustado(3000, 4000, 400)).toEqual({ ancho: 300, alto: 400 });
    expect(tamanoAjustado(500, 500, 400)).toEqual({ ancho: 400, alto: 400 });
  });

  it('no agranda una imagen que ya cabe', () => {
    expect(tamanoAjustado(200, 100, 400)).toEqual({ ancho: 200, alto: 100 });
    expect(tamanoAjustado(400, 400, 400)).toEqual({ ancho: 400, alto: 400 });
  });

  it('nunca deja un lado en cero, ni siquiera con una imagen muy alargada', () => {
    expect(tamanoAjustado(10000, 10, 400)).toEqual({ ancho: 400, alto: 1 });
  });

  it('deja como está una imagen sin tamaño', () => {
    expect(tamanoAjustado(0, 0, 400)).toEqual({ ancho: 0, alto: 0 });
  });
});

describe('motivoDeRechazo', () => {
  it('acepta imágenes de tamaño razonable', () => {
    expect(motivoDeRechazo({ type: 'image/jpeg', size: 2_000_000 })).toBeNull();
    expect(motivoDeRechazo({ type: 'image/png', size: BYTES_MAXIMOS_DE_FOTO })).toBeNull();
  });

  it('rechaza lo que no es una imagen', () => {
    expect(motivoDeRechazo({ type: 'application/pdf', size: 100 })).toMatch(/no es una imagen/);
    expect(motivoDeRechazo({ type: '', size: 100 })).toMatch(/no es una imagen/);
  });

  it('rechaza fotos de más de 10 MB', () => {
    expect(motivoDeRechazo({ type: 'image/jpeg', size: BYTES_MAXIMOS_DE_FOTO + 1 })).toMatch(/más de 10 MB/);
  });
});

describe('descargarDibujo', () => {
  afterEach(() => vi.unstubAllGlobals());
  const reducir = vi.fn(async () => 'data:image/webp;base64,AAAA');

  it('baja el dibujo, lo reduce y devuelve el dato', async () => {
    const blob = new Blob(['x'], { type: 'image/png' });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, blob: async () => blob })));
    expect(await descargarDibujo('https://static.arasaac.org/1.png', reducir)).toBe('data:image/webp;base64,AAAA');
    expect(reducir).toHaveBeenCalledWith(blob);
  });

  it('devuelve nulo si no hay internet', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))));
    expect(await descargarDibujo('https://static.arasaac.org/1.png', reducir)).toBeNull();
  });

  it('devuelve nulo si el sitio responde con error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, blob: async () => new Blob() })));
    expect(await descargarDibujo('https://static.arasaac.org/1.png', reducir)).toBeNull();
  });

  it('devuelve nulo si la imagen no se puede preparar', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, blob: async () => new Blob() })));
    expect(await descargarDibujo('https://x/1.png', async () => Promise.reject(new Error('imagen rota')))).toBeNull();
  });
});
