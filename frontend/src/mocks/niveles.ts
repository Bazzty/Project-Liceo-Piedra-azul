import { db } from '@/db/db';

/**
 * Los cinco niveles del camino. Los ids antiguos se conservan (el avance de los niños cuelga de ellos);
 * lo que cambia es el orden y la letra. Se aplica una sola vez: si ya existe el nivel de vocales,
 * no se pisan los cambios que la docente haya hecho a los nombres.
 */
export async function sembrarNiveles() {
	if (await db.niveles.get('nivel-vocales')) return;
	await db.niveles.bulkPut([
		{ id: 'nivel-vocales', codigo: 'A', nombre: 'Vocales', descripcion: 'Conocer las vocales: su letra, su sonido y palabras que empiezan con ellas', orden: 1 },
		{ id: 'nivel-a', codigo: 'B', nombre: 'Sílabas', descripcion: 'Conciencia fonológica y combinación de sílabas (M, L, S, P, D)', orden: 2 },
		{ id: 'nivel-c', codigo: 'C', nombre: 'Palabras', descripcion: 'Palabras de todos los días con su imagen y su voz', orden: 3 },
		{ id: 'nivel-b', codigo: 'D', nombre: 'Cuentos', descripcion: 'Lectura asistida con pictogramas y oraciones cortas', orden: 4 },
		{ id: 'nivel-d', codigo: 'E', nombre: 'Historias', descripcion: 'Cuentos de Kinder con pictogramas, oraciones cortas y audio', orden: 5 },
	]);
}
