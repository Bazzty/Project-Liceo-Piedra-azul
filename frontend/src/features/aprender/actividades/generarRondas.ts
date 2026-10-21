import type { Cuento, CuentoPalabra } from '@/types';

/** Elige la imagen que suena (sin leer), elige la palabra de una imagen, o ordena una oración. */
export type Ronda =
	| { tipo: 'escucha'; meta: CuentoPalabra; opciones: CuentoPalabra[] }
	| { tipo: 'lee'; meta: CuentoPalabra; opciones: CuentoPalabra[] }
	| { tipo: 'ordena'; frase: string; orden: CuentoPalabra[]; mezcla: CuentoPalabra[] };

/** Azar con semilla: mismo cuento y misma vuelta dan las mismas rondas (sin Math.random en el render). */
const crearAzar = (semilla: number) => {
	let a = semilla >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

const hash = (texto: string) => [...texto].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

const mezclar = <T,>(lista: T[], azar: () => number) => {
	const copia = [...lista];
	for (let i = copia.length - 1; i > 0; i -= 1) {
		const j = Math.floor(azar() * (i + 1));
		[copia[i], copia[j]] = [copia[j], copia[i]];
	}
	return copia;
};

const conImagen = (p: CuentoPalabra) => !!p.pictogramaUrl && p.texto.length > 2;

const sinRepetir = (palabras: CuentoPalabra[]) => {
	const vistas = new Set<string>();
	return palabras.filter((p) => {
		const k = p.texto.toLowerCase();
		if (vistas.has(k)) return false;
		vistas.add(k);
		return true;
	});
};

/**
 * Arma las actividades de un cuento con sus propias palabras: 2 de escuchar, 2 de leer y 1 de ordenar
 * (si el cuento tiene una oración con 2 a 4 imágenes). Los distractores salen del mismo cuento y,
 * si no alcanzan, de otros cuentos publicados.
 */
export function generarRondas(cuento: Cuento, otros: Cuento[], vuelta: number): Ronda[] {
	const azar = crearAzar(hash(cuento.id ?? cuento.titulo) + vuelta * 101);
	const propias = sinRepetir(cuento.paginas.flatMap((p) => p.palabras).filter(conImagen));
	const ajenas = sinRepetir(otros.flatMap((c) => c.paginas.flatMap((p) => p.palabras)).filter(conImagen));
	const nombresPropios = new Set(propias.map((p) => p.texto.toLowerCase()));
	const reserva = ajenas.filter((p) => !nombresPropios.has(p.texto.toLowerCase()));
	const pool = propias.length >= 3 ? propias : [...propias, ...reserva];
	if (pool.length < 3) return [];

	const metas = mezclar(propias.length > 0 ? propias : pool, azar);
	const opcionesPara = (meta: CuentoPalabra) => {
		const distractores = mezclar(pool.filter((p) => p.texto !== meta.texto), azar).slice(0, 2);
		return mezclar([meta, ...distractores], azar);
	};

	const rondas: Ronda[] = [];
	const tomar = (i: number) => metas[i % metas.length];
	[0, 1].forEach((i) => rondas.push({ tipo: 'escucha', meta: tomar(i), opciones: opcionesPara(tomar(i)) }));
	[2, 3].forEach((i) => rondas.push({ tipo: 'lee', meta: tomar(i), opciones: opcionesPara(tomar(i)) }));

	const paginaOrdenable = cuento.paginas.find((p) => p.palabras.length >= 2 && p.palabras.length <= 4 && p.palabras.some((w) => w.pictogramaUrl));
	if (paginaOrdenable) {
		let mezcla = mezclar(paginaOrdenable.palabras, azar);
		// Si quedó igual que la oración, se rota una posición para que haya algo que ordenar
		if (mezcla.every((w, i) => w === paginaOrdenable.palabras[i])) mezcla = [...mezcla.slice(1), mezcla[0]];
		rondas.push({ tipo: 'ordena', frase: paginaOrdenable.textoCompleto, orden: paginaOrdenable.palabras, mezcla });
	}
	return mezclar(rondas, azar).sort((a, b) => (a.tipo === 'ordena' ? 1 : 0) - (b.tipo === 'ordena' ? 1 : 0));
}
