import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { catalogo } from '@/features/tablero/catalogoDePrueba';
import { EditorTablero } from '@/features/tablero/editor/EditorTablero';
import { construirPlantillaGeneral } from '@/features/tablero/plantillaGeneral';
import type { Pictograma, Tablero } from '@/types';

// Un almacén en memoria con las firmas de la capa de datos, y un aviso a quien está mirando cuando algo cambia.
const { almacen, oyentes, guardados } = vi.hoisted(() => ({
  almacen: new Map<string, unknown>(),
  oyentes: new Set<() => void>(),
  guardados: [] as unknown[],
}));
const avisar = () => oyentes.forEach((f) => f());

vi.mock('@/api', async () => {
  const { CATEGORIAS_INICIALES } = await import('@/features/tablero/plantillaGeneral');
  const { catalogo } = await import('@/features/tablero/catalogoDePrueba');
  return {
    useAlumnos: () => [{ id: 'ana', nombre: 'Ana', apellido: 'Pérez' }],
    useCategorias: () => CATEGORIAS_INICIALES,
    usePictogramas: () => catalogo,
    guardarPictograma: async (p: unknown) => void guardados.push(p),
    obtenerTablero: async (id: string) => almacen.get(id),
    obtenerTableros: async (ids: string[]) => ids.map((id) => almacen.get(id)).filter(Boolean),
    tablerosDeAlumno: async (alumnoId: string) => [...almacen.values()].filter((t) => (t as Tablero).alumnoId === alumnoId),
    borrarTablerosDeAlumno: async (alumnoId: string) => {
      for (const [id, t] of almacen) if ((t as Tablero).alumnoId === alumnoId) almacen.delete(id);
      avisar();
    },
    guardarTableros: async (guardar: Tablero[], borrar: string[] = []) => {
      borrar.forEach((id) => almacen.delete(id));
      guardar.forEach((t) => almacen.set(t.id, structuredClone(t)));
      avisar();
    },
  };
});

