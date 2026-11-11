import type { Pictograma } from '@/types';

export const pic = (id: string, palabra: string, categoria: Pictograma['categoria']): Pictograma => ({
  id: `pic-${id}`,
  palabra,
  categoria,
  imagenUrl: `/pictogramas/arasaac/${id}.png`,
  esFotoReal: false,
});

/** Un catálogo con una o más palabras de cada categoría, las 8 núcleo y alguna «básica» que no es núcleo. */
export const catalogo: Pictograma[] = [
  pic('ayuda', 'ayuda', 'necesidades'),
  pic('agua', 'agua', 'necesidades'),
  pic('comer', 'comer', 'necesidades'),
  pic('feliz', 'feliz', 'emociones'),
  pic('triste', 'triste', 'emociones'),
  pic('yo', 'yo', 'personas'),
  pic('mama', 'mamá', 'personas'),
  pic('amigo', 'amigo', 'personas'),
  pic('quiero', 'quiero', 'acciones'),
  pic('jugar', 'jugar', 'acciones'),
  pic('abrazar', 'abrazo', 'acciones'),
  pic('libro', 'libro', 'objetos'),
  pic('azul', 'azul', 'objetos'),
  pic('mas', 'más', 'basicas'),
  pic('si', 'sí', 'basicas'),
  pic('no', 'no', 'basicas'),
  pic('terminado', 'terminado', 'basicas'),
  pic('gracias', 'gracias', 'basicas'),
  pic('hola', 'hola', 'basicas'),
];
