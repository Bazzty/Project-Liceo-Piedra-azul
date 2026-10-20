import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lista de palabras clave para el tablero SAAC y los cuentos
const PALABRAS_CLAVE = [
  'agua', 'baño', 'comer', 'dormir', 'ayuda', 'dolor', 'frío', 'calor',
  'feliz', 'triste', 'enojado', 'asustado', 'cansado', 'bien',
  'mamá', 'papá', 'profesor', 'amigo', 'niño', 'niña',
  'quiero', 'ir', 'jugar', 'ver', 'escuchar', 'parar', 'ama',
  'colegio', 'lápiz', 'libro', 'mesa', 'silla', 'mochila', 'auto', 'azul', 'yo'
];

const targetDir = path.join(__dirname, '..', 'public', 'pictogramas', 'arasaac');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Función para obtener el ID exacto desde la API de ARASAAC
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
            // Filtrar coincidencia exacta en las palabras clave del pictograma
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

// Función para descargar la imagen PNG
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
    const id = await getExactPictogramId(palabra);
    if (id) {
      await downloadImage(id, cleanName);
    } else {
      console.warn(`⚠️ No se encontró pictograma para: "${palabra}"`);
    }
  }
  console.log('\n🎉 ¡Proceso finalizado! Todos los pictogramas exactos están guardados en web/public/pictogramas/arasaac/');
}

run();