#!/usr/bin/env node
/**
 * Genera los audios que faltan con la voz del proyecto (ElevenLabs).
 *
 * Lee scripts/audios.manifest.json (lista de { archivo, texto }), y para cada entrada:
 *  - si el .mp3 ya existe y el texto no cambió, lo salta;
 *  - si no existe, o el texto cambió, lo genera y lo guarda en public/audio/<archivo>.
 *
 * Uso:
 *   npm run audios                 # genera lo que falta
 *   npm run audios -- --dry-run    # solo muestra qué haría, sin llamar a la API
 *   npm run audios -- --forzar     # regenera todo
 *   npm run audios -- --solo=interfaz   # solo los archivos que empiezan con "interfaz/"
 *
 * Configuración (variables de entorno o archivo .env.local, que NO se sube a git):
 *   ELEVENLABS_API_KEY   clave de la cuenta (nunca en el código ni en el chat)
 *   ELEVENLABS_VOICE_ID  id de la voz del proyecto
 *   ELEVENLABS_MODEL     opcional, por defecto eleven_multilingual_v2
 *   VOZ_ESTABILIDAD / VOZ_SIMILITUD / VOZ_VELOCIDAD   opcionales (0.3 / 1 / 1)
 *
 * Los textos se envían a ElevenLabs: no incluir nombres ni datos de niños en el manifiesto.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CARPETA_AUDIO = join(RAIZ, 'public', 'audio');
const MANIFIESTO = join(RAIZ, 'scripts', 'audios.manifest.json');
const ESTADO = join(RAIZ, 'scripts', 'audios.estado.json');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const forzar = args.includes('--forzar');
const solo = args.find((a) => a.startsWith('--solo='))?.slice('--solo='.length);

// Carga simple de .env.local (sin dependencias)
const archivoEnv = join(RAIZ, '.env.local');
if (existsSync(archivoEnv)) {
  for (const linea of readFileSync(archivoEnv, 'utf8').split('\n')) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const hash = (texto) => createHash('sha1').update(texto).digest('hex');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const leerJson = (ruta, porDefecto) => (existsSync(ruta) ? JSON.parse(readFileSync(ruta, 'utf8')) : porDefecto);

const manifiesto = leerJson(MANIFIESTO, []).filter((e) => !solo || e.archivo.startsWith(solo));
const estado = leerJson(ESTADO, {});

// Solo se escribe dentro de public/audio (el manifiesto es de confianza, pero se valida igual)
const rutaSegura = (archivo) => {
  const ruta = normalize(join(CARPETA_AUDIO, archivo));
  if (!ruta.startsWith(CARPETA_AUDIO + sep) || !ruta.endsWith('.mp3')) throw new Error(`Ruta no permitida: ${archivo}`);
  return ruta;
};

const pendientes = manifiesto.filter((e) => {
  const ruta = rutaSegura(e.archivo);
  return forzar || !existsSync(ruta) || estado[e.archivo] !== hash(e.texto);
});

console.log(`Manifiesto: ${manifiesto.length} audios · pendientes: ${pendientes.length}`);
if (pendientes.length === 0) {
  console.log('Todo está al día.');
  process.exit(0);
}
if (dryRun) {
  for (const e of pendientes) console.log(`  - ${e.archivo}: "${e.texto}"`);
  console.log('\n(dry-run: no se llamó a la API)');
  process.exit(0);
}

const clave = process.env.ELEVENLABS_API_KEY;
const voz = process.env.ELEVENLABS_VOICE_ID;
if (!clave || !voz) {
  console.error('Faltan ELEVENLABS_API_KEY y/o ELEVENLABS_VOICE_ID (ver .env.example).');
  process.exit(1);
}

const modelo = process.env.ELEVENLABS_MODEL ?? 'eleven_multilingual_v2';
const ajustes = {
  stability: Number(process.env.VOZ_ESTABILIDAD ?? 0.3),
  similarity_boost: Number(process.env.VOZ_SIMILITUD ?? 1),
  speed: Number(process.env.VOZ_VELOCIDAD ?? 1),
};

const generar = async (texto, intento = 1) => {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voz}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': clave, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: texto, model_id: modelo, voice_settings: ajustes }),
  });
  if (res.status === 401) throw new Error('La clave de ElevenLabs no es válida (401).');
  if (res.status === 429 && intento <= 3) {
    await esperar(2000 * intento);
    return generar(texto, intento + 1);
  }
  if (!res.ok) throw new Error(`ElevenLabs respondió ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return Buffer.from(await res.arrayBuffer());
};

let correctos = 0;
const fallidos = [];
for (const e of pendientes) {
  try {
    const audio = await generar(e.texto);
    const ruta = rutaSegura(e.archivo);
    mkdirSync(dirname(ruta), { recursive: true });
    writeFileSync(ruta, audio);
    estado[e.archivo] = hash(e.texto);
    writeFileSync(ESTADO, `${JSON.stringify(estado, null, 2)}\n`);
    correctos += 1;
    console.log(`  ✔ ${e.archivo}`);
  } catch (error) {
    fallidos.push(e.archivo);
    console.error(`  ✖ ${e.archivo}: ${error.message}`);
    if (String(error.message).includes('401')) break;
  }
  await esperar(400);
}

console.log(`\nListo: ${correctos} generados, ${fallidos.length} con error.`);
if (fallidos.length) process.exit(1);
