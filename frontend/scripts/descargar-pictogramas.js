import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PALABRAS_CLAVE = [
	// Tablero SAAC
	'agua', 'baño', 'comer', 'dormir', 'ayuda', 'dolor', 'frío', 'calor',
	'feliz', 'triste', 'enojado', 'asustado', 'cansado', 'bien',
	'mamá', 'papá', 'profesor', 'amigo', 'niño', 'niña',
	'quiero', 'ir', 'jugar', 'ver', 'escuchar', 'parar', 'ama',
	'colegio', 'lápiz', 'libro', 'mesa', 'silla', 'mochila', 'auto', 'azul', 'yo',
	// Palabras de Actividades (Nivel A - palabras.png)
	'dado', 'dama', 'dedo', 'lana', 'lila', 'lima', 'lupa', 'masa',
	'mimi', 'mula', 'pala', 'pelo', 'piso', 'puma', 'sala', 'sapo', 'sopa',
	// Cuentos de Kinder (El Sapo Pepe, Mimi y la Lana, Mi Día)
	'saltar', 'tomar', 'gato', 'pan', 'cama', 'abrazar'
];

// Pictogramas revisados a mano, uno por uno, contra la palabra que ilustran. La búsqueda automática se
// equivocaba (p. ej. «ama» daba una cama, «enojado» una persona barriendo), así que estos IDs mandan.
// Para cambiar uno: buscar en arasaac.org, anotar el número y ponerlo aquí.
const ID_FIJOS = {
	enojado: 35539, frio: 35557, ama: 6898,
	dado: 2731, dama: 4745, dedo: 3298, lana: 2948, lila: 2940, lima: 15453, lupa: 9927, masa: 32476,
	mimi: 7114, gato: 7114, mula: 2291 /* burro: ARASAAC no tiene mula */, pala: 2867, pelo: 2851,
	piso: 2575 /* suelo */, puma: 9068, sala: 6211 /* living */, sapo: 3384, sopa: 2573,
	saltar: 28441, tomar: 6061, pan: 2494, cama: 2304, abrazar: 6023,
};

const targetDir = path.join(__dirname, '..', 'public', 'pictogramas', 'arasaac');
if (!fs.existsSync(targetDir)) {
	fs.mkdirSync(targetDir, { recursive: true });
}

function getExactPictogramId(palabra) {
	return new Promise((resolve) => {
		const cleanWord = palabra.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
		const url = `https://api.arasaac.org/v1/pictograms/es/search/${encodeURIComponent(cleanWord)}`;
		
		https.get(url, (res) => {
			let data = '';
			res.on('data', (chunk) => (data += chunk));
			res.on('end', () => {
				try {
					const json = JSON.parse(data);
					if (Array.isArray(json) && json.length > 0) {
						const exactMatch = json.find((item) =>
							item.keywords?.some(
								(k) => k.keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === cleanWord
							)
						);
						resolve(exactMatch ? exactMatch._id : json[0]._id);
					} else {
						resolve(null);
					}
				} catch {
					resolve(null);
				}
			});
		}).on('error', () => resolve(null));
	});
}

function downloadImage(id, nombreArchivo) {
	return new Promise((resolve) => {
		const url = `https://static.arasaac.org/pictograms/${id}/${id}_500.png`;
		const filePath = path.join(targetDir, `${nombreArchivo}.png`);
		const file = fs.createWriteStream(filePath);
		
		https.get(url, (res) => {
			if (res.statusCode === 200) {
				res.pipe(file);
				file.on('finish', () => {
					file.close();
					console.log(`✅ Descargado pictograma exacto: ${nombreArchivo}.png (ID: ${id})`);
					resolve();
				});
			} else {
				fs.unlink(filePath, () => {});
				console.error(`❌ Error HTTP ${res.statusCode} al descargar ${nombreArchivo}`);
				resolve();
			}
		}).on('error', () => resolve());
	});
}

async function run() {
	console.log('🚀 Buscando e identificando pictogramas exactos en ARASAAC...\n');
	for (const palabra of PALABRAS_CLAVE) {
		const cleanName = palabra.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
		const id = ID_FIJOS[cleanName] ?? (await getExactPictogramId(palabra));
		if (id) {
			await downloadImage(id, cleanName);
		} else {
			console.warn(`⚠️ No se encontró pictograma para: "${palabra}"`);
		}
	}
	console.log('\n🎉 ¡Proceso finalizado! Todos los pictogramas exactos están guardados en web/public/pictogramas/arasaac/');
}

run();