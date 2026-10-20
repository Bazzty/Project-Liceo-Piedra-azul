import { db, type Cuento, type CuentoPalabra } from './db';

/* ============================================================
   Cuentos de Kinder con pictogramas (ARASAAC) y audio.
   - Pictogramas: /public/pictogramas/arasaac/<palabra>.png
     (se bajan con `node scripts/descargar-pictogramas.js`; si falta
     alguno, la app lo busca en ARASAAC usando `clave`).
   - Audio de cada página: /public/audio/cuentos/<id>-p<N>.mp3
     (AHORA son sonidos de ejemplo: reemplázalos por la voz de la
     profesora o de ElevenLabs conservando el mismo nombre).
   - Audio de cada palabra: solo se reutiliza /audio/pictogramas cuando la
     palabra es idéntica (sapo, lana, feliz…). Los verbos conjugados (ve,
     juega, voy…) NO llevan audioUrl a propósito: el archivo existente dice
     el infinitivo («ver»). Sin audioUrl la app usa la voz del dispositivo
     (ver services/voz.ts) hasta que esté el audio generado con IA.
   ============================================================ */

const pic = (nombre: string) => `/pictogramas/arasaac/${nombre}.png`;
const audPic = (nombre: string) => `/audio/pictogramas/${nombre}.mp3`;
const audPal = (nombre: string) => `/audio/palabras/${nombre}.mp3`;

/** Palabra de cuento. `p` = pictograma, `a` = audio de la palabra, `c` = clave de búsqueda en ARASAAC. */
const w = (texto: string, p?: string, a?: string, c?: string): CuentoPalabra => ({
	texto,
	...(p ? { pictogramaUrl: pic(p) } : {}),
	...(a ? { audioUrl: a } : {}),
	...(c ? { clave: c } : {}),
});

const pagina = (id: string, n: number, textoCompleto: string, palabras: CuentoPalabra[]) => ({
	numeroPagina: n,
	textoCompleto,
	audioPaginaUrl: `/audio/cuentos/${id}-p${n}.mp3`,
	palabras,
});

export const CLAVE_SEMBRADO = 'cuentos-kinder-v2';

const ahora = () => new Date().toISOString();

