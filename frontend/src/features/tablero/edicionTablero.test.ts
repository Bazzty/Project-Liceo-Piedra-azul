import { describe, expect, it } from 'vitest';
import { catalogo } from '@/features/tablero/catalogoDePrueba';
import {
  actualizarCelda,
  agregarCarpeta,
  agregarCelda,
  ajustarVolverAlElegir,
  armarConjunto,
  duplicarConjunto,
  idsDelConjunto,
  moverCelda,
  moverUno,
  nuevaCeldaPalabra,
  pasarCelda,
  quitarCelda,
  renombrarTablero,
  tablerosDelConjunto,
} from '@/features/tablero/edicionTablero';
import { construirPlantillaGeneral } from '@/features/tablero/plantillaGeneral';

const plantilla = construirPlantillaGeneral(catalogo);
const base = () => armarConjunto(plantilla[0], plantilla);
const textos = (celdas: { textoMostrado: string }[]) => celdas.map((c) => c.textoMostrado);
const carpetaDe = (c: ReturnType<typeof base>, nombre: string) => c.carpetas.find((t) => t.nombre === nombre);

describe('armarConjunto', () => {
  it('reúne el principal y las carpetas que abre, en el orden de sus celdas', () => {
    const c = base();
    expect(c.principal.id).toBe('plantilla-general');
    expect(c.carpetas.map((t) => t.nombre)).toEqual(['Necesidades', 'Emociones', 'Personas', 'Acciones', 'Objetos']);
  });

  it('deja fuera los tableros que no abre ninguna carpeta', () => {
    const suelto = { ...plantilla[1], id: 'otro' };
    expect(armarConjunto(plantilla[0], [...plantilla, suelto]).carpetas.some((t) => t.id === 'otro')).toBe(false);
  });
});

describe('duplicarConjunto', () => {
  const copia = duplicarConjunto(base(), { esPlantilla: false, alumnoId: 'ana', idDe: (id) => `ana-${id}` });

  it('crea tableros nuevos cuyas carpetas apuntan a las copias y no a los originales', () => {
    const idsCopia = new Set(idsDelConjunto(copia));
    const destinos = copia.principal.celdas.flatMap((c) => (c.destinoTableroId ? [c.destinoTableroId] : []));
    expect(destinos).toHaveLength(5);
    expect(destinos.every((d) => idsCopia.has(d))).toBe(true);
    expect(idsDelConjunto(base()).some((id) => idsCopia.has(id))).toBe(false);
  });

  it('marca a quién pertenece y de dónde viene', () => {
    expect(tablerosDelConjunto(copia).every((t) => t.alumnoId === 'ana' && !t.esPlantilla)).toBe(true);
    expect(copia.principal.copiadoDe).toBe('plantilla-general');
    expect(copia.carpetas[0].copiadoDe).toBe('plantilla-general-necesidades');
  });

  it('puede ser una plantilla nueva con otro nombre, sin dueño', () => {
    const otra = duplicarConjunto(base(), { nombre: 'Para comer', esPlantilla: true, idDe: (id) => `nueva-${id}` });
    expect(otra.principal).toMatchObject({ nombre: 'Para comer', esPlantilla: true, principal: true });
    expect(otra.carpetas[0].nombre).toBe('Necesidades');
    expect('alumnoId' in otra.principal).toBe(false);
  });

  it('no toca el original', () => {
    const antes = JSON.stringify(base());
    duplicarConjunto(base(), { esPlantilla: true, idDe: (id) => `x-${id}` });
    expect(JSON.stringify(base())).toBe(antes);
  });

  it('copiar a un niño un tablero que ya era de otro no arrastra al dueño anterior', () => {
    const deAna = duplicarConjunto(base(), { esPlantilla: false, alumnoId: 'ana', idDe: (id) => `ana-${id}` });
    const plantillaNueva = duplicarConjunto(deAna, { esPlantilla: true, idDe: (id) => `p-${id}` });
    expect(tablerosDelConjunto(plantillaNueva).some((t) => t.alumnoId)).toBe(false);
  });
});

