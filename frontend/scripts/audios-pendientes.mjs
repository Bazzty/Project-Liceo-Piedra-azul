#!/usr/bin/env node
/**
 * Agrega al manifiesto y genera con ElevenLabs los audios que el tablero necesita y aún no existen:
 *  - el nombre de cada carpeta de la plantilla general (textos/);
 *  - el sonido de cada consonante del teclado (fonemas/<letra>.mp3).
 *
 *   npm run audios:pendientes               # agrega, genera y actualiza el índice
 *   npm run audios:pendientes -- --dry-run  # solo muestra qué haría
 *
 * Necesita ELEVENLABS_API_KEY (con el permiso «Text to Speech») y ELEVENLABS_VOICE_ID en frontend/.env.local.
 * Si la generación falla, el manifiesto queda como estaba: una prueba exige que cada entrada tenga su archivo.
 *
 * ⚠ Hay que ESCUCHAR cada archivo: un TTS no dice bien una consonante suelta. Las alargadas se piden con «sss»,
 * «fff»…; las explosivas, con una e breve («pe», «te»). Lo que suene mal se reemplaza (o lo graba la profesora).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { claveDeTexto, construirIndice } from './indice-audios.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFIESTO = join(RAIZ, 'scripts', 'audios.manifest.json');
const INDICE = join(RAIZ, 'src', 'shared', 'config', 'audiosPorTexto.json');
const dryRun = process.argv.includes('--dry-run');

/** Sonido de cada letra que aún no tiene grabación (las vocales y la «m» ya están). */
const LETRAS = {
  b: 'Be.', c: 'Ke.', d: 'De.', f: 'Ffff.', g: 'Gue.', h: 'Hache.', j: 'Jjjj.', k: 'Ke.', l: 'Lll.', n: 'Nnn.',
  p: 'Pe.', q: 'Ke.', r: 'Rrr.', s: 'Sss.', t: 'Te.', v: 'Be.', w: 'Gu.', x: 'Ks.', y: 'Yyy.', z: 'Sss.', enie: 'Ñe.',
};
const CARPETAS = ['Necesidades', 'Emociones', 'Personas', 'Acciones', 'Objetos'];

const original = readFileSync(MANIFIESTO, 'utf8');
const manifiesto = JSON.parse(original);
const archivos = new Set(manifiesto.map((e) => e.archivo));
const yaIndexados = construirIndice(manifiesto);

const nuevas = [
  // `para: []`: se piden por su ruta, no por texto, así no pisan sílabas como «pe» o «te»
  ...Object.entries(LETRAS).map(([letra, texto]) => ({ archivo: `fonemas/${letra}.mp3`, texto, para: [] })),
  ...CARPETAS.map((nombre) => ({ archivo: `textos/${claveDeTexto(nombre)}.mp3`, texto: `${nombre}.` })),
].filter((e) => !archivos.has(e.archivo) && !(e.para === undefined && claveDeTexto(e.texto) in yaIndexados));

if (nuevas.length === 0) {
  console.log('No falta nada: todos los audios del tablero ya están en el manifiesto.');
  process.exit(0);
}

console.log(`Audios por agregar (${nuevas.length}):`);
for (const e of nuevas) console.log(`  - ${e.archivo}: "${e.texto}"`);
if (dryRun) {
  console.log('\n(dry-run: no se cambió nada)');
  process.exit(0);
}

writeFileSync(MANIFIESTO, `${JSON.stringify([...manifiesto, ...nuevas], null, 2)}\n`);
const resultado = spawnSync(process.execPath, [join(RAIZ, 'scripts', 'generar-audios.mjs')], { cwd: RAIZ, stdio: 'inherit' });

// Solo se conservan las entradas cuyo archivo se generó; si no salió ninguna, el manifiesto vuelve a como estaba
const generadas = nuevas.filter((e) => existsSync(join(RAIZ, 'public', 'audio', e.archivo)));
if (generadas.length === 0) {
  writeFileSync(MANIFIESTO, original);
  console.error('\nNo se generó ningún audio: el manifiesto quedó como estaba.');
  process.exit(resultado.status || 1);
}
writeFileSync(MANIFIESTO, `${JSON.stringify([...manifiesto, ...generadas], null, 2)}\n`);
writeFileSync(INDICE, `${JSON.stringify(construirIndice([...manifiesto, ...generadas]), null, 2)}\n`);
console.log(`\n${generadas.length} audios agregados al manifiesto y al índice. ESCÚCHALOS antes de dar el resultado por bueno.`);
if (generadas.length < nuevas.length) console.error(`Faltaron ${nuevas.length - generadas.length}: vuelve a correr el comando.`);
process.exit(resultado.status ?? 0);
