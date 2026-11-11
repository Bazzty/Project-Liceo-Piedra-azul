import { beforeEach, describe, expect, it, vi } from 'vitest';
import { catalogo } from '@/features/tablero/catalogoDePrueba';
import { actualizarCelda, agregarCarpeta, armarConjunto, nuevaCeldaPalabra, agregarCelda, quitarCelda } from '@/features/tablero/edicionTablero';
import {
  asignarPlantilla,
  cargarConjunto,
  crearPlantilla,
  eliminarPlantilla,
  guardarCambio,
  idDeCopia,
  restablecerAlumno,
  restablecerPlantillaGeneral,
} from '@/features/tablero/gestionTableros';
import { construirPlantillaGeneral, ID_PLANTILLA_GENERAL } from '@/features/tablero/plantillaGeneral';
import type { Tablero } from '@/types';

// Un almacén en memoria con las mismas firmas que la capa de datos real.
const { almacen } = vi.hoisted(() => ({ almacen: new Map<string, unknown>() }));
vi.mock('@/api', () => ({
  obtenerTablero: async (id: string) => almacen.get(id),
  obtenerTableros: async (ids: string[]) => ids.map((id) => almacen.get(id)).filter(Boolean),
  tablerosDeAlumno: async (alumnoId: string) => [...almacen.values()].filter((t) => (t as Tablero).alumnoId === alumnoId),
  borrarTablerosDeAlumno: async (alumnoId: string) => {
    for (const [id, t] of almacen) if ((t as Tablero).alumnoId === alumnoId) almacen.delete(id);
  },
  guardarTableros: async (guardar: Tablero[], borrar: string[] = []) => {
    borrar.forEach((id) => almacen.delete(id));
    guardar.forEach((t) => almacen.set(t.id, structuredClone(t)));
  },
}));

const fabrica = () => construirPlantillaGeneral(catalogo);
const guardados = () => [...almacen.values()] as Tablero[];
const deAlumno = (alumnoId: string) => guardados().filter((t) => t.alumnoId === alumnoId);
const plantillas = () => guardados().filter((t) => t.esPlantilla);

beforeEach(() => {
  almacen.clear();
  fabrica().forEach((t) => almacen.set(t.id, structuredClone(t)));
});

describe('cargarConjunto', () => {
  it('una plantilla se carga con sus carpetas', async () => {
    const r = await cargarConjunto({ tipo: 'plantilla', id: ID_PLANTILLA_GENERAL });
    expect(r?.conjunto.carpetas).toHaveLength(5);
    expect(r?.copiaPropia).toBe(false);
  });

  it('una plantilla que no existe devuelve nada', async () => {
    expect(await cargarConjunto({ tipo: 'plantilla', id: 'no-existe' })).toBeUndefined();
  });

  it('un niño sin copia ve una copia virtual de la general y no se escribe nada', async () => {
    const antes = almacen.size;
    const r = await cargarConjunto({ tipo: 'alumno', alumnoId: 'ana' });
    expect(r?.copiaPropia).toBe(false);
    expect(r?.conjunto.principal.id).toBe(idDeCopia('ana', ID_PLANTILLA_GENERAL));
    expect(r?.conjunto.principal.alumnoId).toBe('ana');
    expect(almacen.size).toBe(antes);
  });

  it('los ids de la copia virtual son los mismos que tendrá una vez guardada', async () => {
    const virtual = await cargarConjunto({ tipo: 'alumno', alumnoId: 'ana' });
    if (!virtual) throw new Error('sin conjunto');
    await guardarCambio(virtual.conjunto, virtual.conjunto);
    const guardada = await cargarConjunto({ tipo: 'alumno', alumnoId: 'ana' });
    expect(guardada?.copiaPropia).toBe(true);
    expect(guardada?.conjunto.principal.id).toBe(virtual.conjunto.principal.id);
    expect(guardada?.conjunto.carpetas.map((t) => t.id)).toEqual(virtual.conjunto.carpetas.map((t) => t.id));
  });
});

