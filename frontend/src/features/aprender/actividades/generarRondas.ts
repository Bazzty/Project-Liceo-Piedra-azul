import type { Cuento, CuentoPalabra } from '@/types';

/** Carta de la memoria: la imagen y la palabra de una misma pareja comparten `clave`. */
export interface CartaMemoria {
	clave: string;
	palabra: CuentoPalabra;
	cara: 'imagen' | 'texto';
}

/**
 * Tipos de actividad: elegir la imagen que suena, elegir la palabra de una imagen, ¿con qué sonido
 * empieza?, memoria de parejas, completar la frase y ordenar la oración.
 */
export type Ronda =
	| { tipo: 'escucha'; meta: CuentoPalabra; opciones: CuentoPalabra[] }
	| { tipo: 'lee'; meta: CuentoPalabra; opciones: CuentoPalabra[] }
	| { tipo: 'sonido'; meta: CuentoPalabra; correcta: string; opciones: string[] }
	| { tipo: 'memoria'; cartas: CartaMemoria[] }
	| { tipo: 'completa'; frase: string; palabras: CuentoPalabra[]; hueco: number; opciones: CuentoPalabra[] }
	| { tipo: 'ordena'; frase: string; orden: CuentoPalabra[]; mezcla: CuentoPalabra[] };

const MAXIMO_RONDAS = 5;
const SILABAS_DE_RESERVA = ['ma', 'pa', 'sa', 'lo', 'ti', 'ra', 'ne'];

/** Primera sílaba aproximada: las consonantes iniciales y la primera vocal («mesa» → «me»). */
export const primeraSilaba = (texto: string) => {
	const t = texto.toLowerCase();
	return t.match(/^[^aeiouáéíóúü]*[aeiouáéíóúü]/)?.[0] ?? t.slice(0, 2);
};

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

	const disponibles: Record<Ronda['tipo'], Ronda | null> = {
		escucha: { tipo: 'escucha', meta: metas[0], opciones: opcionesPara(metas[0]) },
		lee: { tipo: 'lee', meta: metas[1 % metas.length], opciones: opcionesPara(metas[1 % metas.length]) },
		sonido: null,
		memoria: null,
		completa: null,
		ordena: null,
	};

	// ¿Con qué sonido empieza? La respuesta y dos sílabas iniciales distintas
	const metaSonido = metas[2 % metas.length];
	const correcta = primeraSilaba(metaSonido.texto);
	const otras = [...new Set([...pool.map((p) => primeraSilaba(p.texto)), ...SILABAS_DE_RESERVA])].filter((sil) => sil[0] !== correcta[0]);
	disponibles.sonido = { tipo: 'sonido', meta: metaSonido, correcta, opciones: mezclar([correcta, ...mezclar(otras, azar).slice(0, 2)], azar) };

	// Memoria: tres parejas imagen–palabra
	if (pool.length >= 3) {
		const pares = mezclar(metas, azar).slice(0, 3);
		const cartas = pares.flatMap((p): CartaMemoria[] => [
			{ clave: p.texto, palabra: p, cara: 'imagen' },
			{ clave: p.texto, palabra: p, cara: 'texto' },
		]);
		disponibles.memoria = { tipo: 'memoria', cartas: mezclar(cartas, azar) };
	}

	// Frases del cuento: una página con 2 a 4 palabras y al menos una con imagen
	const ordenables = cuento.paginas.filter((p) => p.palabras.length >= 2 && p.palabras.length <= 4 && p.palabras.some((w) => w.pictogramaUrl));
	if (ordenables.length > 0) {
		const paginaOrdenar = ordenables[vuelta % ordenables.length];
		let mezcla = mezclar(paginaOrdenar.palabras, azar);
		// Si quedó igual que la oración, se rota una posición para que haya algo que ordenar
		if (mezcla.every((w, i) => w === paginaOrdenar.palabras[i])) mezcla = [...mezcla.slice(1), mezcla[0]];
		disponibles.ordena = { tipo: 'ordena', frase: paginaOrdenar.textoCompleto, orden: paginaOrdenar.palabras, mezcla };

		// Completar: se esconde la última palabra con imagen y hay que elegirla
		const paginaCompletar = ordenables[(vuelta + 1) % ordenables.length];
		const hueco = paginaCompletar.palabras.map((w) => !!w.pictogramaUrl).lastIndexOf(true);
		const palabraHueco = paginaCompletar.palabras[hueco];
		if (pool.length >= 3) {
			const distractores = mezclar(pool.filter((p) => p.texto !== palabraHueco.texto), azar).slice(0, 2);
			disponibles.completa = {
				tipo: 'completa',
				frase: paginaCompletar.textoCompleto,
				palabras: paginaCompletar.palabras,
				hueco,
				opciones: mezclar([palabraHueco, ...distractores], azar),
			};
		}
	}

	// Siempre empieza con la más fácil (escuchar); el resto rota según la vuelta para que no se repita igual
	const resto = (['sonido', 'memoria', 'lee', 'completa', 'ordena'] as const).map((t) => disponibles[t]).filter((r): r is Ronda => r !== null);
	const inicio = vuelta % Math.max(resto.length, 1);
	const elegidas = [...resto.slice(inicio), ...resto.slice(0, inicio)].slice(0, MAXIMO_RONDAS - 1);
	const orden: Ronda['tipo'][] = ['lee', 'sonido', 'memoria', 'completa', 'ordena'];
	elegidas.sort((a, b) => orden.indexOf(a.tipo) - orden.indexOf(b.tipo));
	return [disponibles.escucha as Ronda, ...elegidas];
}
