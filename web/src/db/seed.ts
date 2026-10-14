import { db, type Cuento } from './db';

export async function seedDatabase() {
	try {
		// 1. Niveles Pedagógicos
		await db.niveles.bulkPut([
			{ id: 'nivel-a', codigo: 'A', nombre: 'Palabras Simples', descripcion: 'Práctica de palabras individuales y sus sílabas', orden: 1 },
			{ id: 'nivel-b', codigo: 'B', nombre: 'Consonantes M, L, S', descripcion: 'Construcción de sílabas y frases iniciales', orden: 2 },
			{ id: 'nivel-c', codigo: 'C', nombre: 'Palabras Funcionales', descripcion: 'Asociación de pictogramas del entorno cotidiano', orden: 3 },
			{ id: 'nivel-d', codigo: 'D', nombre: 'Frases y Cuentos Cortos', descripcion: 'Estructuras Sujeto + Acción + Objeto', orden: 4 },
		]);

		// 2. Pictogramas del Tablero SAAC (Módulo "Hablar")
		await db.pictogramas.bulkPut([
			{ id: 'pic-agua', palabra: 'agua', categoria: 'necesidades', imagenUrl: '/pictogramas/arasaac/agua.png', audioUrl: '/audio/pictogramas/agua.mp3', esFotoReal: false },
			{ id: 'pic-bano', palabra: 'baño', categoria: 'necesidades', imagenUrl: '/pictogramas/arasaac/bano.png', audioUrl: '/audio/pictogramas/baño.mp3', esFotoReal: false },
			{ id: 'pic-comer', palabra: 'comer', categoria: 'necesidades', imagenUrl: '/pictogramas/arasaac/comer.png', audioUrl: '/audio/pictogramas/comer.mp3', esFotoReal: false },
			{ id: 'pic-dormir', palabra: 'dormir', categoria: 'necesidades', imagenUrl: '/pictogramas/arasaac/dormir.png', audioUrl: '/audio/pictogramas/dormir.mp3', esFotoReal: false },
			{ id: 'pic-feliz', palabra: 'feliz', categoria: 'emociones', imagenUrl: '/pictogramas/arasaac/feliz.png', audioUrl: '/audio/pictogramas/feliz.mp3', esFotoReal: false },
			{ id: 'pic-triste', palabra: 'triste', categoria: 'emociones', imagenUrl: '/pictogramas/arasaac/triste.png', audioUrl: '/audio/pictogramas/triste.mp3', esFotoReal: false },
			{ id: 'pic-mama', palabra: 'mamá', categoria: 'personas', imagenUrl: '/pictogramas/arasaac/mama.png', audioUrl: '/audio/pictogramas/mama.mp3', esFotoReal: false },
			{ id: 'pic-papa', palabra: 'papá', categoria: 'personas', imagenUrl: '/pictogramas/arasaac/papa.png', audioUrl: '/audio/pictogramas/papa.mp3', esFotoReal: false },
			{ id: 'pic-quiero', palabra: 'quiero', categoria: 'acciones', imagenUrl: '/pictogramas/arasaac/quiero.png', audioUrl: '/audio/pictogramas/quiero.mp3', esFotoReal: false },
			{ id: 'pic-jugar', palabra: 'jugar', categoria: 'acciones', imagenUrl: '/pictogramas/arasaac/jugar.png', audioUrl: '/audio/pictogramas/jugar.mp3', esFotoReal: false },
			{ id: 'pic-mesa', palabra: 'mesa', categoria: 'objetos', imagenUrl: '/pictogramas/arasaac/mesa.png', audioUrl: '/audio/pictogramas/mesa.mp3', esFotoReal: false },
			{ id: 'pic-auto', palabra: 'auto', categoria: 'objetos', imagenUrl: '/pictogramas/arasaac/auto.png', audioUrl: '/audio/pictogramas/auto.mp3', esFotoReal: false },
		]);

		// 3. Alumnos Demo
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

		// 4. Mapeo de Palabras Simples para el Nivel A
		const palabrasNivelA = [
			{ id: 'act-mesa', palabra: 'Mesa', audio: 'me_mesa.mp3', img: 'mesa.png', s1: 'ME', a1: 'me.mp3', s2: 'SA', a2: 'sa.mp3' },
			{ id: 'act-dado', palabra: 'Dado', audio: 'da_dado.mp3', img: 'dado.png', s1: 'DA', a1: 'da.mp3', s2: 'DO', a2: 'do.mp3' },
			{ id: 'act-dama', palabra: 'Dama', audio: 'da_dama.mp3', img: 'dama.png', s1: 'DA', a1: 'da.mp3', s2: 'MA', a2: 'ma.mp3' },
			{ id: 'act-dedo', palabra: 'Dedo', audio: 'de_dedo.mp3', img: 'dedo.png', s1: 'DE', a1: 'de.mp3', s2: 'DO', a2: 'do.mp3' },
			{ id: 'act-lana', palabra: 'Lana', audio: 'la_lana.mp3', img: 'lana.png', s1: 'LA', a1: 'la.mp3', s2: 'NA', a2: 'a.mp3' },
			{ id: 'act-lila', palabra: 'Lila', audio: 'li_lila.mp3', img: 'lila.png', s1: 'LI', a1: 'li.mp3', s2: 'LA', a2: 'la.mp3' },
			{ id: 'act-lima', palabra: 'Lima', audio: 'li_lima.mp3', img: 'lima.png', s1: 'LI', a1: 'li.mp3', s2: 'MA', a2: 'ma.mp3' },
			{ id: 'act-lupa', palabra: 'Lupa', audio: 'lu_lupa.mp3', img: 'lupa.png', s1: 'LU', a1: 'lu.mp3', s2: 'PA', a2: 'a.mp3' },
			{ id: 'act-masa', palabra: 'Masa', audio: 'ma_masa.mp3', img: 'masa.png', s1: 'MA', a1: 'ma.mp3', s2: 'SA', a2: 'sa.mp3' },
			{ id: 'act-mula', palabra: 'Mula', audio: 'mu_mula.mp3', img: 'mula.png', s1: 'MU', a1: 'mu.mp3', s2: 'LA', a2: 'la.mp3' },
			{ id: 'act-pala', palabra: 'Pala', audio: 'pa_pala.mp3', img: 'pala.png', s1: 'PA', a1: 'a.mp3', s2: 'LA', a2: 'la.mp3' },
			{ id: 'act-pelo', palabra: 'Pelo', audio: 'pe_pelo.mp3', img: 'pelo.png', s1: 'PE', a1: 'e.mp3', s2: 'LO', a2: 'lo.mp3' },
			{ id: 'act-piso', palabra: 'Piso', audio: 'pi_piso.mp3', img: 'piso.png', s1: 'PI', a1: 'i.mp3', s2: 'SO', a2: 'so.mp3' },
			{ id: 'act-puma', palabra: 'Puma', audio: 'pu_puma.mp3', img: 'puma.png', s1: 'PU', a1: 'u.mp3', s2: 'MA', a2: 'ma.mp3' },
			{ id: 'act-sala', palabra: 'Sala', audio: 'sa_sala.mp3', img: 'sala.png', s1: 'SA', a1: 'sa.mp3', s2: 'LA', a2: 'la.mp3' },
			{ id: 'act-sapo', palabra: 'Sapo', audio: 'sa_sapo.mp3', img: 'sapo.png', s1: 'SA', a1: 'sa.mp3', s2: 'PO', a2: 'o.mp3' },
			{ id: 'act-sopa', palabra: 'Sopa', audio: 'so_sopa.mp3', img: 'sopa.png', s1: 'SO', a1: 'so.mp3', s2: 'PA', a2: 'a.mp3' },
		];

		const actividadesNivelA: Cuento[] = palabrasNivelA.map((item) => ({
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

		// 5. Cuentos del Nivel D
		const cuentosNivelD: Cuento[] = [
			{
				id: 'cuento-vocales',
				nivelId: 'nivel-d',
				titulo: 'El Auto de Ana',
				descripcion: 'Cuento para práctica de lecturas con vocales',
				portadaUrl: '/pictogramas/arasaac/auto.png',
				estado: 'publicado',
				fechaCreacion: new Date().toISOString(),
				paginas: [
					{
						numeroPagina: 1,
						textoCompleto: 'Ana ve un auto azul',
						audioPaginaUrl: '/audio/cuentos/cuento-auto-ana-p1.mp3',
						palabras: [
							{ texto: 'Ana', pictogramaUrl: '/pictogramas/arasaac/nina.png' },
							{ texto: 've', pictogramaUrl: '/pictogramas/arasaac/ver.png' },
							{ texto: 'un' },
							{ texto: 'auto', pictogramaUrl: '/pictogramas/arasaac/auto.png' },
							{ texto: 'azul', pictogramaUrl: '/pictogramas/arasaac/azul.png' },
						],
					},
				],
			},
			{
				id: 'cuento-mi-mama',
				nivelId: 'nivel-d',
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
							{ texto: 'Mi' },
							{ texto: 'mamá', pictogramaUrl: '/pictogramas/arasaac/mama.png' },
							{ texto: 'me' },
							{ texto: 'ama', pictogramaUrl: '/pictogramas/arasaac/ama.png' },
						],
					},
				],
			},
			{
				id: 'cuento-escuela',
				nivelId: 'nivel-d',
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
							{ texto: 'Yo', pictogramaUrl: '/pictogramas/arasaac/yo.png' },
							{ texto: 'voy', pictogramaUrl: '/pictogramas/arasaac/ir.png' },
							{ texto: 'a' },
							{ texto: 'mi' },
							{ texto: 'escuela', pictogramaUrl: '/pictogramas/arasaac/colegio.png' },
							{ texto: 'feliz', pictogramaUrl: '/pictogramas/arasaac/feliz.png' },
						],
					},
				],
			},
		];

		await db.cuentos.bulkPut([...actividadesNivelA, ...cuentosNivelD]);
		console.log('✅ Base de datos local inicializada con actividades Nivel A y Nivel D.');
	} catch (error) {
		console.error('❌ Error al inicializar datos:', error);
	}
}