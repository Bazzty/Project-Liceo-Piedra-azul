import { db } from './db';

export async function seedDatabase() {
 try {
 // 1. Niveles Pedagógicos
 await db.niveles.bulkPut([
 {
 id: 'nivel-a',
 codigo: 'A',
 nombre: 'Vocales, Sílabas y Palabras Simples',
 descripcion: 'Conciencia fonológica y combinación de sílabas (M, L, S, P, D)',
 orden: 1,
 },
 {
 id: 'nivel-b',
 codigo: 'B',
 nombre: 'Cuentos y Lectura Dual',
 descripcion: 'Lectura asistida con pictogramas y oraciones cortas',
 orden: 2,
 },
 ]);

 // 2. TABLERO DE COMUNICACIÓN AUMENTATIVA SAAC ("HABLAR")
 await db.pictogramas.bulkPut([
 // Necesidades
 { id: 'pic-agua', palabra: 'agua', categoria: 'necesidades', imagenUrl: '/pictogramas/arasaac/agua.png', audioUrl: '/audio/pictogramas/agua.mp3', esFotoReal: false },
 { id: 'pic-bano', palabra: 'baño', categoria: 'necesidades', imagenUrl: '/pictogramas/arasaac/bano.png', audioUrl: '/audio/pictogramas/bano.mp3', esFotoReal: false },
 { id: 'pic-comer', palabra: 'comer', categoria: 'necesidades', imagenUrl: '/pictogramas/arasaac/comer.png', audioUrl: '/audio/pictogramas/comer.mp3', esFotoReal: false },
 { id: 'pic-dormir', palabra: 'dormir', categoria: 'necesidades', imagenUrl: '/pictogramas/arasaac/dormir.png', audioUrl: '/audio/pictogramas/dormir.mp3', esFotoReal: false },
 { id: 'pic-ayuda', palabra: 'ayuda', categoria: 'necesidades', imagenUrl: '/pictogramas/arasaac/ayuda.png', audioUrl: '/audio/pictogramas/ayuda.mp3', esFotoReal: false },
 { id: 'pic-dolor', palabra: 'dolor', categoria: 'necesidades', imagenUrl: '/pictogramas/arasaac/dolor.png', audioUrl: '/audio/pictogramas/dolor.mp3', esFotoReal: false },
 { id: 'pic-frio', palabra: 'frío', categoria: 'necesidades', imagenUrl: '/pictogramas/arasaac/frio.png', audioUrl: '/audio/pictogramas/frio.mp3', esFotoReal: false },
 { id: 'pic-calor', palabra: 'calor', categoria: 'necesidades', imagenUrl: '/pictogramas/arasaac/calor.png', audioUrl: '/audio/pictogramas/calor.mp3', esFotoReal: false },

 // Emociones
 { id: 'pic-feliz', palabra: 'feliz', categoria: 'emociones', imagenUrl: '/pictogramas/arasaac/feliz.png', audioUrl: '/audio/pictogramas/feliz.mp3', esFotoReal: false },
 { id: 'pic-triste', palabra: 'triste', categoria: 'emociones', imagenUrl: '/pictogramas/arasaac/triste.png', audioUrl: '/audio/pictogramas/triste.mp3', esFotoReal: false },
 { id: 'pic-enojado', palabra: 'enojado', categoria: 'emociones', imagenUrl: '/pictogramas/arasaac/enojado.png', audioUrl: '/audio/pictogramas/enojado.mp3', esFotoReal: false },
 { id: 'pic-asustado', palabra: 'asustado', categoria: 'emociones', imagenUrl: '/pictogramas/arasaac/asustado.png', audioUrl: '/audio/pictogramas/asustado.mp3', esFotoReal: false },
 { id: 'pic-cansado', palabra: 'cansado', categoria: 'emociones', imagenUrl: '/pictogramas/arasaac/cansado.png', audioUrl: '/audio/pictogramas/cansado.mp3', esFotoReal: false },
 { id: 'pic-bien', palabra: 'bien', categoria: 'emociones', imagenUrl: '/pictogramas/arasaac/bien.png', audioUrl: '/audio/pictogramas/bien.mp3', esFotoReal: false },

 // Personas
 { id: 'pic-mama', palabra: 'mamá', categoria: 'personas', imagenUrl: '/pictogramas/arasaac/mama.png', audioUrl: '/audio/pictogramas/mama.mp3', esFotoReal: false },
 { id: 'pic-papa', palabra: 'papá', categoria: 'personas', imagenUrl: '/pictogramas/arasaac/papa.png', audioUrl: '/audio/pictogramas/papa.mp3', esFotoReal: false },
 { id: 'pic-profesor', palabra: 'profesor', categoria: 'personas', imagenUrl: '/pictogramas/arasaac/profesor.png', audioUrl: '/audio/pictogramas/profesor.mp3', esFotoReal: false },
 { id: 'pic-amigo', palabra: 'amigo', categoria: 'personas', imagenUrl: '/pictogramas/arasaac/amigo.png', audioUrl: '/audio/pictogramas/amigo.mp3', esFotoReal: false },
 { id: 'pic-nino', palabra: 'niño', categoria: 'personas', imagenUrl: '/pictogramas/arasaac/nino.png', audioUrl: '/audio/pictogramas/nino.mp3', esFotoReal: false },
 { id: 'pic-nina', palabra: 'niña', categoria: 'personas', imagenUrl: '/pictogramas/arasaac/nina.png', audioUrl: '/audio/pictogramas/nina.mp3', esFotoReal: false },

 // Acciones
 { id: 'pic-quiero', palabra: 'quiero', categoria: 'acciones', imagenUrl: '/pictogramas/arasaac/quiero.png', audioUrl: '/audio/pictogramas/quiero.mp3', esFotoReal: false },
 { id: 'pic-ir', palabra: 'ir', categoria: 'acciones', imagenUrl: '/pictogramas/arasaac/ir.png', audioUrl: '/audio/pictogramas/ir.mp3', esFotoReal: false },
 { id: 'pic-jugar', palabra: 'jugar', categoria: 'acciones', imagenUrl: '/pictogramas/arasaac/jugar.png', audioUrl: '/audio/pictogramas/jugar.mp3', esFotoReal: false },
 { id: 'pic-ver', palabra: 'ver', categoria: 'acciones', imagenUrl: '/pictogramas/arasaac/ver.png', audioUrl: '/audio/pictogramas/ver.mp3', esFotoReal: false },
 { id: 'pic-escuchar', palabra: 'escuchar', categoria: 'acciones', imagenUrl: '/pictogramas/arasaac/escuchar.png', audioUrl: '/audio/pictogramas/escuchar.mp3', esFotoReal: false },
 { id: 'pic-parar', palabra: 'parar', categoria: 'acciones', imagenUrl: '/pictogramas/arasaac/parar.png', audioUrl: '/audio/pictogramas/parar.mp3', esFotoReal: false },
 { id: 'pic-ama', palabra: 'ama', categoria: 'acciones', imagenUrl: '/pictogramas/arasaac/ama.png', audioUrl: '/audio/pictogramas/ama.mp3', esFotoReal: false },

 // Objetos y Entorno
 { id: 'pic-colegio', palabra: 'colegio', categoria: 'objetos', imagenUrl: '/pictogramas/arasaac/colegio.png', audioUrl: '/audio/pictogramas/colegio.mp3', esFotoReal: false },
 { id: 'pic-lapiz', palabra: 'lápiz', categoria: 'objetos', imagenUrl: '/pictogramas/arasaac/lapiz.png', audioUrl: '/audio/pictogramas/lapiz.mp3', esFotoReal: false },
 { id: 'pic-libro', palabra: 'libro', categoria: 'objetos', imagenUrl: '/pictogramas/arasaac/libro.png', audioUrl: '/audio/pictogramas/libro.mp3', esFotoReal: false },
 { id: 'pic-mesa', palabra: 'mesa', categoria: 'objetos', imagenUrl: '/pictogramas/arasaac/mesa.png', audioUrl: '/audio/pictogramas/mesa.mp3', esFotoReal: false },
 { id: 'pic-silla', palabra: 'silla', categoria: 'objetos', imagenUrl: '/pictogramas/arasaac/silla.png', audioUrl: '/audio/pictogramas/silla.mp3', esFotoReal: false },
 { id: 'pic-mochila', palabra: 'mochila', categoria: 'objetos', imagenUrl: '/pictogramas/arasaac/mochila.png', audioUrl: '/audio/pictogramas/mochila.mp3', esFotoReal: false },
 { id: 'pic-auto', palabra: 'auto', categoria: 'objetos', imagenUrl: '/pictogramas/arasaac/auto.png', audioUrl: '/audio/pictogramas/auto.mp3', esFotoReal: false },
 { id: 'pic-azul', palabra: 'azul', categoria: 'objetos', imagenUrl: '/pictogramas/arasaac/azul.png', audioUrl: '/audio/pictogramas/azul.mp3', esFotoReal: false },
 { id: 'pic-yo', palabra: 'yo', categoria: 'personas', imagenUrl: '/pictogramas/arasaac/yo.png', audioUrl: '/audio/pictogramas/yo.mp3', esFotoReal: false },
 ]);

 // 3. MÓDULO APRENDER: ACTIVIDADES NIVEL A Y CUENTOS NIVEL B
 await db.cuentos.bulkPut([
 // NIVEL A: Ejercicios de Palabras y Sílabas Iniciales
 {
 id: 'actividad-palabras-m-l-s-p-d',
 nivelId: 'nivel-a',
 titulo: 'Mis Primeras Palabras (M, L, S, P, D)',
 descripcion: 'Asociación fonética de vocales y palabras simples',
 portadaUrl: '/pictogramas/arasaac/mesa.png',
 estado: 'publicado',
 fechaCreacion: new Date().toISOString(),
 paginas: [
 {
 numeroPagina: 1,
 textoCompleto: 'Práctica de palabras con D, L, M, P, S',
 audioPaginaUrl: '/audio/cuentos/actividad_instruccion.mp3',
 palabras: [
 { texto: 'dado', pictogramaUrl: '/pictogramas/arasaac/dado.png', audioUrl: '/audio/palabras/da_dado.mp3' },
 { texto: 'dama', pictogramaUrl: '/pictogramas/arasaac/dama.png', audioUrl: '/audio/palabras/da_dama.mp3' },
 { texto: 'dedo', pictogramaUrl: '/pictogramas/arasaac/dedo.png', audioUrl: '/audio/palabras/de_dedo.mp3' },
 { texto: 'lana', pictogramaUrl: '/pictogramas/arasaac/lana.png', audioUrl: '/audio/palabras/la_lana.mp3' },
 { texto: 'lila', pictogramaUrl: '/pictogramas/arasaac/lila.png', audioUrl: '/audio/palabras/li_lila.mp3' },
 { texto: 'lima', pictogramaUrl: '/pictogramas/arasaac/lima.png', audioUrl: '/audio/palabras/li_lima.mp3' },
 { texto: 'lupa', pictogramaUrl: '/pictogramas/arasaac/lupa.png', audioUrl: '/audio/palabras/lu_lupa.mp3' },
 { texto: 'masa', pictogramaUrl: '/pictogramas/arasaac/masa.png', audioUrl: '/audio/palabras/ma_masa.mp3' },
 { texto: 'mesa', pictogramaUrl: '/pictogramas/arasaac/mesa.png', audioUrl: '/audio/palabras/me_mesa.mp3' },
 { texto: 'mimi', pictogramaUrl: '/pictogramas/arasaac/mimi.png', audioUrl: '/audio/palabras/mi_mimi.mp3' },
 { texto: 'mula', pictogramaUrl: '/pictogramas/arasaac/mula.png', audioUrl: '/audio/palabras/mu_mula.mp3' },
 { texto: 'pala', pictogramaUrl: '/pictogramas/arasaac/pala.png', audioUrl: '/audio/palabras/pa_pala.mp3' },
 { texto: 'pelo', pictogramaUrl: '/pictogramas/arasaac/pelo.png', audioUrl: '/audio/palabras/pe_pelo.mp3' },
 { texto: 'piso', pictogramaUrl: '/pictogramas/arasaac/piso.png', audioUrl: '/audio/palabras/pi_piso.mp3' },
 { texto: 'puma', pictogramaUrl: '/pictogramas/arasaac/puma.png', audioUrl: '/audio/palabras/pu_puma.mp3' },
 { texto: 'sala', pictogramaUrl: '/pictogramas/arasaac/sala.png', audioUrl: '/audio/palabras/sa_sala.mp3' },
 { texto: 'sapo', pictogramaUrl: '/pictogramas/arasaac/sapo.png', audioUrl: '/audio/palabras/sa_sapo.mp3' },
 { texto: 'sopa', pictogramaUrl: '/pictogramas/arasaac/sopa.png', audioUrl: '/audio/palabras/so_sopa.mp3' },
 ],
 },
 ],
 },
 // NIVEL B: Cuentos Cortos
 {
 id: 'cuento-auto-ana',
 nivelId: 'nivel-b',
 titulo: 'El Auto de Ana',
 descripcion: 'Práctica de vocales A y E',
 portadaUrl: '/pictogramas/arasaac/auto.png',
 estado: 'publicado',
 fechaCreacion: new Date().toISOString(),
 paginas: [
 {
 numeroPagina: 1,
 textoCompleto: 'Ana ve un auto azul',
 audioPaginaUrl: '/audio/cuentos/cuento-auto-ana_p1.mp3',
 palabras: [
 { texto: 'Ana', pictogramaUrl: '/pictogramas/arasaac/nina.png', audioUrl: '/audio/pictogramas/nina.mp3' },
 { texto: 've', pictogramaUrl: '/pictogramas/arasaac/ver.png', audioUrl: '/audio/pictogramas/ver.mp3' },
 { texto: 'un', audioUrl: '/audio/fonemas/u.mp3' },
 { texto: 'auto', pictogramaUrl: '/pictogramas/arasaac/auto.png', audioUrl: '/audio/pictogramas/auto.mp3' },
 { texto: 'azul', pictogramaUrl: '/pictogramas/arasaac/azul.png', audioUrl: '/audio/pictogramas/azul.mp3' },
 ],
 },
 ],
 },
 {
 id: 'cuento-mi-mama',
 nivelId: 'nivel-b',
 titulo: 'Mi Mamá me Ama',
 descripcion: 'Práctica de consonante M',
 portadaUrl: '/pictogramas/arasaac/mama.png',
 estado: 'publicado',
 fechaCreacion: new Date().toISOString(),
 paginas: [
 {
 numeroPagina: 1,
 textoCompleto: 'Mi mamá me ama',
 audioPaginaUrl: '/audio/cuentos/cuento-mi-mama_p1.mp3',
 palabras: [
 { texto: 'Mi', audioUrl: '/audio/fonemas/mi.mp3' },
 { texto: 'mamá', pictogramaUrl: '/pictogramas/arasaac/mama.png', audioUrl: '/audio/pictogramas/mama.mp3' },
 { texto: 'me', audioUrl: '/audio/fonemas/me.mp3' },
 { texto: 'ama', pictogramaUrl: '/pictogramas/arasaac/ama.png', audioUrl: '/audio/pictogramas/ama.mp3' },
 ],
 },
 ],
 },
 ]);

 // 4. Alumnos de Prueba
 await db.alumnos.bulkPut([
 {
 id: 'estudiante-mateo',
 nombre: 'Mateo',
 apellido: 'Pérez',
 avatarUrl: '/assets/avatars/estudiante_demo.jpg',
 temaId: 'calma-azul',
 personajeId: 'dinosaurio',
 fechaCreacion: new Date().toISOString(),
 },
 ]);

 console.log('✅ Base de datos inicializada correctamente.');
 } catch (error) {
 console.error('❌ Error al inicializar la base de datos:', error);
 }
}