export const CUENTOS_KINDER: Cuento[] = [
	{
		id: 'cuento-sapo-pepe',
		nivelId: 'nivel-d',
		titulo: 'El Sapo Pepe',
		descripcion: 'Un sapo salta, mira con una lupa y toma sopa (S, P, L)',
		portadaUrl: pic('sapo'),
		estado: 'publicado',
		fechaCreacion: ahora(),
		paginas: [
			pagina('cuento-sapo-pepe', 1, 'Pepe es un sapo.', [w('Pepe'), w('es'), w('un'), w('sapo', 'sapo', audPal('sa_sapo'))]),
			pagina('cuento-sapo-pepe', 2, 'Pepe salta en la sala.', [w('Pepe'), w('salta', 'saltar', undefined, 'saltar'), w('en'), w('la'), w('sala', 'sala', audPal('sa_sala'))]),
			pagina('cuento-sapo-pepe', 3, 'Pepe ve una lupa.', [w('Pepe'), w('ve', 'ver', undefined, 'ver'), w('una'), w('lupa', 'lupa', audPal('lu_lupa'))]),
			pagina('cuento-sapo-pepe', 4, 'Pepe toma sopa.', [w('Pepe'), w('toma', 'tomar', undefined, 'tomar'), w('sopa', 'sopa', audPal('so_sopa'))]),
			pagina('cuento-sapo-pepe', 5, '¡Pepe es feliz!', [w('Pepe'), w('es'), w('feliz', 'feliz', audPic('feliz'))]),
		],
	},
	{
		id: 'cuento-mimi-lana',
		nivelId: 'nivel-d',
		titulo: 'Mimi y la Lana',
		descripcion: 'Una gatita juega con una lana lila (M, L)',
		portadaUrl: pic('gato'),
		estado: 'publicado',
		fechaCreacion: ahora(),
		paginas: [
			pagina('cuento-mimi-lana', 1, 'Mimi es una gata.', [w('Mimi'), w('es'), w('una'), w('gata', 'gato', undefined, 'gato')]),
			pagina('cuento-mimi-lana', 2, 'Mimi ve lana lila.', [w('Mimi'), w('ve', 'ver', undefined, 'ver'), w('lana', 'lana', audPal('la_lana')), w('lila', 'lila', audPal('li_lila'))]),
			pagina('cuento-mimi-lana', 3, 'Mimi juega con la lana.', [w('Mimi'), w('juega', 'jugar', undefined, 'jugar'), w('con'), w('la'), w('lana', 'lana', audPal('la_lana'))]),
			pagina('cuento-mimi-lana', 4, 'Mimi salta en la mesa.', [w('Mimi'), w('salta', 'saltar', undefined, 'saltar'), w('en'), w('la'), w('mesa', 'mesa', audPic('mesa'))]),
			pagina('cuento-mimi-lana', 5, 'Mimi duerme feliz.', [w('Mimi'), w('duerme', 'dormir', undefined, 'dormir'), w('feliz', 'feliz', audPic('feliz'))]),
		],
	},
	{
		id: 'cuento-mi-dia',
		nivelId: 'nivel-d',
		titulo: 'Mi Día',
		descripcion: 'Las cosas que hago en mi día: comer, ir al colegio, jugar y dormir',
		portadaUrl: pic('colegio'),
		estado: 'publicado',
		fechaCreacion: ahora(),
		paginas: [
			pagina('cuento-mi-dia', 1, 'Yo como pan.', [w('Yo', 'yo', audPic('yo')), w('como', 'comer', undefined, 'comer'), w('pan', 'pan')]),
			pagina('cuento-mi-dia', 2, 'Yo voy al colegio.', [w('Yo', 'yo', audPic('yo')), w('voy', 'ir', undefined, 'ir'), w('al'), w('colegio', 'colegio', audPic('colegio'))]),
			pagina('cuento-mi-dia', 3, 'Yo juego con mi amigo.', [w('Yo', 'yo', audPic('yo')), w('juego', 'jugar', undefined, 'jugar'), w('con'), w('mi'), w('amigo', 'amigo', audPic('amigo'))]),
			pagina('cuento-mi-dia', 4, 'Mamá me abraza.', [w('Mamá', 'mama', audPic('mama')), w('me'), w('abraza', 'abrazar', undefined, 'abrazar')]),
			pagina('cuento-mi-dia', 5, 'Yo duermo en mi cama.', [w('Yo', 'yo', audPic('yo')), w('duermo', 'dormir', undefined, 'dormir'), w('en'), w('mi'), w('cama', 'cama')]),
		],
	},
];

/**
 * Agrega los cuentos de Kinder al nivel D si todavía no existen.
 * Se carga una vez por navegador; luego se respeta lo que edite o borre el docente
 * (para volver a cargarlos, usa «Reiniciar demo» en el panel docente).
 */
export async function sembrarCuentosKinder() {
	if (!(await db.niveles.get('nivel-d'))) {
		await db.niveles.put({
			id: 'nivel-d',
			codigo: 'D',
			nombre: 'Cuentos Cortos Duales (Kinder)',
			descripcion: 'Cuentos de Kinder con pictogramas, oraciones cortas y audio',
			orden: 4,
		});
	}

	// v2: corrige los audios de los verbos conjugados. Se reescriben una sola vez los 3 cuentos
	// (también en navegadores que ya tenían la v1); después ya no se pisa nada.
	if (localStorage.getItem(CLAVE_SEMBRADO) !== '1') {
		for (const cuento of CUENTOS_KINDER) await db.cuentos.put(cuento);
		localStorage.setItem(CLAVE_SEMBRADO, '1');
	}

	// Corrección: el seed antiguo apuntaba a «_p1.mp3» pero los archivos se llaman «-p1.mp3»
	for (const id of ['cuento-auto-ana', 'cuento-mi-mama']) {
		const c = await db.cuentos.get(id);
		const pag = c?.paginas?.[0];
		if (c && pag?.audioPaginaUrl?.includes('_p1.mp3')) {
			pag.audioPaginaUrl = pag.audioPaginaUrl.replace('_p1.mp3', '-p1.mp3');
			await db.cuentos.put(c);
		}
	}
}