// La lectura reactiva: vuelve a cargar cada vez que el almacén avisa de un cambio.
vi.mock('@/features/tablero/useConjuntoEditable', async () => {
  const { useEffect, useState } = await import('react');
  const { cargarConjunto } = await import('@/features/tablero/gestionTableros');
  return {
    useConjuntoEditable: (destino: Parameters<typeof cargarConjunto>[0]) => {
      const [valor, setValor] = useState<Awaited<ReturnType<typeof cargarConjunto>>>();
      const clave = JSON.stringify(destino);
      useEffect(() => {
        let vigente = true;
        const cargar = () => void cargarConjunto(destino).then((r) => vigente && setValor(r));
        cargar();
        oyentes.add(cargar);
        return () => {
          vigente = false;
          oyentes.delete(cargar);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [clave]);
      return valor;
    },
  };
});

vi.mock('@/features/tablero/arasaac', () => ({
  searchArasaacPictograms: vi.fn(async (palabra: string) => (palabra === 'galleta' ? [{ id: 123, url: 'https://arasaac.test/123.png' }] : [])),
}));

const guardadosDeAna = () => [...almacen.values()].filter((t) => (t as Tablero).alumnoId === 'ana') as Tablero[];
const general = () => almacen.get('plantilla-general') as Tablero;
const carpeta = (nombre: string) => ([...almacen.values()] as Tablero[]).find((t) => t.nombre === nombre && !t.alumnoId);
const nombresDe = (t?: Tablero) => (t?.celdas ?? []).map((c) => c.textoMostrado);

const abrir = async () => {
  render(<EditorTablero />);
  await screen.findByRole('button', { name: 'Agregar palabra' });
};
const tablaGrande = () => screen.getByRole('region', { name: /Tablero principal|Carpeta/ });
const carpetas = () => screen.getByRole('navigation', { name: 'Carpetas' });
const abrirCarpeta = (nombre: string) => userEvent.click(within(carpetas()).getByRole('button', { name: new RegExp(`Abrir la carpeta «${nombre}»`) }));

beforeEach(() => {
  almacen.clear();
  oyentes.clear();
  guardados.length = 0;
  construirPlantillaGeneral(catalogo).forEach((t) => almacen.set(t.id, structuredClone(t)));
});

describe('Editor del tablero: lo que se ve', () => {
  it('muestra las palabras siempre a la vista, la grilla y las carpetas', async () => {
    await abrir();
    const arriba = screen.getByRole('region', { name: 'Palabras siempre a la vista' });
    expect(within(arriba).getAllByRole('button', { name: /^Editar «/ })).toHaveLength(8);
    expect(within(tablaGrande()).getByRole('button', { name: 'Editar «hola»' })).toBeInTheDocument();
    expect(within(carpetas()).getAllByRole('button', { name: /^Abrir la carpeta/ })).toHaveLength(5);
  });

  it('al abrir una carpeta muestra sus palabras y permite volver', async () => {
    await abrir();
    await abrirCarpeta('Necesidades');
    expect(within(tablaGrande()).getByRole('button', { name: 'Editar «agua»' })).toBeInTheDocument();
    expect(within(tablaGrande()).queryByRole('button', { name: 'Editar «hola»' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Volver al tablero principal' }));
    expect(within(tablaGrande()).getByRole('button', { name: 'Editar «hola»' })).toBeInTheDocument();
  });
});

describe('Editor del tablero: agregar', () => {
  it('agrega una palabra con un dibujo de la app y queda guardada al instante', async () => {
    await abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Agregar palabra' }));
    const agregar = screen.getByRole('button', { name: 'Agregar' });
    expect(agregar).toBeDisabled(); // sin dibujo no se puede agregar
    await userEvent.type(screen.getByLabelText('Palabra'), 'agua');
    await userEvent.click(await screen.findByRole('button', { name: 'Usar el dibujo de «agua»' }));
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(await within(tablaGrande()).findByRole('button', { name: 'Editar «agua»' })).toBeInTheDocument();
    expect(nombresDe(general())).toContain('agua');
    expect(await screen.findByText('«agua» agregada. Guardado.')).toBeInTheDocument();
  });

  it('busca en ARASAAC, guarda el dibujo elegido como pictograma y lo usa', async () => {
    await abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Agregar palabra' }));
    await userEvent.type(screen.getByLabelText('Palabra'), 'galleta');
    await userEvent.click(await screen.findByRole('button', { name: 'Usar la opción 1 de ARASAAC para «galleta»' }, { timeout: 2000 }));
    expect(guardados[0]).toMatchObject({ id: 'arasaac-123', palabra: 'galleta', imagenUrl: 'https://arasaac.test/123.png' } satisfies Partial<Pictograma>);
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(await within(tablaGrande()).findByRole('button', { name: 'Editar «galleta»' })).toBeInTheDocument();
    expect(general().celdas.at(-1)).toMatchObject({ tipo: 'palabra', pictogramaId: 'arasaac-123', textoMostrado: 'galleta' });
  });

  it('avisa cuando no encuentra dibujos', async () => {
    await abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Agregar palabra' }));
    await userEvent.type(screen.getByLabelText('Palabra'), 'xyzzy');
    expect(await screen.findByText(/No encontré dibujos en ARASAAC/, {}, { timeout: 2000 })).toBeInTheDocument();
  });

  it('agrega una palabra que queda siempre a la vista', async () => {
    await abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Agregar palabra siempre a la vista' }));
    expect(screen.getByRole('checkbox', { name: /Siempre a la vista/ })).toBeChecked();
    await userEvent.type(screen.getByLabelText('Palabra'), 'agua');
    await userEvent.click(await screen.findByRole('button', { name: 'Usar el dibujo de «agua»' }));
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    const arriba = screen.getByRole('region', { name: 'Palabras siempre a la vista' });
    expect(await within(arriba).findByRole('button', { name: 'Editar «agua»' })).toBeInTheDocument();
  });

  it('dentro de una carpeta no ofrece «siempre a la vista»', async () => {
    await abrir();
    await abrirCarpeta('Necesidades');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar palabra' }));
    expect(screen.queryByRole('checkbox', { name: /Siempre a la vista/ })).toBeNull();
  });

  it('agrega una carpeta nueva, vacía, que se puede abrir', async () => {
    await abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Agregar carpeta' }));
    expect(screen.getByRole('button', { name: 'Agregar' })).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Nombre de la carpeta'), 'Comida');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    await within(carpetas()).findByRole('button', { name: /Abrir la carpeta «Comida»/ });
    await abrirCarpeta('Comida');
    expect(await screen.findByText('Aún no hay palabras aquí.')).toBeInTheDocument();
  });
});

describe('Editor del tablero: editar, mover y quitar', () => {
  it('cambia lo que se muestra y lo que dice, y lo muestra en la tarjeta', async () => {
    await abrir();
    await userEvent.click(within(tablaGrande()).getByRole('button', { name: 'Editar «hola»' }));
    const texto = screen.getByLabelText('Palabra');
    expect(texto).toHaveValue('hola');
    await userEvent.clear(texto);
    await userEvent.type(texto, 'Hola amigo');
    await userEvent.type(screen.getByLabelText(/Lo que dice el tablero/), 'Hola, ¿cómo estás?');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await within(tablaGrande()).findByRole('button', { name: 'Editar «Hola amigo»' })).toBeInTheDocument();
    expect(screen.getByText('Dice: «Hola, ¿cómo estás?»')).toBeInTheDocument();
    expect(general().celdas.find((c) => c.id === 'celda-pic-hola')).toMatchObject({ textoMostrado: 'Hola amigo', textoHablado: 'Hola, ¿cómo estás?', pictogramaId: 'pic-hola' });
  });

  it('marcar una palabra como «siempre a la vista» la sube a la fila de arriba', async () => {
    await abrir();
    await userEvent.click(within(tablaGrande()).getByRole('button', { name: 'Editar «hola»' }));
    await userEvent.click(screen.getByRole('checkbox', { name: /Siempre a la vista/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    const arriba = screen.getByRole('region', { name: 'Palabras siempre a la vista' });
    expect(await within(arriba).findByRole('button', { name: 'Editar «hola»' })).toBeInTheDocument();
  });

  it('mueve una palabra un lugar con los botones, y no ofrece mover más allá de los extremos', async () => {
    await abrir();
    await abrirCarpeta('Necesidades');
    expect(screen.getByRole('button', { name: 'Mover «agua» antes' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Mover «agua» después' }));
    await waitFor(() => expect(nombresDe(carpeta('Necesidades'))).toEqual(['comer', 'agua']));
    expect(screen.getByRole('button', { name: 'Mover «agua» después' })).toBeDisabled();
  });

  it('anuncia lo que hizo y se puede deshacer', async () => {
    await abrir();
    await abrirCarpeta('Necesidades');
    expect(screen.getByRole('button', { name: 'Deshacer' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Quitar «comer»' }));
    expect(await screen.findByText('Palabra «comer» quitada. Guardado.')).toBeInTheDocument();
    expect(nombresDe(carpeta('Necesidades'))).toEqual(['agua']);
    await userEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(() => expect(nombresDe(carpeta('Necesidades'))).toEqual(['agua', 'comer']));
    expect(screen.getByText('Cambio deshecho.')).toBeInTheDocument();
  });

  it('quitar una carpeta con palabras la quita con todo su contenido, y deshacer la devuelve completa', async () => {
    await abrir();
    await userEvent.click(within(carpetas()).getByRole('button', { name: 'Quitar «Acciones»' }));
    await waitFor(() => expect(carpeta('Acciones')).toBeUndefined());
    expect(within(carpetas()).queryByRole('button', { name: /Abrir la carpeta «Acciones»/ })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(() => expect(nombresDe(carpeta('Acciones'))).toEqual(['abrazo', 'jugar']));
  });

  it('arrastrar una palabra sobre una carpeta la pasa a esa carpeta', async () => {
    await abrir();
    const origen = within(tablaGrande()).getByRole('button', { name: 'Editar «hola»' }).closest('li') as HTMLElement;
    const destino = within(carpetas()).getByRole('button', { name: /Abrir la carpeta «Personas»/ }).closest('li') as HTMLElement;
    const dataTransfer = { setData: vi.fn(), effectAllowed: '' };
    fireEvent.dragStart(origen, { dataTransfer });
    fireEvent.dragOver(destino, { dataTransfer });
    fireEvent.drop(destino, { dataTransfer });
    await waitFor(() => expect(nombresDe(carpeta('Personas'))).toContain('hola'));
    expect(general().celdas.some((c) => c.id === 'celda-pic-hola')).toBe(false);
  });

  it('arrastrar una palabra sobre otra de la misma carpeta toma su lugar', async () => {
    await abrir();
    await abrirCarpeta('Necesidades');
    const lista = within(tablaGrande());
    const agua = lista.getByRole('button', { name: 'Editar «agua»' }).closest('li') as HTMLElement;
    const comer = lista.getByRole('button', { name: 'Editar «comer»' }).closest('li') as HTMLElement;
    const dataTransfer = { setData: vi.fn(), effectAllowed: '' };
    fireEvent.dragStart(agua, { dataTransfer });
    fireEvent.drop(comer, { dataTransfer });
    await waitFor(() => expect(nombresDe(carpeta('Necesidades'))).toEqual(['comer', 'agua']));
  });
});

describe('Editor del tablero: el tablero de un niño', () => {
  const elegirANa = async () => {
    await userEvent.selectOptions(screen.getByLabelText('¿Qué tablero quieres editar?'), 'alumno:ana');
    await screen.findByText(/usa la plantilla general/);
  };

  it('un niño sin tablero propio usa la plantilla general y no se escribe nada al mirarlo', async () => {
    await abrir();
    const antes = almacen.size;
    await elegirANa();
    expect(almacen.size).toBe(antes);
    expect(screen.queryByRole('button', { name: /Restablecer/ })).toBeNull();
  });

  it('el primer cambio le crea su tablero propio sin tocar la plantilla general', async () => {
    await abrir();
    await elegirANa();
    const generalAntes = JSON.stringify(general());
    await userEvent.click(within(tablaGrande()).getByRole('button', { name: 'Quitar «hola»' }));
    await screen.findByText(/tiene su propio tablero/);
    expect(guardadosDeAna()).toHaveLength(6);
    expect(JSON.stringify(general())).toBe(generalAntes);
    expect(within(tablaGrande()).queryByRole('button', { name: 'Editar «hola»' })).toBeNull();
  });

  it('«Restablecer a la plantilla» le devuelve la plantilla general y se puede deshacer', async () => {
    await abrir();
    await elegirANa();
    await userEvent.click(within(tablaGrande()).getByRole('button', { name: 'Quitar «hola»' }));
    await userEvent.click(await screen.findByRole('button', { name: /Restablecer a la plantilla/ }));
    await screen.findByText(/usa la plantilla general/);
    expect(guardadosDeAna()).toHaveLength(0);
    expect(within(tablaGrande()).getByRole('button', { name: 'Editar «hola»' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    await screen.findByText(/tiene su propio tablero/);
    expect(guardadosDeAna()).toHaveLength(6);
  });

  it('al cambiar de tablero se limpia lo que se estaba haciendo', async () => {
    await abrir();
    await abrirCarpeta('Necesidades');
    await userEvent.click(screen.getByRole('button', { name: 'Quitar «comer»' }));
    await userEvent.selectOptions(screen.getByLabelText('¿Qué tablero quieres editar?'), 'alumno:ana');
    await screen.findByText(/usa la plantilla general/);
    expect(screen.getByRole('button', { name: 'Deshacer' })).toBeDisabled();
    expect(within(tablaGrande()).getByRole('button', { name: 'Editar «hola»' })).toBeInTheDocument();
  });
});

describe('Editor del tablero: probar', () => {
  it('«Probar el tablero» abre el tablero real', async () => {
    const { useTableroStore } = await import('@/shared/store/useTableroStore');
    useTableroStore.setState({ abierto: false });
    await abrir();
    await userEvent.click(screen.getByRole('button', { name: /Probar el tablero/ }));
    expect(useTableroStore.getState().abierto).toBe(true);
    act(() => useTableroStore.setState({ abierto: false }));
  });
});
