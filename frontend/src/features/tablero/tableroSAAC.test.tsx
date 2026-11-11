import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TableroSAAC } from '@/features/tablero/components/TableroSAAC';
import { useTableroStore } from '@/shared/store/useTableroStore';

const { decir, estado } = vi.hoisted(() => ({
  decir: vi.fn(async () => {}),
  estado: { volverAlElegir: true },
}));

vi.mock('@/shared/audio/decirSecuencia', () => ({ decirSecuencia: decir }));
vi.mock('@/shared/audio/sonidos', () => ({ sonarToque: vi.fn(), sonarAcierto: vi.fn() }));
vi.mock('@/shared/components/LluviaEstrellas', () => ({ LluviaEstrellas: () => null }));
// Los mocks se ejecutan antes que los imports de arriba: lo que necesitan se importa dentro de cada uno.
vi.mock('@/api', async (original) => {
  const { catalogo } = await import('@/features/tablero/catalogoDePrueba');
  return { ...(await original<typeof import('@/api')>()), usePictogramas: () => catalogo, crearRegistro: vi.fn() };
});
vi.mock('@/features/tablero/useTableroDelNino', async (original) => {
  const real = await original<typeof import('@/features/tablero/useTableroDelNino')>();
  const { catalogo } = await import('@/features/tablero/catalogoDePrueba');
  const { CATEGORIAS_INICIALES, construirPlantillaGeneral } = await import('@/features/tablero/plantillaGeneral');
  const plantilla = construirPlantillaGeneral(catalogo);
  // Se arma una sola vez: el componente la pide en cada render y debe recibir siempre el mismo objeto.
  let armado: ReturnType<typeof real.resolverTableroDelNino> | undefined;
  let armadoCon: boolean | undefined;
  const useTableroDelNino = () => {
    if (!armado || armadoCon !== estado.volverAlElegir) {
      armadoCon = estado.volverAlElegir;
      armado = real.resolverTableroDelNino({ ...plantilla[0], volverAlElegir: estado.volverAlElegir }, plantilla, catalogo, CATEGORIAS_INICIALES);
    }
    return armado;
  };
  return { ...real, useTableroDelNino };
});

const cerrar = vi.fn();
const abrir = () => render(<TableroSAAC onCerrar={cerrar} />);
const frase = () => useTableroStore.getState().frase.map((p) => p.palabra);

beforeEach(() => {
  vi.clearAllMocks();
  estado.volverAlElegir = true;
  useTableroStore.setState({ abierto: true, frase: [] });
});

describe('Tablero con carpetas', () => {
  it('el principal muestra las carpetas en su propia columna y las palabras núcleo, y no las palabras de las carpetas', () => {
    abrir();
    const columna = screen.getByRole('navigation', { name: 'Carpetas' });
    expect(within(columna).getAllByRole('button')).toHaveLength(5);
    expect(within(columna).getByRole('button', { name: 'Carpeta Acciones' })).toBeInTheDocument();
    const nucleo = screen.getByRole('navigation', { name: 'Palabras que siempre están' });
    expect(within(nucleo).getByRole('button', { name: 'quiero' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'agua' })).toBeNull();
  });

  it('al tocar una carpeta muestra sus palabras, dice su nombre y las núcleo siguen a la vista', async () => {
    abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Carpeta Necesidades' }));
    expect(screen.getByRole('button', { name: 'agua' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'comer' })).toBeInTheDocument();
    expect(within(screen.getByRole('navigation', { name: 'Palabras que siempre están' })).getByRole('button', { name: 'yo' })).toBeInTheDocument();
    expect(decir).toHaveBeenCalledWith([expect.objectContaining({ texto: 'Necesidades' })]);
    expect(screen.getByRole('button', { name: 'Volver al tablero principal' })).toBeInTheDocument();
  });

  it('con una carpeta abierta la columna sigue visible, la marca y deja pasar a otra directamente', async () => {
    abrir();
    const columna = screen.getByRole('navigation', { name: 'Carpetas' });
    await userEvent.click(within(columna).getByRole('button', { name: 'Carpeta Necesidades' }));
    expect(within(columna).getAllByRole('button')).toHaveLength(5);
    expect(within(columna).getByRole('button', { name: 'Carpeta Necesidades' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(columna).getByRole('button', { name: 'Carpeta Emociones' })).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(within(columna).getByRole('button', { name: 'Carpeta Emociones' }));
    expect(screen.getByRole('button', { name: 'feliz' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'agua' })).toBeNull();
  });

  it('tocar la carpeta que ya está abierta vuelve al principal', async () => {
    abrir();
    const columna = screen.getByRole('navigation', { name: 'Carpetas' });
    await userEvent.click(within(columna).getByRole('button', { name: 'Carpeta Necesidades' }));
    await userEvent.click(within(columna).getByRole('button', { name: 'Carpeta Necesidades' }));
    expect(screen.queryByRole('button', { name: 'agua' })).toBeNull();
    expect(screen.getByRole('button', { name: 'hola' })).toBeInTheDocument();
    expect(within(columna).getByRole('button', { name: 'Carpeta Necesidades' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('al elegir una palabra de una carpeta se agrega a la frase y vuelve sola al principal', async () => {
    abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Carpeta Necesidades' }));
    await userEvent.click(screen.getByRole('button', { name: 'agua' }));
    expect(frase()).toEqual(['agua']);
    expect(screen.getByRole('button', { name: 'Carpeta Necesidades' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('button', { name: 'agua' })).toBeNull();
    expect(screen.getByRole('button', { name: 'hola' })).toBeInTheDocument();
  });

  it('si la docente lo desactiva, se queda en la carpeta', async () => {
    estado.volverAlElegir = false;
    abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Carpeta Necesidades' }));
    await userEvent.click(screen.getByRole('button', { name: 'agua' }));
    expect(screen.getByRole('button', { name: 'comer' })).toBeInTheDocument();
  });

  it('elegir una palabra núcleo no cambia de tablero', async () => {
    abrir();
    await userEvent.click(screen.getByRole('button', { name: 'quiero' }));
    expect(frase()).toEqual(['quiero']);
    expect(screen.getByRole('button', { name: 'Carpeta Personas' })).toBeInTheDocument();
  });

  it('la flecha vuelve al principal desde una carpeta y solo en el principal cierra el tablero', async () => {
    abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Carpeta Emociones' }));
    await userEvent.click(screen.getByRole('button', { name: 'Volver al tablero principal' }));
    expect(cerrar).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Carpeta Emociones' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(cerrar).toHaveBeenCalledTimes(1);
  });

  it('la frase armada se conserva al entrar y salir de una carpeta', async () => {
    abrir();
    await userEvent.click(screen.getByRole('button', { name: 'quiero' }));
    await userEvent.click(screen.getByRole('button', { name: 'Carpeta Necesidades' }));
    await userEvent.click(screen.getByRole('button', { name: 'Volver al tablero principal' }));
    expect(frase()).toEqual(['quiero']);
  });
});
