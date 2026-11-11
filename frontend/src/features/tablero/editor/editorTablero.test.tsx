import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { catalogo } from '@/features/tablero/catalogoDePrueba';
import { EditorTablero } from '@/features/tablero/editor/EditorTablero';
import { descargarDibujo, reducirImagen } from '@/features/tablero/imagenes';
import { CATEGORIAS_INICIALES, construirPlantillaGeneral } from '@/features/tablero/plantillaGeneral';
import type { Pictograma, Tablero } from '@/types';

// Un almacén en memoria con las firmas de la capa de datos, y un aviso a quien está mirando cuando algo cambia.
const { almacen, oyentes, guardados, categoriasGuardadas } = vi.hoisted(() => ({
  almacen: new Map<string, unknown>(),
  oyentes: new Set<() => void>(),
  guardados: [] as unknown[],
  categoriasGuardadas: { lista: [] as unknown[] },
}));
const avisar = () => oyentes.forEach((f) => f());

vi.mock('@/api', async () => {
  const { useEffect, useState } = await import('react');
  const { catalogo } = await import('@/features/tablero/catalogoDePrueba');
  const alumnos = [
    { id: 'ana', nombre: 'Ana', apellido: 'Pérez' },
    { id: 'luis', nombre: 'Luis', apellido: 'Soto' },
  ];
  /** Una lectura que se vuelve a hacer cada vez que el almacén avisa de un cambio, como las consultas en vivo. */
  const useReactivo = <T,>(leer: () => T): T => {
    const [valor, setValor] = useState(leer);
    useEffect(() => {
      const volver = () => setValor(leer());
      oyentes.add(volver);
      return () => {
        oyentes.delete(volver);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return valor;
  };
  return {
    useAlumnos: () => alumnos,
    useCategorias: () => useReactivo(() => [...categoriasGuardadas.lista]),
    useTodosLosTableros: () => useReactivo(() => [...almacen.values()]),
    guardarCategorias: async (guardar: { id: string }[], borrar: string[] = []) => {
      const mapa = new Map((categoriasGuardadas.lista as { id: string }[]).map((c) => [c.id, c]));
      borrar.forEach((id) => mapa.delete(id));
      guardar.forEach((c) => mapa.set(c.id, c));
      categoriasGuardadas.lista = [...mapa.values()].sort((a, b) => (a as unknown as { orden: number }).orden - (b as unknown as { orden: number }).orden);
      avisar();
    },
    usePictogramas: () => useReactivo(() => [...catalogo, ...(guardados as typeof catalogo)]),
    guardarPictograma: async (p: unknown) => {
      guardados.push(p);
      avisar();
    },
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

// Bajar y reducir imágenes necesita internet y un lienzo: se simula.
vi.mock('@/features/tablero/imagenes', async (original) => ({
  ...(await original<typeof import('@/features/tablero/imagenes')>()),
  descargarDibujo: vi.fn(),
  reducirImagen: vi.fn(),
}));

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
  categoriasGuardadas.lista = structuredClone(CATEGORIAS_INICIALES);
  vi.mocked(descargarDibujo).mockResolvedValue('data:image/webp;base64,QUJD');
  vi.mocked(reducirImagen).mockResolvedValue('data:image/webp;base64,Rk9UTw==');
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
    expect(guardados[0]).toMatchObject({ id: 'arasaac-123', palabra: 'galleta', imagenUrl: 'data:image/webp;base64,QUJD' } satisfies Partial<Pictograma>);
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

const plantillasGuardadas = () => ([...almacen.values()] as Tablero[]).filter((t) => t.esPlantilla && t.principal);
const elegirDestino = (valor: string) => userEvent.selectOptions(screen.getByLabelText('¿Qué tablero quieres editar?'), valor);
const crearPlantillaNueva = async (nombre: string) => {
  await userEvent.click(screen.getByRole('button', { name: 'Nueva plantilla' }));
  await userEvent.type(screen.getByLabelText('Nombre de la plantilla'), nombre);
  await userEvent.click(screen.getByRole('button', { name: 'Crear plantilla' }));
  await screen.findByText(`Plantilla «${nombre}» creada.`);
};

describe('Editor del tablero: plantillas', () => {
  it('lista las plantillas, la general primero', async () => {
    await abrir();
    const opciones = within(screen.getByRole('group', { name: 'Plantillas' })).getAllByRole('option');
    expect(opciones.map((o) => o.textContent)).toEqual(['Plantilla general (la que trae la app)']);
  });

  it('crea una plantilla copiando la general, pasa a editarla y se puede deshacer', async () => {
    await abrir();
    await crearPlantillaNueva('Para el recreo');
    expect(plantillasGuardadas().map((t) => t.nombre).sort()).toEqual(['Para el recreo', 'Plantilla general']);
    expect(screen.getByLabelText('¿Qué tablero quieres editar?')).toHaveDisplayValue('Para el recreo');
    expect(await within(carpetas()).findAllByRole('button', { name: /^Abrir la carpeta/ })).toHaveLength(5);

    await userEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(() => expect(plantillasGuardadas()).toHaveLength(1));
    expect(screen.getByLabelText('¿Qué tablero quieres editar?')).toHaveDisplayValue(/Plantilla general/);
  });

  it('editar una plantilla nueva no cambia la general', async () => {
    await abrir();
    await crearPlantillaNueva('Otra');
    await userEvent.click(await within(tablaGrande()).findByRole('button', { name: 'Quitar «hola»' }));
    await waitFor(() => expect(general().celdas.some((c) => c.id === 'celda-pic-hola')).toBe(true));
    const otra = plantillasGuardadas().find((t) => t.nombre === 'Otra');
    expect(otra?.celdas.some((c) => c.id === 'celda-pic-hola')).toBe(false);
  });

  it('no deja crear una plantilla sin nombre', async () => {
    await abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Nueva plantilla' }));
    expect(screen.getByRole('button', { name: 'Crear plantilla' })).toBeDisabled();
  });

  it('cambia el nombre de una plantilla, salvo la general', async () => {
    await abrir();
    expect(screen.queryByRole('button', { name: 'Cambiar nombre' })).toBeNull();
    await crearPlantillaNueva('Vieja');
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar nombre' }));
    const campo = screen.getByLabelText('Nombre de la plantilla');
    expect(campo).toHaveValue('Vieja');
    await userEvent.clear(campo);
    await userEvent.type(campo, 'Nueva');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar nombre' }));
    await waitFor(() => expect(plantillasGuardadas().map((t) => t.nombre)).toContain('Nueva'));
    expect(plantillasGuardadas().map((t) => t.nombre)).not.toContain('Vieja');
  });

  it('elimina una plantilla con sus carpetas, vuelve a la general y se puede recuperar; la general no se elimina', async () => {
    await abrir();
    expect(screen.queryByRole('button', { name: 'Eliminar plantilla' })).toBeNull();
    await crearPlantillaNueva('Borrar');
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar plantilla' }));
    await screen.findByText(/«Borrar» eliminada/);
    expect(plantillasGuardadas()).toHaveLength(1);
    expect(([...almacen.values()] as Tablero[]).filter((t) => t.esPlantilla)).toHaveLength(6);
    expect(screen.getByLabelText('¿Qué tablero quieres editar?')).toHaveDisplayValue(/Plantilla general/);

    await userEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    await screen.findByText(/«Borrar» recuperada/);
    expect(plantillasGuardadas()).toHaveLength(2);
    expect(screen.getByLabelText('¿Qué tablero quieres editar?')).toHaveDisplayValue('Borrar');
  });

  it('restablece la plantilla general de fábrica y se puede deshacer', async () => {
    await abrir();
    await userEvent.click(within(tablaGrande()).getByRole('button', { name: 'Quitar «hola»' }));
    await waitFor(() => expect(general().celdas.some((c) => c.id === 'celda-pic-hola')).toBe(false));
    await userEvent.click(screen.getByRole('button', { name: 'Restablecer de fábrica' }));
    await screen.findByText('La plantilla general volvió a como la trae la app.');
    await waitFor(() => expect(general().celdas.some((c) => c.id === 'celda-pic-hola')).toBe(true));
    await userEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(() => expect(general().celdas.some((c) => c.id === 'celda-pic-hola')).toBe(false));
  });

  it('«Restablecer de fábrica» solo aparece en la general', async () => {
    await abrir();
    await crearPlantillaNueva('Otra');
    expect(screen.queryByRole('button', { name: 'Restablecer de fábrica' })).toBeNull();
  });
});

describe('Editor del tablero: asignar a niños', () => {
  it('asigna una plantilla a los niños marcados, avisa y se puede deshacer', async () => {
    await abrir();
    await crearPlantillaNueva('Para Ana');
    await userEvent.click(screen.getByRole('button', { name: 'Asignar a niños' }));
    expect(screen.getByRole('radio', { name: 'Para Ana' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Asignar' })).toBeDisabled();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Ana Pérez' }));
    await userEvent.click(screen.getByRole('button', { name: 'Asignar' }));
    await screen.findByText('Plantilla «Para Ana» asignada a 1 niño.');
    expect(guardadosDeAna()).toHaveLength(6);
    expect(guardadosDeAna().find((t) => t.principal)?.copiadoDe).toBe(plantillasGuardadas().find((t) => t.nombre === 'Para Ana')?.id);

    await userEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(() => expect(guardadosDeAna()).toHaveLength(0));
  });

  it('«Todos» marca a todos los niños', async () => {
    await abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Asignar a niños' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Todos' }));
    expect(screen.getByRole('checkbox', { name: 'Ana Pérez' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Luis Soto' })).toBeChecked();
  });

  it('avisa que reemplaza el tablero propio de un niño', async () => {
    await abrir();
    await elegirDestino('alumno:ana');
    await userEvent.click(await within(tablaGrande()).findByRole('button', { name: 'Quitar «hola»' }));
    await screen.findByText(/tiene su propio tablero/);
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar de plantilla' }));
    expect(screen.getByRole('checkbox', { name: /Ana Pérez.*ya tiene tablero propio/ })).toBeChecked(); // parte con el niño que se está viendo
    expect(screen.getByText(/Un niño ya tiene tablero propio: se reemplazará/)).toBeInTheDocument();
  });

  it('desde el tablero de un niño se le cambia la plantilla', async () => {
    await abrir();
    await crearPlantillaNueva('Otra');
    await elegirDestino('alumno:ana');
    await screen.findByText(/usa la plantilla general/);
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar de plantilla' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Otra' }));
    await userEvent.click(screen.getByRole('button', { name: 'Asignar' }));
    await screen.findByText(/tiene su propio tablero/);
    expect(guardadosDeAna().find((t) => t.principal)?.nombre).toBe('Otra');
  });

  it('guarda el tablero propio de un niño como una plantilla nueva', async () => {
    await abrir();
    await elegirDestino('alumno:ana');
    expect(screen.queryByRole('button', { name: 'Guardar como plantilla' })).toBeNull(); // aún no tiene tablero propio
    await userEvent.click(await within(tablaGrande()).findByRole('button', { name: 'Quitar «hola»' }));
    await screen.findByText(/tiene su propio tablero/);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar como plantilla' }));
    expect(screen.getByText(/el tablero de Ana Pérez/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Nombre de la plantilla'), 'Como el de Ana');
    await userEvent.click(screen.getByRole('button', { name: 'Crear plantilla' }));
    await screen.findByText('Plantilla «Como el de Ana» creada.');
    const nueva = plantillasGuardadas().find((t) => t.nombre === 'Como el de Ana');
    expect(nueva?.celdas.some((c) => c.id === 'celda-pic-hola')).toBe(false); // trae lo que Ana tenía
    expect(nueva?.alumnoId).toBeUndefined();
  });
});

describe('Editor del tablero: categorías', () => {
  const abrirCategorias = async () => {
    await abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Categorías' }));
    return screen.getByRole('dialog', { name: 'Categorías' });
  };

  it('lista las categorías con su color', async () => {
    const dialogo = await abrirCategorias();
    expect(within(dialogo).getAllByRole('listitem')).toHaveLength(6);
    expect(within(dialogo).getByLabelText('Color de Necesidades')).toHaveDisplayValue('Rojo');
  });

  it('crea una categoría, que luego se puede usar al agregar una palabra', async () => {
    const dialogo = await abrirCategorias();
    await userEvent.type(within(dialogo).getByLabelText('Nueva categoría'), 'Comida');
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Agregar' }));
    await within(dialogo).findByLabelText('Nombre de la categoría Comida');
    expect(categoriasGuardadas.lista).toHaveLength(7);
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Listo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Agregar palabra' }));
    expect(within(screen.getByLabelText(/Categoría/)).getByRole('option', { name: 'Comida' })).toBeInTheDocument();
  });

  it('renombra al salir del campo y no guarda un nombre vacío', async () => {
    const dialogo = await abrirCategorias();
    const campo = within(dialogo).getByLabelText('Nombre de la categoría Acciones');
    await userEvent.clear(campo);
    await userEvent.type(campo, 'Qué hago');
    await userEvent.tab();
    await waitFor(() => expect((categoriasGuardadas.lista as { nombre: string }[]).some((c) => c.nombre === 'Qué hago')).toBe(true));
    const otro = within(dialogo).getByLabelText('Nombre de la categoría Objetos');
    await userEvent.clear(otro);
    await userEvent.tab();
    expect(otro).toHaveValue('Objetos');
  });

  it('cambia el color de una categoría y las celdas lo toman', async () => {
    const dialogo = await abrirCategorias();
    await userEvent.selectOptions(within(dialogo).getByLabelText('Color de Objetos'), 'alerta');
    await waitFor(() => expect((categoriasGuardadas.lista as { id: string; color: string }[]).find((c) => c.id === 'objetos')?.color).toBe('alerta'));
  });

  it('ordena las categorías con los botones', async () => {
    const dialogo = await abrirCategorias();
    expect(within(dialogo).getByRole('button', { name: 'Subir la categoría Necesidades' })).toBeDisabled();
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Bajar la categoría Necesidades' }));
    await waitFor(() => expect((categoriasGuardadas.lista as { nombre: string }[])[0].nombre).toBe('Emociones'));
  });

  it('no deja quitar una categoría en uso, y explica por qué; una sin uso sí se quita', async () => {
    const dialogo = await abrirCategorias();
    const enUso = within(dialogo).getByRole('button', { name: 'Quitar la categoría Acciones' });
    expect(enUso).toBeDisabled();
    expect(within(dialogo).getAllByText(/En uso en \d+ celdas: no se puede quitar/).length).toBeGreaterThan(0);

    await userEvent.type(within(dialogo).getByLabelText('Nueva categoría'), 'Vacía');
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Agregar' }));
    await userEvent.click(await within(dialogo).findByRole('button', { name: 'Quitar la categoría Vacía' }));
    await waitFor(() => expect(categoriasGuardadas.lista).toHaveLength(6));
  });
});

describe('Editor del tablero: selector de dibujos', () => {
  const abrirDialogoDePalabra = async (palabra: string) => {
    await abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Agregar palabra' }));
    if (palabra) await userEvent.type(screen.getByLabelText('Palabra'), palabra);
  };
  const entradaDeFoto = () => screen.getByLabelText('Elegir una foto de este equipo');
  const foto = (nombre = 'liceo.jpg', tipo = 'image/jpeg') => new File(['x'], nombre, { type: tipo });
  const elegirOpcionDeArasaac = () => screen.findByRole('button', { name: 'Usar la opción 1 de ARASAAC para «galleta»' }, { timeout: 2000 });

  it('un dibujo de ARASAAC se baja y se guarda para verse sin internet, y avisa', async () => {
    await abrirDialogoDePalabra('galleta');
    await userEvent.click(await elegirOpcionDeArasaac());
    expect(descargarDibujo).toHaveBeenCalledWith('https://arasaac.test/123.png');
    expect(await screen.findByText('Dibujo guardado: se verá también sin internet.')).toBeInTheDocument();
    expect(guardados[0]).toMatchObject({ id: 'arasaac-123', imagenUrl: 'data:image/webp;base64,QUJD', esFotoReal: false });
  });

  it('si no se pudo bajar, usa la dirección de internet y avisa que solo se verá con conexión', async () => {
    vi.mocked(descargarDibujo).mockResolvedValue(null);
    await abrirDialogoDePalabra('galleta');
    await userEvent.click(await elegirOpcionDeArasaac());
    expect(await screen.findByText(/solo con conexión/)).toBeInTheDocument();
    expect(guardados[0]).toMatchObject({ imagenUrl: 'https://arasaac.test/123.png' });
  });

  it('un dibujo ya guardado se reutiliza sin volver a bajarlo', async () => {
    await abrirDialogoDePalabra('galleta');
    await userEvent.click(await elegirOpcionDeArasaac());
    await screen.findByText('Dibujo guardado: se verá también sin internet.');
    await userEvent.click(screen.getByRole('button', { name: 'Usar la opción 1 de ARASAAC para «galleta»' }));
    expect(descargarDibujo).toHaveBeenCalledTimes(1);
    expect(guardados).toHaveLength(1);
  });

  it('muestra la atribución de ARASAAC junto a sus dibujos y al pie de la página', async () => {
    await abrirDialogoDePalabra('galleta');
    await elegirOpcionDeArasaac();
    const creditos = screen.getAllByText(/Pictogramas:/);
    expect(creditos.length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole('link', { name: 'ARASAAC' })[0]).toHaveAttribute('href', 'https://arasaac.org');
  });

  it('sube una foto propia: se reduce, se guarda como pictograma de foto y queda elegida', async () => {
    await abrirDialogoDePalabra('liceo');
    const archivo = foto();
    await userEvent.upload(entradaDeFoto(), archivo);
    expect(reducirImagen).toHaveBeenCalledWith(archivo);
    expect(await screen.findByText('Foto guardada.')).toBeInTheDocument();
    expect(guardados[0]).toMatchObject({ palabra: 'liceo', categoria: 'propias', imagenUrl: 'data:image/webp;base64,Rk9UTw==', esFotoReal: true });
    expect((guardados[0] as { id: string }).id).toMatch(/^foto-/);
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(await within(tablaGrande()).findByRole('button', { name: 'Editar «liceo»' })).toBeInTheDocument();
    expect(general().celdas.at(-1)?.pictogramaId).toMatch(/^foto-/);
  });

  it('sin palabra no se puede subir una foto, y lo explica', async () => {
    await abrirDialogoDePalabra('');
    expect(screen.getByRole('button', { name: 'Subir una foto' })).toBeDisabled();
    expect(screen.getByText('Escribe primero la palabra para poder subir su foto.')).toBeInTheDocument();
  });

  it('avisa que no se suban fotos de niños', async () => {
    await abrirDialogoDePalabra('liceo');
    expect(screen.getByText(/No subas fotos de niños/)).toBeInTheDocument();
  });

  it('rechaza lo que no es una imagen y las fotos demasiado pesadas, sin guardar nada', async () => {
    await abrirDialogoDePalabra('liceo');
    fireEvent.change(entradaDeFoto(), { target: { files: [foto('lista.pdf', 'application/pdf')] } });
    expect(await screen.findByText(/no es una imagen/)).toBeInTheDocument();
    const pesada = foto();
    Object.defineProperty(pesada, 'size', { value: 11 * 1024 * 1024 });
    fireEvent.change(entradaDeFoto(), { target: { files: [pesada] } });
    expect(await screen.findByText(/más de 10 MB/)).toBeInTheDocument();
    expect(reducirImagen).not.toHaveBeenCalled();
    expect(guardados).toHaveLength(0);
  });

  it('si la foto no se puede preparar, avisa y no guarda nada', async () => {
    vi.mocked(reducirImagen).mockRejectedValue(new Error('imagen rota'));
    await abrirDialogoDePalabra('liceo');
    await userEvent.upload(entradaDeFoto(), foto());
    expect(await screen.findByText('No se pudo usar esa foto. Prueba con otra.')).toBeInTheDocument();
    expect(guardados).toHaveLength(0);
  });

  it('las fotos ya subidas quedan en «Mis fotos» para volver a usarlas', async () => {
    await abrirDialogoDePalabra('liceo');
    await userEvent.upload(entradaDeFoto(), foto());
    await screen.findByText('Foto guardada.');
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Agregar palabra' }));
    const mis = await screen.findByRole('region', { name: 'Mis fotos' });
    await userEvent.click(within(mis).getByRole('button', { name: 'Usar mi foto de «liceo»' }));
    expect(screen.getByText('Dibujo elegido para «liceo».')).toBeInTheDocument();
  });
});
