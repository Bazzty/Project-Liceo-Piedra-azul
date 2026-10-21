import { db } from '@/db/db';
import { sembrarCuentosKinder } from '@/mocks/cuentosKinder';
import { sembrarCuentosPalabras } from '@/mocks/cuentosPalabras';
import type { Cuento } from '@/types';

// ---------------------------------------------------------------------------
// DATOS SIMULADOS PARA EL PANEL DOCENTE
// Simulan lo que en producción enviaría el backend (api/). Son datos de prueba:
// nombres ficticios, NO corresponden a estudiantes reales.
// ---------------------------------------------------------------------------

// Fecha relativa a hoy: hace(2, 10, 40) = hace 2 días a las 10:40
const hace = (dias: number, hora: number, minuto = 0): string => {
	const d = new Date();
	d.setDate(d.getDate() - dias);
	d.setHours(hora, minuto, 0, 0);
	return d.toISOString();
};

async function seedDemoDocente() {
	// Solo se ejecuta una vez (si ya hay bitácora, no se vuelve a sembrar)
	if ((await db.registros.count()) > 0) return;

	const ahora = new Date().toISOString();

	// Alumnos ficticios adicionales (Mateo ya existe en el seed base)
	await db.alumnos.bulkPut([
		{ id: 'estudiante-sofia', nombre: 'Sofía', apellido: 'Rojas', temaId: 'calida', personajeId: 'oso', vozId: 'catalina-cl', fechaCreacion: ahora },
		{ id: 'estudiante-benjamin', nombre: 'Benjamín', apellido: 'Soto', temaId: 'suave', personajeId: 'oso', vozId: 'catalina-cl', fechaCreacion: ahora },
		{ id: 'estudiante-valentina', nombre: 'Valentina', apellido: 'Muñoz', temaId: 'alto-contraste', personajeId: 'oso', vozId: 'profesora-clonada', fechaCreacion: ahora },
		{ id: 'estudiante-joaquin', nombre: 'Joaquín', apellido: 'Díaz', temaId: 'suave', personajeId: 'oso', vozId: 'catalina-cl', fechaCreacion: ahora },
		{ id: 'estudiante-emilia', nombre: 'Emilia', apellido: 'Vera', temaId: 'calida', personajeId: 'oso', vozId: 'catalina-cl', fechaCreacion: ahora },
	]);

	// Mateo: asignarle voz por defecto sin pisar sus demás datos
	await db.alumnos.update('estudiante-mateo', { vozId: 'catalina-cl' });

	// Progreso por alumno y cuento
	const A = 'actividad-palabras-m-l-s-p-d';
	const B1 = 'cuento-auto-ana';
	const B2 = 'cuento-mi-mama';

	const prog = (alumnoId: string, cuentoId: string, completado: boolean, dias: number, hora: number) => ({
		alumnoId,
		cuentoId,
		completado,
		paginaActual: completado ? 1 : 0,
		fechaUltimoAcceso: hace(dias, hora, 15),
	});

	await db.progresos.bulkAdd([
		prog('estudiante-mateo', A, true, 0, 10), prog('estudiante-mateo', B1, true, 1, 11), prog('estudiante-mateo', B2, false, 0, 10),
		prog('estudiante-sofia', A, true, 1, 10), prog('estudiante-sofia', B1, true, 1, 10), prog('estudiante-sofia', B2, true, 2, 9),
		prog('estudiante-benjamin', A, true, 2, 9), prog('estudiante-benjamin', B1, false, 0, 11),
		prog('estudiante-valentina', A, false, 3, 10),
		prog('estudiante-joaquin', A, true, 4, 11), prog('estudiante-joaquin', B1, false, 2, 10),
		// Emilia aún no inicia ninguna lectura
	]);

	// Bitácora de actividad (sesiones, lecturas y uso del tablero)
	const reg = (
		alumnoId: string,
		tipo: 'sesion' | 'lectura' | 'tablero' | 'actividad',
		detalle: string,
		lugar: 'liceo' | 'casa',
		fecha: string,
		extra: { palabrasEscuchadas?: number; pictogramaIds?: string[] } = {}
	) => ({ alumnoId, tipo, detalle, lugar, fecha, ...extra });

	await db.registros.bulkAdd([
		// Mateo
		reg('estudiante-mateo', 'sesion', 'Sesión en el liceo', 'liceo', hace(0, 10, 0)),
		reg('estudiante-mateo', 'lectura', 'Comenzó «Mi Mamá me Ama»', 'liceo', hace(0, 10, 40), { palabrasEscuchadas: 4 }),
		reg('estudiante-mateo', 'tablero', 'Tablero: «yo quiero agua»', 'liceo', hace(0, 10, 55), { pictogramaIds: ['pic-yo', 'pic-quiero', 'pic-agua'] }),
		reg('estudiante-mateo', 'actividad', 'Actividades de «El Auto de Ana»: 4 de 5 sin ayuda', 'casa', hace(1, 18, 30)),
		reg('estudiante-mateo', 'sesion', 'Sesión en casa', 'casa', hace(1, 18, 10)),
		reg('estudiante-mateo', 'lectura', 'Terminó «El Auto de Ana»', 'casa', hace(1, 18, 15), { palabrasEscuchadas: 5 }),
		reg('estudiante-mateo', 'lectura', 'Terminó «Mis Primeras Palabras (M, L, S, P, D)»', 'liceo', hace(2, 10, 30), { palabrasEscuchadas: 18 }),
		// Sofía
		reg('estudiante-sofia', 'sesion', 'Sesión en el liceo', 'liceo', hace(1, 10, 0)),
		reg('estudiante-sofia', 'lectura', 'Terminó «Mi Mamá me Ama»', 'liceo', hace(2, 9, 20), { palabrasEscuchadas: 4 }),
		reg('estudiante-sofia', 'lectura', 'Terminó «El Auto de Ana»', 'liceo', hace(1, 10, 20), { palabrasEscuchadas: 5 }),
		reg('estudiante-sofia', 'actividad', 'Actividades de «El Auto de Ana»: 5 de 5 sin ayuda', 'liceo', hace(1, 10, 35)),
		reg('estudiante-sofia', 'tablero', 'Tablero: «mamá feliz»', 'liceo', hace(1, 10, 45), { pictogramaIds: ['pic-mama', 'pic-feliz'] }),
		// Benjamín
		reg('estudiante-benjamin', 'sesion', 'Sesión en el liceo', 'liceo', hace(2, 9, 0)),
		reg('estudiante-benjamin', 'lectura', 'Terminó «Mis Primeras Palabras (M, L, S, P, D)»', 'liceo', hace(2, 9, 30), { palabrasEscuchadas: 12 }),
		reg('estudiante-benjamin', 'tablero', 'Tablero: «quiero jugar»', 'liceo', hace(0, 11, 20), { pictogramaIds: ['pic-quiero', 'pic-jugar'] }),
		// Valentina
		reg('estudiante-valentina', 'sesion', 'Sesión en el liceo', 'liceo', hace(3, 10, 0)),
		reg('estudiante-valentina', 'lectura', 'Comenzó «Mis Primeras Palabras (M, L, S, P, D)»', 'liceo', hace(3, 10, 25), { palabrasEscuchadas: 7 }),
		reg('estudiante-valentina', 'tablero', 'Tablero: «ayuda»', 'liceo', hace(3, 10, 50), { pictogramaIds: ['pic-ayuda'] }),
		// Joaquín
		reg('estudiante-joaquin', 'sesion', 'Sesión en el liceo', 'liceo', hace(4, 11, 0)),
		reg('estudiante-joaquin', 'lectura', 'Terminó «Mis Primeras Palabras (M, L, S, P, D)»', 'liceo', hace(4, 11, 30), { palabrasEscuchadas: 9 }),
		reg('estudiante-joaquin', 'sesion', 'Sesión en casa', 'casa', hace(2, 17, 30)),
		reg('estudiante-joaquin', 'tablero', 'Tablero: «yo quiero comer»', 'casa', hace(2, 17, 40), { pictogramaIds: ['pic-yo', 'pic-quiero', 'pic-comer'] }),
		// Emilia
		reg('estudiante-emilia', 'sesion', 'Sesión en el liceo', 'liceo', hace(5, 10, 0)),
		reg('estudiante-emilia', 'tablero', 'Tablero: «agua»', 'liceo', hace(5, 10, 10), { pictogramaIds: ['pic-agua'] }),
	]);
}