describe('agregarCelda', () => {
  const celdaNueva = nuevaCeldaPalabra({ pictogramaId: 'pic-nuevo', textoMostrado: 'galleta', categoriaId: 'necesidades' });

  it('agrega al final por defecto', () => {
    const c = agregarCelda(base(), 'plantilla-general-necesidades', celdaNueva);
    expect(textos(carpetaDe(c, 'Necesidades')?.celdas ?? [])).toEqual(['agua', 'comer', 'galleta']);
  });

  it('agrega en una posición dada y ajusta posiciones fuera de rango', () => {
    const inicio = agregarCelda(base(), 'plantilla-general-necesidades', celdaNueva, 0);
    expect(textos(carpetaDe(inicio, 'Necesidades')?.celdas ?? [])[0]).toBe('galleta');
    const lejos = agregarCelda(base(), 'plantilla-general-necesidades', celdaNueva, 99);
    expect(textos(carpetaDe(lejos, 'Necesidades')?.celdas ?? []).at(-1)).toBe('galleta');
  });

  it('no modifica el conjunto original', () => {
    const c = base();
    agregarCelda(c, 'plantilla-general-necesidades', celdaNueva);
    expect(carpetaDe(c, 'Necesidades')?.celdas).toHaveLength(2);
  });

  it('una palabra núcleo solo se conserva como núcleo en el principal', () => {
    const nucleo = nuevaCeldaPalabra({ pictogramaId: 'pic-x', textoMostrado: 'x', categoriaId: 'objetos', esNucleo: true });
    const enCarpeta = agregarCelda(base(), 'plantilla-general-objetos', nucleo);
    expect(carpetaDe(enCarpeta, 'Objetos')?.celdas.at(-1)?.esNucleo).toBeUndefined();
    const enPrincipal = agregarCelda(base(), 'plantilla-general', nucleo);
    expect(enPrincipal.principal.celdas.at(-1)?.esNucleo).toBe(true);
  });

  it('rechaza carpetas (tienen su propia función) y tableros que no existen', () => {
    expect(() => agregarCelda(base(), 'plantilla-general', { id: 'c', tipo: 'carpeta', textoMostrado: 'x', categoriaId: 'x' })).toThrow();
    expect(() => agregarCelda(base(), 'no-existe', celdaNueva)).toThrow();
  });
});

describe('agregarCarpeta y quitarCelda', () => {
  it('crea la celda en el principal y su tablero vacío, con el mismo nombre', () => {
    const c = agregarCarpeta(base(), { nombre: 'Comida', categoriaId: 'necesidades', pictogramaId: 'pic-comer' });
    const celda = c.principal.celdas.at(-1);
    expect(celda).toMatchObject({ tipo: 'carpeta', textoMostrado: 'Comida', pictogramaId: 'pic-comer' });
    const nueva = c.carpetas.find((t) => t.id === celda?.destinoTableroId);
    expect(nueva).toMatchObject({ nombre: 'Comida', principal: false, celdas: [] });
  });

  it('una carpeta nueva de un niño queda a su nombre', () => {
    const deAna = duplicarConjunto(base(), { esPlantilla: false, alumnoId: 'ana', idDe: (id) => `ana-${id}` });
    const c = agregarCarpeta(deAna, { nombre: 'Casa', categoriaId: 'objetos' });
    expect(c.carpetas.at(-1)?.alumnoId).toBe('ana');
  });

  it('al quitar una carpeta se quita también su tablero con todo lo que tenía', () => {
    const c = quitarCelda(base(), 'plantilla-general', 'carpeta-acciones');
    expect(c.principal.celdas.some((x) => x.id === 'carpeta-acciones')).toBe(false);
    expect(c.carpetas.some((t) => t.nombre === 'Acciones')).toBe(false);
    expect(c.carpetas).toHaveLength(4);
  });

  it('quitar una palabra no afecta a las demás ni a las carpetas', () => {
    const c = quitarCelda(base(), 'plantilla-general-necesidades', 'celda-pic-agua');
    expect(textos(carpetaDe(c, 'Necesidades')?.celdas ?? [])).toEqual(['comer']);
    expect(c.carpetas).toHaveLength(5);
  });

  it('quitar algo que no existe deja todo igual', () => {
    const c = base();
    expect(quitarCelda(c, 'plantilla-general', 'no-existe')).toBe(c);
  });
});

