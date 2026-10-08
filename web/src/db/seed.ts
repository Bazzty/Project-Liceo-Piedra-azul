import { db } from './db';

export async function seedDatabase() {
  try {
    // Si los niveles ya existen, no duplicamos datos
    const nivelesCount = await db.niveles.count();
    if (nivelesCount > 0) return;

    // 1. Insertar Niveles Pedagógicos Incrementales
    await db.niveles.bulkAdd([
      {
        id: 'nivel-a',
        codigo: 'A',
        nombre: 'Vocales',
        descripcion: 'Reconocimiento y sonido de A, E, I, O, U',
        orden: 1,
      },
      {
        id: 'nivel-b',
        codigo: 'B',
        nombre: 'Consonantes M, L, S',
        descripcion: 'Construcción de sílabas y frases iniciales',
        orden: 2,
      },
      {
        id: 'nivel-c',
        codigo: 'C',
        nombre: 'Palabras Funcionales',
        descripcion: 'Asociación de pictogramas del entorno cotidiano',
        orden: 3,
      },
      {
        id: 'nivel-d',
        codigo: 'D',
        nombre: 'Frases y Cuentos Cortos',
        descripcion: 'Estructuras Sujeto + Acción + Objeto',
        orden: 4,
      },
    ]);

    // 2. Insertar Diccionario Inicial de Pictogramas Base
    await db.pictogramas.bulkAdd([
      {
        id: 'pic-mama',
        palabra: 'mamá',
        categoria: 'personas',
        imagenUrl: '/pictogramas/arasaac/mama.png',
        audioUrl: '/audio/palabras/mama.mp3',
        esFotoReal: false,
      },
      {
        id: 'pic-papa',
        palabra: 'papá',
        categoria: 'personas',
        imagenUrl: '/pictogramas/arasaac/papa.png',
        audioUrl: '/audio/palabras/papa.mp3',
        esFotoReal: false,
      },
      {
        id: 'pic-agua',
        palabra: 'agua',
        categoria: 'necesidades',
        imagenUrl: '/pictogramas/arasaac/agua.png',
        audioUrl: '/audio/palabras/agua.mp3',
        esFotoReal: false,
      },
      {
        id: 'pic-colegio',
        palabra: 'colegio',
        categoria: 'objetos',
        imagenUrl: '/pictogramas/arasaac/colegio.png',
        audioUrl: '/audio/palabras/colegio.mp3',
        esFotoReal: false,
      },
    ]);

    // 3. Insertar Alumno Demo Inicial
    await db.alumnos.add({
      id: 'estudiante-mateo',
      nombre: 'Mateo',
      avatarUrl: '/assets/avatars/estudiante_demo.png',
      temaId: 'calma-azul',
      personajeId: 'dinosaurio',
      fechaCreacion: new Date().toISOString(),
    });

    // 4. Insertar Cuento Demo Inicial
    await db.cuentos.add({
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
          palabras: [
            { texto: 'Mi', audioUrl: '/audio/palabras/mi.mp3' },
            {
              texto: 'mamá',
              pictogramaUrl: '/pictogramas/arasaac/mama.png',
              audioUrl: '/audio/palabras/mama.mp3',
            },
            { texto: 'me', audioUrl: '/audio/palabras/me.mp3' },
            { texto: 'ama', audioUrl: '/audio/palabras/ama.mp3' },
          ],
          audioPaginaUrl: '/audio/cuentos/mi_mama_me_ama.mp3',
        },
      ],
    });

    console.log('✅ Dexie.js: Base de datos local inicializada con datos de prueba.');
  } catch (error) {
    console.error('❌ Error al inicializar datos en Dexie.js:', error);
  }
}