/**
 * Borra TODAS las tablas locales y vuelve a cargar los datos de demostración.
 * Útil para reiniciar la demo (se usa desde el botón del panel docente).
 */
export async function resetDemoData() {
	await Promise.all([
		db.alumnos.clear(),
		db.niveles.clear(),
		db.pictogramas.clear(),
		db.cuentos.clear(),
		db.progresos.clear(),
		db.registros.clear(),
	]);
	await seedDatabase();
}

// Cada bloque de seedDatabase() solo puebla su tabla si está vacía (primer inicio).
// Así, lo que el docente cree/edite/elimine desde el panel NO se pisa al recargar.
export async function seedDatabase() {
	try {
		// Privacidad y derechos: ningún alumno usa fotos (se muestra su inicial o un pictograma).
		// Limpia la foto de demostración que traían los datos guardados en versiones anteriores.
		await db.alumnos.toCollection().modify((a) => {
			if (a.avatarUrl) delete a.avatarUrl;
		});

		// 1. Niveles Pedagógicos
		if ((await db.niveles.count()) === 0) {
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
		}

		// 2. TABLERO DE COMUNICACIÓN AUMENTATIVA SAAC ("HABLAR")
		if ((await db.pictogramas.count()) === 0) {
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
		}

		// 3. Alumnos Demo Base
		if ((await db.alumnos.count()) === 0) {
			await db.alumnos.bulkPut([
				{
					id: 'estudiante-mateo',
					nombre: 'Mateo',
					apellido: 'Pérez',
					temaId: 'suave',
					personajeId: 'oso',
					fechaCreacion: new Date().toISOString(),
				},
			]);
		}

		// 4. MÓDULO APRENDER: ACTIVIDADES NIVEL A Y CUENTOS NIVEL B
		if ((await db.cuentos.count()) === 0) {
			// Actividades individuales de Palabras Simples (Nivel A)
			const palabrasNivelA = [
				{ id: 'act-mesa', palabra: 'Mesa', audio: 'me_mesa.mp3', img: 'mesa.png', s1: 'ME', a1: 'me.mp3', s2: 'SA', a2: 'sa.mp3' },
				{ id: 'act-dado', palabra: 'Dado', audio: 'da_dado.mp3', img: 'dado.png', s1: 'DA', a1: 'da.mp3', s2: 'DO', a2: 'do.mp3' },
				{ id: 'act-dama', palabra: 'Dama', audio: 'da_dama.mp3', img: 'dama.png', s1: 'DA', a1: 'da.mp3', s2: 'MA', a2: 'ma.mp3' },
				{ id: 'act-dedo', palabra: 'Dedo', audio: 'de_dedo.mp3', img: 'dedo.png', s1: 'DE', a1: 'de.mp3', s2: 'DO', a2: 'do.mp3' },
				{ id: 'act-lana', palabra: 'Lana', audio: 'la_lana.mp3', img: 'lana.png', s1: 'LA', a1: 'la.mp3', s2: 'NA', a2: 'a.mp3' },
				{ id: 'act-lila', palabra: 'Lila', audio: 'li_lila.mp3', img: 'lila.png', s1: 'LI', a1: 'li.mp3', s2: 'LA', a2: 'la.mp3' },
				{ id: 'act-lima', palabra: 'Lima', audio: 'li_lima.mp3', img: 'lima.png', s1: 'LI', a1: 'li.mp3', s2: 'MA', a2: 'ma.mp3' },
				{ id: 'act-lupa', palabra: 'Lupa', audio: 'lu_lupa.mp3', img: 'lupa.png', s1: 'LU', a1: 'lu.mp3', s2: 'PA', a2: 'pa.mp3' },
				{ id: 'act-masa', palabra: 'Masa', audio: 'ma_masa.mp3', img: 'masa.png', s1: 'MA', a1: 'ma.mp3', s2: 'SA', a2: 'sa.mp3' },
				{ id: 'act-mula', palabra: 'Mula', audio: 'mu_mula.mp3', img: 'mula.png', s1: 'MU', a1: 'mu.mp3', s2: 'LA', a2: 'la.mp3' },
				{ id: 'act-pala', palabra: 'Pala', audio: 'pa_pala.mp3', img: 'pala.png', s1: 'PA', a1: 'pa.mp3', s2: 'LA', a2: 'la.mp3' },
				{ id: 'act-pelo', palabra: 'Pelo', audio: 'pe_pelo.mp3', img: 'pelo.png', s1: 'PE', a1: 'pe.mp3', s2: 'LO', a2: 'lo.mp3' },
				{ id: 'act-piso', palabra: 'Piso', audio: 'pi_piso.mp3', img: 'piso.png', s1: 'PI', a1: 'pi.mp3', s2: 'SO', a2: 'so.mp3' },
				{ id: 'act-puma', palabra: 'Puma', audio: 'pu_puma.mp3', img: 'puma.png', s1: 'PU', a1: 'pu.mp3', s2: 'MA', a2: 'ma.mp3' },
				{ id: 'act-sala', palabra: 'Sala', audio: 'sa_sala.mp3', img: 'sala.png', s1: 'SA', a1: 'sa.mp3', s2: 'LA', a2: 'la.mp3' },
				{ id: 'act-sapo', palabra: 'Sapo', audio: 'sa_sapo.mp3', img: 'sapo.png', s1: 'SA', a1: 'sa.mp3', s2: 'PO', a2: 'po.mp3' },
				{ id: 'act-sopa', palabra: 'Sopa', audio: 'so_sopa.mp3', img: 'sopa.png', s1: 'SO', a1: 'so.mp3', s2: 'PA', a2: 'pa.mp3' },
			];

			const actividadesIndividualesNivelA: Cuento[] = palabrasNivelA.map((item) => ({
				id: item.id,
				nivelId: 'nivel-a',
				titulo: item.palabra,
				descripcion: `Actividad individual: ${item.palabra}`,
				portadaUrl: `/pictogramas/arasaac/${item.img}`,
				estado: 'publicado',
				fechaCreacion: new Date().toISOString(),
				paginas: [
					{
						numeroPagina: 1,
						textoCompleto: item.palabra,
						palabras: [
							{
								texto: item.palabra,
								pictogramaUrl: `/pictogramas/arasaac/${item.img}`,
								audioUrl: `/audio/palabras/${item.audio}`,
								silabas: [
									{ texto: item.s1, audioUrl: `/audio/fonemas/${item.a1}` },
									{ texto: item.s2, audioUrl: `/audio/fonemas/${item.a2}` },
								],
							},
						],
					},
				],
			}));

			// Actividad grupal de fonemas M, L, S, P, D (referenciada por el panel docente)
			const actividadGrupalNivelA: Cuento = {
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
			};

			// Cuentos asignados al Nivel B
			const cuentosNivelB: Cuento[] = [
				{
					id: 'cuento-mochila',
					nivelId: 'nivel-b',
					titulo: 'Mi Mochila Nueva',
					descripcion: 'Cuento corto enviado a revisión',
					portadaUrl: '/pictogramas/arasaac/mochila.png',
					estado: 'en_revision',
					fechaCreacion: new Date().toISOString(),
					paginas: [
						{
							numeroPagina: 1,
							textoCompleto: 'Tengo una mochila nueva',
							palabras: [
								{ texto: 'Tengo' },
								{ texto: 'una' },
								{ texto: 'mochila', pictogramaUrl: '/pictogramas/arasaac/mochila.png', audioUrl: '/audio/pictogramas/mochila.mp3' },
								{ texto: 'nueva' },
							],
						},
					],
				},
				{
					id: 'cuento-auto-ana',
					nivelId: 'nivel-b',
					titulo: 'El Auto de Ana',
					descripcion: 'Cuento corto para la práctica de vocales',
					portadaUrl: '/pictogramas/arasaac/auto.png',
					estado: 'publicado',
					fechaCreacion: new Date().toISOString(),
					paginas: [
						{
							numeroPagina: 1,
							textoCompleto: 'Ana ve un auto azul',
							audioPaginaUrl: '/audio/cuentos/cuento-auto-ana-p1.mp3',
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
					descripcion: 'Lectura asistida con enfoque en la consonante M',
					portadaUrl: '/pictogramas/arasaac/mama.png',
					estado: 'publicado',
					fechaCreacion: new Date().toISOString(),
					paginas: [
						{
							numeroPagina: 1,
							textoCompleto: 'Mi mamá me ama',
							audioPaginaUrl: '/audio/cuentos/cuento-mi-mama-p1.mp3',
							palabras: [
								{ texto: 'Mi', audioUrl: '/audio/fonemas/mi.mp3' },
								{ texto: 'mamá', pictogramaUrl: '/pictogramas/arasaac/mama.png', audioUrl: '/audio/pictogramas/mama.mp3' },
								{ texto: 'me', audioUrl: '/audio/fonemas/me.mp3' },
								{ texto: 'ama', pictogramaUrl: '/pictogramas/arasaac/ama.png', audioUrl: '/audio/pictogramas/ama.mp3' },
							],
						},
					],
				},
				{
					id: 'cuento-escuela',
					nivelId: 'nivel-b',
					titulo: 'Mi Liceo Piedra Azul',
					descripcion: 'Asociación de palabras del entorno escolar',
					portadaUrl: '/pictogramas/arasaac/colegio.png',
					estado: 'publicado',
					fechaCreacion: new Date().toISOString(),
					paginas: [
						{
							numeroPagina: 1,
							textoCompleto: 'Yo voy a mi escuela feliz',
							audioPaginaUrl: '/audio/cuentos/cuento-escuela-p1.mp3',
							palabras: [
								{ texto: 'Yo', pictogramaUrl: '/pictogramas/arasaac/yo.png', audioUrl: '/audio/pictogramas/yo.mp3' },
								{ texto: 'voy', pictogramaUrl: '/pictogramas/arasaac/ir.png', audioUrl: '/audio/pictogramas/ir.mp3' },
								{ texto: 'a', audioUrl: '/audio/fonemas/a.mp3' },
								{ texto: 'mi', audioUrl: '/audio/fonemas/mi.mp3' },
								{ texto: 'escuela', pictogramaUrl: '/pictogramas/arasaac/colegio.png', audioUrl: '/audio/pictogramas/colegio.mp3' },
								{ texto: 'feliz', pictogramaUrl: '/pictogramas/arasaac/feliz.png', audioUrl: '/audio/pictogramas/feliz.mp3' },
							],
						},
					],
				},
			];

			await db.cuentos.bulkPut([
				...actividadesIndividualesNivelA,
				actividadGrupalNivelA,
				...cuentosNivelB,
			]);
		}

		// 5. Cargar datos simulados para el panel docente
		await seedDemoDocente();

		// 6. Cuentos de Kinder (nivel D): se agregan también en navegadores que ya tenían datos
		await sembrarCuentosKinder();
		await sembrarCuentosPalabras();

		console.log('✅ Base de datos inicializada correctamente.');
	} catch (error) {
		console.error('❌ Error al inicializar la base de datos:', error);
	}
}