describe('actualizarCelda', () => {
  it('cambia lo que se muestra, lo que se dice y la categoría, sin tocar el resto', () => {
    const c = actualizarCelda(base(), 'plantilla-general-necesidades', 'celda-pic-agua', { textoMostrado: 'Agua', textoHablado: 'Quiero agua', categoriaId: 'objetos' });
    expect(carpetaDe(c, 'Necesidades')?.celdas[0]).toMatchObject({ id: 'celda-pic-agua', textoMostrado: 'Agua', textoHablado: 'Quiero agua', categoriaId: 'objetos', pictogramaId: 'pic-agua' });
  });

  it('quitar el texto hablado lo borra en vez de dejar un valor vacío', () => {
    const con = actualizarCelda(base(), 'plantilla-general-necesidades', 'celda-pic-agua', { textoHablado: 'Quiero agua' });
    const sin = actualizarCelda(con, 'plantilla-general-necesidades', 'celda-pic-agua', { textoHablado: undefined });
    expect('textoHablado' in (carpetaDe(sin, 'Necesidades')?.celdas[0] ?? {})).toBe(false);
  });

  it('marcar núcleo funciona en el principal y se ignora dentro de una carpeta', () => {
    const principal = actualizarCelda(base(), 'plantilla-general', 'celda-pic-hola', { esNucleo: true });
    expect(principal.principal.celdas.find((x) => x.id === 'celda-pic-hola')?.esNucleo).toBe(true);
    const carpeta = actualizarCelda(base(), 'plantilla-general-necesidades', 'celda-pic-agua', { esNucleo: true });
    expect(carpetaDe(carpeta, 'Necesidades')?.celdas[0].esNucleo).toBeUndefined();
  });

  it('renombrar una carpeta renombra también el tablero que abre', () => {
    const c = actualizarCelda(base(), 'plantilla-general', 'carpeta-acciones', { textoMostrado: 'Qué hago' });
    expect(c.carpetas.some((t) => t.nombre === 'Qué hago')).toBe(true);
    expect(c.carpetas.some((t) => t.nombre === 'Acciones')).toBe(false);
  });

  it('una celda que no existe deja todo igual', () => {
    const c = base();
    expect(actualizarCelda(c, 'plantilla-general', 'no-existe', { textoMostrado: 'x' })).toBe(c);
  });
});

describe('reordenar', () => {
  const necesidades = (c: ReturnType<typeof base>) => textos(carpetaDe(c, 'Necesidades')?.celdas ?? []);

  it('moverCelda la pone en la posición pedida', () => {
    expect(necesidades(moverCelda(base(), 'plantilla-general-necesidades', 'celda-pic-comer', 0))).toEqual(['comer', 'agua']);
  });

  it('moverUno sube y baja un lugar, y en los extremos no hace nada', () => {
    const abajo = moverUno(base(), 'plantilla-general-necesidades', 'celda-pic-agua', 1);
    expect(necesidades(abajo)).toEqual(['comer', 'agua']);
    expect(necesidades(moverUno(base(), 'plantilla-general-necesidades', 'celda-pic-agua', -1))).toEqual(['agua', 'comer']);
    expect(necesidades(moverUno(abajo, 'plantilla-general-necesidades', 'celda-pic-agua', 1))).toEqual(['comer', 'agua']);
  });

  it('no pierde ni duplica celdas al reordenar', () => {
    const c = moverCelda(base(), 'plantilla-general', 'carpeta-objetos', 0);
    expect(c.principal.celdas).toHaveLength(base().principal.celdas.length);
    expect(c.principal.celdas[0].id).toBe('carpeta-objetos');
    expect(new Set(c.principal.celdas.map((x) => x.id)).size).toBe(c.principal.celdas.length);
  });

  it('pasarCelda lleva una palabra a otro tablero', () => {
    const c = pasarCelda(base(), 'plantilla-general', 'celda-pic-hola', 'plantilla-general-personas');
    expect(c.principal.celdas.some((x) => x.id === 'celda-pic-hola')).toBe(false);
    expect(textos(carpetaDe(c, 'Personas')?.celdas ?? [])).toContain('hola');
  });

  it('una palabra núcleo que pasa a una carpeta deja de ser núcleo', () => {
    const c = pasarCelda(base(), 'plantilla-general', 'celda-pic-yo', 'plantilla-general-personas');
    expect(carpetaDe(c, 'Personas')?.celdas.find((x) => x.id === 'celda-pic-yo')?.esNucleo).toBeUndefined();
  });

  it('las carpetas no se pasan a otra carpeta (un solo nivel)', () => {
    const c = base();
    expect(pasarCelda(c, 'plantilla-general', 'carpeta-acciones', 'plantilla-general-personas')).toBe(c);
  });
});

describe('nombres y ajustes', () => {
  it('renombrar una carpeta cambia su tablero y su celda', () => {
    const c = renombrarTablero(base(), 'plantilla-general-acciones', 'Qué hago');
    expect(carpetaDe(c, 'Qué hago')).toBeDefined();
    expect(c.principal.celdas.find((x) => x.id === 'carpeta-acciones')?.textoMostrado).toBe('Qué hago');
  });

  it('renombrar el principal solo cambia su nombre', () => {
    const c = renombrarTablero(base(), 'plantilla-general', 'Mi tablero');
    expect(c.principal.nombre).toBe('Mi tablero');
    expect(c.principal.celdas).toEqual(base().principal.celdas);
  });

  it('volver al principal al elegir se activa y desactiva', () => {
    expect(ajustarVolverAlElegir(base(), false).principal.volverAlElegir).toBe(false);
    expect(ajustarVolverAlElegir(ajustarVolverAlElegir(base(), false), true).principal.volverAlElegir).toBe(true);
  });
});
