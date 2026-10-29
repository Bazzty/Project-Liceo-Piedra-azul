import { db } from '@/db/db';
import type { Cuento, CuentoPagina, CuentoPalabra } from '@/types';

/* ============================================================
   Nivel A (id «nivel-vocales») · Las vocales: una colección por vocal. Primero se ve y se oye la letra
   (/public/audio/fonemas) y luego tres palabras que empiezan con ella, con su dibujo.
   Las palabras sin audio grabado se leen con la voz del dispositivo hasta que se grabe
   (ver scripts/audios.manifest.json).
   ============================================================ */

const ahora = () => new Date().toISOString();

const dibujo = (archivo: string) => `/pictogramas/arasaac/${archivo}.png`;

/** Palabra con dibujo. Si ya hay audio grabado de ese dibujo se usa; si no, queda sin audio. */
const palabra = (texto: string, archivo: string, conAudio = false): CuentoPalabra => ({
	texto,
	pictogramaUrl: dibujo(archivo),
	...(conAudio ? { audioUrl: `/audio/pictogramas/${archivo}.mp3` } : {}),
});

const paginaLetra = (vocal: string): CuentoPagina => ({
	numeroPagina: 1,
	textoCompleto: vocal.toUpperCase(),
	audioPaginaUrl: `/audio/fonemas/${vocal}.mp3`,
	palabras: [{ texto: `${vocal.toUpperCase()} ${vocal}`, audioUrl: `/audio/fonemas/${vocal}.mp3` }],
});

interface Vocal {
	letra: string;
	palabras: [string, string, boolean?][];
}

const VOCALES: Vocal[] = [
	{ letra: 'a', palabras: [['auto', 'auto', true], ['agua', 'agua', true], ['abeja', 'abeja']] },
	{ letra: 'e', palabras: [['elefante', 'elefante'], ['escalera', 'escalera'], ['escuchar', 'escuchar', true]] },
	{ letra: 'i', palabras: [['isla', 'isla'], ['iguana', 'iguana'], ['imán', 'iman']] },
	{ letra: 'o', palabras: [['oso', 'oso'], ['ojo', 'ojo'], ['oreja', 'oreja']] },
	{ letra: 'u', palabras: [['uva', 'uva'], ['uña', 'unia'], ['unicornio', 'unicornio']] },
];

export const CUENTOS_VOCALES: Cuento[] = VOCALES.map((v, i) => ({
	id: `vocal-${v.letra}`,
	nivelId: 'nivel-vocales',
	titulo: `La vocal ${v.letra.toUpperCase()}`,
	descripcion: `Conoce la ${v.letra.toUpperCase()} y palabras que empiezan con ella`,
	portadaUrl: dibujo(v.palabras[0][1]),
	estado: 'publicado',
	orden: i + 1,
	fechaCreacion: ahora(),
	paginas: [
		paginaLetra(v.letra),
		...v.palabras.map(([texto, archivo, audio], n): CuentoPagina => {
			const p = palabra(texto, archivo, audio);
			return { numeroPagina: n + 2, textoCompleto: texto, audioPaginaUrl: p.audioUrl, palabras: [p] };
		}),
	],
}));

export async function sembrarCuentosVocales() {
	for (const cuento of CUENTOS_VOCALES) {
		if (!cuento.id) continue;
		const existente = await db.cuentos.get(cuento.id);
		if (!existente) await db.cuentos.put(cuento);
		// Navegadores que ya los tenían dentro del nivel de sílabas: pasan a su propio nivel
		else if (existente.nivelId !== cuento.nivelId) await db.cuentos.update(cuento.id, { nivelId: cuento.nivelId });
	}
}
