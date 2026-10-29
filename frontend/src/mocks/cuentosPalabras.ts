import { db } from '@/db/db';
import type { Cuento, CuentoPagina, CuentoPalabra } from '@/types';

/* ============================================================
   Nivel C · Palabras: colecciones por tema con pictogramas y audios que ya existen
   (/public/pictogramas/arasaac y /public/audio/pictogramas). Cada página muestra una palabra
   grande; la última junta dos o tres en una frase corta, que también sirve para la actividad
   de ordenar.
   ============================================================ */

const ahora = () => new Date().toISOString();

/** Palabra con su pictograma y su audio. `archivo` es el nombre del archivo (sin tilde ni eñe). */
const palabra = (texto: string, archivo: string): CuentoPalabra => ({
	texto,
	pictogramaUrl: `/pictogramas/arasaac/${archivo}.png`,
	audioUrl: `/audio/pictogramas/${archivo}.mp3`,
});

const soloUna = (n: number, p: CuentoPalabra): CuentoPagina => ({
	numeroPagina: n,
	textoCompleto: p.texto,
	audioPaginaUrl: p.audioUrl,
	palabras: [p],
});

const frase = (n: number, texto: string, palabras: CuentoPalabra[]): CuentoPagina => ({
	numeroPagina: n,
	textoCompleto: texto,
	palabras,
});

interface Coleccion {
	id: string;
	titulo: string;
	descripcion: string;
	portada: string;
	palabras: [string, string][];
	frase: { texto: string; palabras: [string, string][] };
}

const COLECCIONES: Coleccion[] = [
	{
		id: 'palabras-familia',
		titulo: 'Mi Familia y Mis Amigos',
		descripcion: 'Las personas que quiero',
		portada: 'mama',
		palabras: [['mamá', 'mama'], ['papá', 'papa'], ['niño', 'nino'], ['niña', 'nina'], ['amigo', 'amigo'], ['profesor', 'profesor']],
		frase: { texto: 'Mamá ama papá.', palabras: [['mamá', 'mama'], ['ama', 'ama'], ['papá', 'papa']] },
	},
	{
		id: 'palabras-cosas',
		titulo: 'Mis Cosas',
		descripcion: 'Objetos del colegio y de la casa',
		portada: 'mochila',
		palabras: [['auto', 'auto'], ['libro', 'libro'], ['lápiz', 'lapiz'], ['mesa', 'mesa'], ['silla', 'silla'], ['mochila', 'mochila']],
		frase: { texto: 'Mochila azul.', palabras: [['mochila', 'mochila'], ['azul', 'azul']] },
	},
	{
		id: 'palabras-acciones',
		titulo: 'Lo Que Hago',
		descripcion: 'Acciones de todos los días',
		portada: 'jugar',
		palabras: [['comer', 'comer'], ['dormir', 'dormir'], ['jugar', 'jugar'], ['ir', 'ir'], ['ver', 'ver'], ['escuchar', 'escuchar']],
		frase: { texto: 'Yo quiero jugar.', palabras: [['yo', 'yo'], ['quiero', 'quiero'], ['jugar', 'jugar']] },
	},
	{
		id: 'palabras-emociones',
		titulo: 'Cómo Me Siento',
		descripcion: 'Emociones y cómo pedir ayuda',
		portada: 'feliz',
		palabras: [['feliz', 'feliz'], ['triste', 'triste'], ['enojado', 'enojado'], ['asustado', 'asustado'], ['cansado', 'cansado'], ['bien', 'bien']],
		frase: { texto: 'Yo quiero ayuda.', palabras: [['yo', 'yo'], ['quiero', 'quiero'], ['ayuda', 'ayuda']] },
	},
];

export const CUENTOS_PALABRAS: Cuento[] = COLECCIONES.map((c) => ({
	id: c.id,
	nivelId: 'nivel-c',
	titulo: c.titulo,
	descripcion: c.descripcion,
	portadaUrl: `/pictogramas/arasaac/${c.portada}.png`,
	estado: 'publicado',
	fechaCreacion: ahora(),
	paginas: [
		...c.palabras.map(([texto, archivo], i) => soloUna(i + 1, palabra(texto, archivo))),
		frase(c.palabras.length + 1, c.frase.texto, c.frase.palabras.map(([t, a]) => palabra(t, a))),
	],
}));

export async function sembrarCuentosPalabras() {
	if (!(await db.niveles.get('nivel-c'))) {
		await db.niveles.put({
			id: 'nivel-c',
			codigo: 'C',
			nombre: 'Palabras',
			descripcion: 'Palabras de todos los días con su imagen y su voz',
			orden: 3,
		});
	}
	for (const cuento of CUENTOS_PALABRAS) {
		if (cuento.id && !(await db.cuentos.get(cuento.id))) await db.cuentos.put(cuento);
	}
}
