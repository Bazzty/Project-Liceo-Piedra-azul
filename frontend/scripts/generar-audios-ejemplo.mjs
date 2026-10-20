/* ==========================================================
   Genera MP3 de EJEMPLO para los cuentos de Kinder.
   No es una voz: es una melodía suave de "caja de música" con una
   nota por palabra, para probar el flujo (botón ESCUCHAR + palabra
   que se ilumina) sin tener las grabaciones reales.

   Uso (necesita ffmpeg instalado):
     node scripts/generar-audios-ejemplo.mjs

   Cuando tengas la voz real (profesora o ElevenLabs), guarda tus MP3
   con el MISMO nombre en public/audio/cuentos/ y listo.
   Si agregas un cuento nuevo, agrega sus frases abajo.
   ========================================================== */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const salida = path.join(__dirname, '..', 'public', 'audio', 'cuentos');
fs.mkdirSync(salida, { recursive: true });

const CUENTOS = {
	'cuento-sapo-pepe': ['Pepe es un sapo.', 'Pepe salta en la sala.', 'Pepe ve una lupa.', 'Pepe toma sopa.', '¡Pepe es feliz!'],
	'cuento-mimi-lana': ['Mimi es una gata.', 'Mimi ve lana lila.', 'Mimi juega con la lana.', 'Mimi salta en la mesa.', 'Mimi duerme feliz.'],
	'cuento-mi-dia': ['Yo como pan.', 'Yo voy al colegio.', 'Yo juego con mi amigo.', 'Mamá me abraza.', 'Yo duermo en mi cama.'],
};

const SR = 22050;
// Escala pentatónica de Do mayor (suena siempre agradable)
const NOTAS = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];

function nota(freq, seg, vol = 0.32) {
	const n = Math.floor(SR * seg);
	const out = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const env = Math.min(1, t / 0.012) * Math.exp(-t * 5.2); // ataque corto + caída suave
		out[i] = vol * env * (Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(4 * Math.PI * freq * t) + 0.1 * Math.sin(6 * Math.PI * freq * t));
	}
	return out;
}

function melodia(frase, semilla) {
	const palabras = frase.replace(/[¡!¿?.,]/g, '').split(/\s+/).filter(Boolean);
	const trozos = [new Float32Array(Math.floor(SR * 0.15))];
	palabras.forEach((p, i) => {
		const idx = (p.length + i * 2 + semilla) % NOTAS.length;
		const duracion = 0.55;
		const n = nota(NOTAS[idx], duracion);
		trozos.push(n);
	});
	// Notita final que "cierra" la frase
	trozos.push(nota(NOTAS[0] * 2, 0.8, 0.26));
	const total = trozos.reduce((a, b) => a + b.length, 0);
	const pcm = new Int16Array(total);
	let pos = 0;
	for (const t of trozos) {
		for (let i = 0; i < t.length; i++) pcm[pos + i] = Math.max(-1, Math.min(1, t[i])) * 32767;
		pos += t.length;
	}
	return Buffer.from(pcm.buffer);
}

function aMp3(buffer, archivo) {
	return new Promise((resolve, reject) => {
		const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 's16le', '-ar', String(SR), '-ac', '1', '-i', 'pipe:0', '-b:a', '48k', archivo]);
		ff.on('error', reject);
		ff.on('close', (c) => (c === 0 ? resolve() : reject(new Error(`ffmpeg salió con código ${c}`))));
		ff.stdin.end(buffer);
	});
}

let semilla = 0;
for (const [id, frases] of Object.entries(CUENTOS)) {
	semilla += 1;
	for (let i = 0; i < frases.length; i++) {
		const archivo = path.join(salida, `${id}-p${i + 1}.mp3`);
		await aMp3(melodia(frases[i], semilla), archivo);
		console.log(`🎵 ${path.relative(path.join(__dirname, '..'), archivo)}`);
	}
}
console.log('\n✅ Listo. Recuerda: son sonidos de ejemplo, no voz.');