describe('guardarCambio: la copia propia nace en la primera edición', () => {
  it('editar el tablero de un niño no cambia la plantilla general ni a otros niños', async () => {
    const general = JSON.stringify(guardados().filter((t) => t.esPlantilla));
    const r = await cargarConjunto({ tipo: 'alumno', alumnoId: 'ana' });
    if (!r) throw new Error('sin conjunto');
    const editado = actualizarCelda(r.conjunto, r.conjunto.carpetas[0].id, r.conjunto.carpetas[0].celdas[0].id, { textoMostrado: 'Agüita' });
    await guardarCambio(r.conjunto, editado);

    expect(deAlumno('ana')).toHaveLength(6);
    expect(JSON.stringify(guardados().filter((t) => t.esPlantilla))).toBe(general);
    const otro = await cargarConjunto({ tipo: 'alumno', alumnoId: 'luis' });
    expect(otro?.conjunto.carpetas[0].celdas[0].textoMostrado).toBe('agua');
    const suyo = await cargarConjunto({ tipo: 'alumno', alumnoId: 'ana' });
    expect(suyo?.conjunto.carpetas[0].celdas[0].textoMostrado).toBe('Agüita');
  });

  it('quitar una carpeta borra su tablero guardado', async () => {
    const r = await cargarConjunto({ tipo: 'alumno', alumnoId: 'ana' });
    if (!r) throw new Error('sin conjunto');
    await guardarCambio(r.conjunto, r.conjunto);
    const actual = (await cargarConjunto({ tipo: 'alumno', alumnoId: 'ana' }))?.conjunto;
    if (!actual) throw new Error('sin conjunto');
    const sin = quitarCelda(actual, actual.principal.id, 'carpeta-acciones');
    await guardarCambio(actual, sin);
    expect(deAlumno('ana')).toHaveLength(5);
    expect(deAlumno('ana').some((t) => t.nombre === 'Acciones')).toBe(false);
  });

  it('agregar una carpeta y una palabra queda guardado', async () => {
    const r = await cargarConjunto({ tipo: 'plantilla', id: ID_PLANTILLA_GENERAL });
    if (!r) throw new Error('sin conjunto');
    const conCarpeta = agregarCarpeta(r.conjunto, { nombre: 'Comida', categoriaId: 'necesidades' });
    const nueva = conCarpeta.carpetas.at(-1);
    if (!nueva) throw new Error('sin carpeta');
    const conPalabra = agregarCelda(conCarpeta, nueva.id, nuevaCeldaPalabra({ pictogramaId: 'pic-pan', textoMostrado: 'pan', categoriaId: 'necesidades' }));
    await guardarCambio(r.conjunto, conPalabra);
    const de_nuevo = await cargarConjunto({ tipo: 'plantilla', id: ID_PLANTILLA_GENERAL });
    expect(de_nuevo?.conjunto.carpetas).toHaveLength(6);
    expect(de_nuevo?.conjunto.carpetas.at(-1)?.celdas[0].textoMostrado).toBe('pan');
  });
});

describe('plantillas', () => {
  it('crearPlantilla copia la general con otro nombre y no la modifica', async () => {
    const general = JSON.stringify(plantillas());
    const id = await crearPlantilla('  Para comer  ');
    expect(id).toBeDefined();
    const r = await cargarConjunto({ tipo: 'plantilla', id: id as string });
    expect(r?.conjunto.principal).toMatchObject({ nombre: 'Para comer', esPlantilla: true, principal: true });
    expect(r?.conjunto.carpetas).toHaveLength(5);
    expect(plantillas()).toHaveLength(12);
    expect(JSON.stringify(plantillas().filter((t) => !t.id.startsWith('tablero-')))).toBe(general);
  });

  it('las carpetas de la plantilla nueva son suyas: editar una no cambia la otra', async () => {
    const id = (await crearPlantilla('Otra')) as string;
    const r = await cargarConjunto({ tipo: 'plantilla', id });
    if (!r) throw new Error('sin conjunto');
    const editado = quitarCelda(r.conjunto, r.conjunto.carpetas[0].id, r.conjunto.carpetas[0].celdas[0].id);
    await guardarCambio(r.conjunto, editado);
    const general = await cargarConjunto({ tipo: 'plantilla', id: ID_PLANTILLA_GENERAL });
    expect(general?.conjunto.carpetas[0].celdas).toHaveLength(2);
  });

  it('un nombre vacío usa el de la plantilla de origen', async () => {
    const id = (await crearPlantilla('   ')) as string;
    expect((await cargarConjunto({ tipo: 'plantilla', id }))?.conjunto.principal.nombre).toBe('Plantilla general');
  });

  it('se puede crear una plantilla a partir de otra', async () => {
    const primera = (await crearPlantilla('Primera')) as string;
    const segunda = (await crearPlantilla('Segunda', primera)) as string;
    expect((await cargarConjunto({ tipo: 'plantilla', id: segunda }))?.conjunto.principal.copiadoDe).toBe(primera);
  });

  it('crear desde una plantilla que no existe devuelve nada', async () => {
    expect(await crearPlantilla('x', 'no-existe')).toBeUndefined();
  });

  it('eliminarPlantilla borra la plantilla y sus carpetas', async () => {
    const id = (await crearPlantilla('Borrar')) as string;
    await eliminarPlantilla(id);
    expect(await cargarConjunto({ tipo: 'plantilla', id })).toBeUndefined();
    expect(plantillas()).toHaveLength(6);
  });

  it('la plantilla general no se puede eliminar', async () => {
    await expect(eliminarPlantilla(ID_PLANTILLA_GENERAL)).rejects.toThrow();
    expect(plantillas()).toHaveLength(6);
  });

  it('eliminar algo que no es una plantilla no hace nada', async () => {
    const r = await cargarConjunto({ tipo: 'alumno', alumnoId: 'ana' });
    if (!r) throw new Error('sin conjunto');
    await guardarCambio(r.conjunto, r.conjunto);
    await eliminarPlantilla(r.conjunto.principal.id);
    expect(deAlumno('ana')).toHaveLength(6);
  });
});

