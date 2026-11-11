import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TableroSAAC } from '@/features/tablero/components/TableroSAAC';
import { useAuthStore } from '@/shared/store/useAuthStore';
import { useTableroStore } from '@/shared/store/useTableroStore';

const { decir, estado, registro } = vi.hoisted(() => ({
  decir: vi.fn<(elementos: unknown[]) => Promise<void>>(async () => {}),
  registro: vi.fn<(datos: unknown) => void>(),
  estado: { volverAlElegir: true, editada: false },
}));

vi.mock('@/shared/audio/decirSecuencia', () => ({ decirSecuencia: decir }));
vi.mock('@/shared/audio/sonidos', () => ({ sonarToque: vi.fn(), sonarAcierto: vi.fn() }));
vi.mock('@/shared/components/LluviaEstrellas', () => ({ LluviaEstrellas: () => null }));
// Los mocks se ejecutan antes que los imports de arriba: lo que necesitan se importa dentro de cada uno.
vi.mock('@/api', async (original) => {
  const { catalogo } = await import('@/features/tablero/catalogoDePrueba');
  return { ...(await original<typeof import('@/api')>()), usePictogramas: () => catalogo, crearRegistro: registro };
});
vi.mock('@/features/tablero/useTableroDelNino', async (original) => {
  const real = await original<typeof import('@/features/tablero/useTableroDelNino')>();
  const { catalogo } = await import('@/features/tablero/catalogoDePrueba');
  const { CATEGORIAS_INICIALES, construirPlantillaGeneral } = await import('@/features/tablero/plantillaGeneral');
  const { actualizarCelda, armarConjunto, tablerosDelConjunto } = await import('@/features/tablero/edicionTablero');
  const deFabrica = construirPlantillaGeneral(catalogo);
  // Con `editada`, la docente le cambió a «agua» lo que se muestra y lo que se dice
  const editada = tablerosDelConjunto(
    actualizarCelda(armarConjunto(deFabrica[0], deFabrica), 'plantilla-general-necesidades', 'celda-pic-agua', { textoMostrado: 'Agüita', textoHablado: 'Quiero agua' }),
  );
  // Se arma una sola vez: el componente la pide en cada render y debe recibir siempre el mismo objeto.
  let armado: ReturnType<typeof real.resolverTableroDelNino> | undefined;
  let armadoCon: string | undefined;
  const useTableroDelNino = () => {
    const clave = `${estado.volverAlElegir}-${estado.editada}`;
    if (!armado || armadoCon !== clave) {
      armadoCon = clave;
      const plantilla = estado.editada ? editada : deFabrica;
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
  estado.editada = false;
  useTableroStore.setState({ abierto: true, frase: [] });
  useAuthStore.setState({ activeStudentId: null, supervision: false });
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

describe('Lo que editó la docente', () => {
  it('el niño ve el texto editado, y al tocarlo se dice lo que ella escribió, sin la grabación del pictograma', async () => {
    estado.editada = true;
    abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Carpeta Necesidades' }));
    expect(screen.queryByRole('button', { name: 'agua' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Agüita' }));
    expect(decir).toHaveBeenLastCalledWith([{ texto: 'Quiero agua', audioUrl: undefined }]);
    expect(useTableroStore.getState().frase[0]).toMatchObject({ palabra: 'Agüita', textoHablado: 'Quiero agua', id: 'pic-agua' });
  });

  it('una palabra que no se editó conserva su grabación', async () => {
    estado.editada = true;
    abrir();
    await userEvent.click(screen.getByRole('button', { name: 'quiero' }));
    expect(decir).toHaveBeenLastCalledWith([expect.objectContaining({ texto: 'quiero' })]);
  });
});

describe('Teclado', () => {
  const nombreDeTecla = (c: string) => (c === ' ' ? 'Espacio' : /[0-9]/.test(c) ? `Número ${c}` : `Letra ${c.toUpperCase()}`);
  const teclear = async (texto: string) => {
    for (const c of texto) await userEvent.click(screen.getByRole('button', { name: nombreDeTecla(c) }));
  };
  const abrirTeclado = async () => {
    abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Abrir el teclado para escribir' }));
  };
  const frasePalabras = () => useTableroStore.getState().frase.map((p) => ({ palabra: p.palabra, escrita: Boolean(p.esTexto) }));
  const ultimaVoz = () => decir.mock.calls.at(-1)?.[0];

  it('un botón abre el teclado en lugar del tablero; las palabras de siempre se quedan', async () => {
    await abrirTeclado();
    const teclado = screen.getByRole('group', { name: 'Teclado' });
    expect(within(teclado).getAllByRole('button').length).toBeGreaterThan(37); // 37 teclas + espacio, borrar y enter
    expect(screen.queryByRole('navigation', { name: 'Carpetas' })).toBeNull();
    expect(screen.getByRole('button', { name: 'quiero' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar el teclado' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('la flecha de volver cierra primero el teclado y no el tablero', async () => {
    await abrirTeclado();
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.queryByRole('group', { name: 'Teclado' })).toBeNull();
    expect(cerrar).not.toHaveBeenCalled();
    expect(screen.getByRole('navigation', { name: 'Carpetas' })).toBeInTheDocument();
  });

  it('cada letra suena con su sonido y se ve lo que se va escribiendo', async () => {
    await abrirTeclado();
    await userEvent.click(screen.getByRole('button', { name: 'Letra M' }));
    expect(ultimaVoz()).toEqual([{ texto: 'm', audioUrl: '/audio/fonemas/m.mp3' }]);
    await teclear('a');
    expect(screen.getByLabelText('Escribiendo ma')).toBeInTheDocument();
  });

  it('un número suena con su grabación', async () => {
    await abrirTeclado();
    await userEvent.click(screen.getByRole('button', { name: 'Número 3' }));
    expect(ultimaVoz()).toEqual([{ texto: '3', audioUrl: '/audio/textos/tres.mp3' }]);
  });

  it('con el espacio la palabra pasa a la frase y suena entera', async () => {
    await abrirTeclado();
    await teclear('mesa ');
    expect(frasePalabras()).toEqual([{ palabra: 'mesa', escrita: true }]);
    expect(ultimaVoz()).toEqual([{ texto: 'mesa', audioUrl: expect.stringMatching(/mesa\.mp3$/) }]);
    expect(screen.queryByLabelText(/^Escribiendo/)).toBeNull();
  });

  it('el espacio sin letras no agrega nada', async () => {
    await abrirTeclado();
    await teclear(' ');
    expect(frasePalabras()).toEqual([]);
  });

  it('se mezclan dibujos y palabras escritas en el orden en que se armaron', async () => {
    await abrirTeclado();
    await userEvent.click(screen.getByRole('button', { name: 'quiero' }));
    await teclear('pan ');
    await userEvent.click(screen.getByRole('button', { name: 'yo' }));
    expect(frasePalabras()).toEqual([
      { palabra: 'quiero', escrita: false },
      { palabra: 'pan', escrita: true },
      { palabra: 'yo', escrita: false },
    ]);
  });

  it('al tocar un dibujo con una palabra a medias, esa palabra queda antes del dibujo', async () => {
    await abrirTeclado();
    await teclear('ab');
    await userEvent.click(screen.getByRole('button', { name: 'yo' }));
    expect(frasePalabras()).toEqual([
      { palabra: 'ab', escrita: true },
      { palabra: 'yo', escrita: false },
    ]);
  });

  it('borrar quita la última letra y, sin letras, la última palabra de la frase', async () => {
    await abrirTeclado();
    await teclear('ma');
    await userEvent.click(screen.getByRole('button', { name: 'Borrar' }));
    expect(screen.getByLabelText('Escribiendo m')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Borrar' }));
    expect(screen.queryByLabelText(/^Escribiendo/)).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'quiero' }));
    await userEvent.click(screen.getByRole('button', { name: 'Borrar' }));
    expect(frasePalabras()).toEqual([]);
  });

  it('el botón de borrar de la burbuja borra primero lo que se está escribiendo', async () => {
    await abrirTeclado();
    await userEvent.click(screen.getByRole('button', { name: 'quiero' }));
    await teclear('xy');
    await userEvent.click(screen.getByRole('button', { name: 'Borrar lo que escribí' }));
    expect(screen.queryByLabelText(/^Escribiendo/)).toBeNull();
    expect(frasePalabras()).toEqual([{ palabra: 'quiero', escrita: false }]);
  });

  it('Enter incluye la palabra a medias y hace que el osito diga toda la frase', async () => {
    await abrirTeclado();
    await userEvent.click(screen.getByRole('button', { name: 'quiero' }));
    await teclear('sol');
    await userEvent.click(screen.getByRole('button', { name: 'Enter: que el osito diga lo escrito' }));
    expect(frasePalabras()).toEqual([
      { palabra: 'quiero', escrita: false },
      { palabra: 'sol', escrita: true },
    ]);
    expect(ultimaVoz()).toEqual([expect.objectContaining({ texto: 'quiero' }), { texto: 'sol', audioUrl: undefined }]);
  });

  it('también se escribe con el teclado del computador', async () => {
    await abrirTeclado();
    await userEvent.keyboard('hola ');
    expect(frasePalabras()).toEqual([{ palabra: 'hola', escrita: true }]);
    await userEvent.keyboard('{Backspace}');
    expect(frasePalabras()).toEqual([]);
    await userEvent.keyboard('sí');
    expect(screen.getByLabelText('Escribiendo si')).toBeInTheDocument();
    await userEvent.keyboard('{Enter}');
    expect(frasePalabras()).toEqual([{ palabra: 'si', escrita: true }]);
  });

  it('el espacio del computador no activa el botón que tenga el foco', async () => {
    await abrirTeclado();
    await userEvent.keyboard(' ');
    expect(screen.getByRole('button', { name: 'Cerrar el teclado' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('con el teclado cerrado, escribir en el computador no hace nada', async () => {
    abrir();
    await userEvent.keyboard('hola ');
    expect(frasePalabras()).toEqual([]);
  });

  it('Escape cierra primero el teclado y luego el tablero', async () => {
    await abrirTeclado();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('group', { name: 'Teclado' })).toBeNull();
    expect(cerrar).not.toHaveBeenCalled();
    await userEvent.keyboard('{Escape}');
    expect(cerrar).toHaveBeenCalledTimes(1);
  });

  it('una palabra no pasa de 20 letras', async () => {
    await abrirTeclado();
    await teclear('a'.repeat(25));
    expect(screen.getByLabelText(`Escribiendo ${'a'.repeat(20)}`)).toBeInTheDocument();
  });

  it('la frase no pasa de 8 palabras, escritas o no', async () => {
    await abrirTeclado();
    await teclear('a b c d e f g h i ');
    expect(frasePalabras()).toHaveLength(8);
  });

  it('lo que el niño escribe no se guarda en el registro: solo cuántas palabras', async () => {
    useAuthStore.setState({ activeStudentId: 'ana', supervision: false });
    await abrirTeclado();
    await userEvent.click(screen.getByRole('button', { name: 'quiero' }));
    await teclear('secreto ');
    await userEvent.click(screen.getByRole('button', { name: 'Que el osito lo diga' }));
    expect(registro).toHaveBeenCalledTimes(1);
    const guardado = registro.mock.calls[0][0] as { detalle: string; pictogramaIds: string[] };
    expect(guardado.detalle).toBe('Tablero: «quiero …» (teclado: 1 palabra)');
    expect(JSON.stringify(guardado)).not.toContain('secreto');
    expect(guardado.pictogramaIds).toEqual(['pic-quiero']);
  });

  it('el altavoz de la burbuja funciona con una palabra a medias', async () => {
    await abrirTeclado();
    expect(screen.getByRole('button', { name: 'Que el osito lo diga' })).toBeDisabled();
    await teclear('sol');
    expect(screen.getByRole('button', { name: 'Que el osito lo diga' })).toBeEnabled();
  });
});