describe('asignar y restablecer', () => {
  it('asignarPlantilla le da al niño una copia propia de esa plantilla', async () => {
    const id = (await crearPlantilla('Para Ana')) as string;
    await asignarPlantilla('ana', id);
    const r = await cargarConjunto({ tipo: 'alumno', alumnoId: 'ana' });
    expect(r?.copiaPropia).toBe(true);
    expect(r?.conjunto.principal.copiadoDe).toBe(id);
    expect(deAlumno('ana')).toHaveLength(6);
  });

  it('asignar otra plantilla reemplaza la copia anterior sin dejar tableros sueltos', async () => {
    const a = (await crearPlantilla('A')) as string;
    const b = (await crearPlantilla('B')) as string;
    await asignarPlantilla('ana', a);
    await asignarPlantilla('ana', b);
    expect(deAlumno('ana')).toHaveLength(6);
    expect((await cargarConjunto({ tipo: 'alumno', alumnoId: 'ana' }))?.conjunto.principal.copiadoDe).toBe(b);
  });

  it('asignar la general equivale a restablecer', async () => {
    const id = (await crearPlantilla('X')) as string;
    await asignarPlantilla('ana', id);
    await asignarPlantilla('ana', ID_PLANTILLA_GENERAL);
    expect(deAlumno('ana')).toHaveLength(0);
  });

  it('restablecerAlumno borra solo lo de ese niño', async () => {
    for (const alumnoId of ['ana', 'luis']) {
      const r = await cargarConjunto({ tipo: 'alumno', alumnoId });
      if (r) await guardarCambio(r.conjunto, r.conjunto);
    }
    await restablecerAlumno('ana');
    expect(deAlumno('ana')).toHaveLength(0);
    expect(deAlumno('luis')).toHaveLength(6);
    expect((await cargarConjunto({ tipo: 'alumno', alumnoId: 'ana' }))?.copiaPropia).toBe(false);
  });

  it('tras restablecer, el niño vuelve a recibir los cambios de la plantilla general', async () => {
    const r = await cargarConjunto({ tipo: 'alumno', alumnoId: 'ana' });
    if (!r) throw new Error('sin conjunto');
    await guardarCambio(r.conjunto, actualizarCelda(r.conjunto, r.conjunto.principal.id, 'celda-pic-hola', { textoMostrado: 'Hola Ana' }));
    await restablecerAlumno('ana');
    const general = (await cargarConjunto({ tipo: 'plantilla', id: ID_PLANTILLA_GENERAL }))?.conjunto;
    if (!general) throw new Error('sin general');
    await guardarCambio(general, actualizarCelda(general, general.principal.id, 'celda-pic-hola', { textoMostrado: 'Buenos días' }));
    const ana = await cargarConjunto({ tipo: 'alumno', alumnoId: 'ana' });
    expect(ana?.conjunto.principal.celdas.find((c) => c.id === 'celda-pic-hola')?.textoMostrado).toBe('Buenos días');
  });
});

describe('restablecerPlantillaGeneral', () => {
  it('deja la general como vino de fábrica y no toca las demás plantillas', async () => {
    const otra = (await crearPlantilla('Mía')) as string;
    const general = armarConjunto(almacen.get(ID_PLANTILLA_GENERAL) as Tablero, guardados());
    const editado = agregarCarpeta(general, { nombre: 'Extra', categoriaId: 'objetos' });
    await guardarCambio(general, editado);
    expect(guardados().some((t) => t.nombre === 'Extra')).toBe(true);

    await restablecerPlantillaGeneral(fabrica());
    expect(guardados().some((t) => t.nombre === 'Extra')).toBe(false);
    expect((await cargarConjunto({ tipo: 'plantilla', id: ID_PLANTILLA_GENERAL }))?.conjunto.carpetas).toHaveLength(5);
    expect(await cargarConjunto({ tipo: 'plantilla', id: otra })).toBeDefined();
  });
});
