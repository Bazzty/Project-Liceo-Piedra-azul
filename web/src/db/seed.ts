import { db } from './db';

export async function seedDatabase() {
  try {
    // 1. Insertar o actualizar Niveles Pedagógicos sin provocar BulkError
    await db.niveles.bulkPut([
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

    // 2. Insertar o actualizar Diccionario de Pictogramas
    await db.pictogramas.bulkPut([
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

    // 3. Insertar o actualizar Alumnos Demo
    await db.alumnos.bulkPut([
      {
        id: 'estudiante-mateo',
        nombre: 'Mateo',
        apellido: "Perez",
        avatarUrl: '/assets/avatars/estudiante_demo.png',
        temaId: 'calma-azul',
        personajeId: 'dinosaurio',
        fechaCreacion: new Date().toISOString(),
      },
      {
        id: 'estudiante-sofia',
        nombre: 'Sofía',
        apellido: "Perez",
        avatarUrl: '/assets/avatars/estudiante_demo.png',
        temaId: 'calma-azul',
        personajeId: 'estrella',
        fechaCreacion: new Date().toISOString(),
      },
    ]);

    // 4. Insertar o actualizar Cuentos
    await db.cuentos.bulkPut([
      {
        id: 'cuento-vocales',
        nivelId: 'nivel-a',
        titulo: 'El Auto de Ana',
        descripcion: 'Cuento para práctica de vocales A y E',
        portadaUrl: '/pictogramas/arasaac/auto.png',
        estado: 'publicado',
        fechaCreacion: new Date().toISOString(),
        paginas: [
          {
            numeroPagina: 1,
            textoCompleto: 'Ana ve un auto azul',
            palabras: [
              { texto: 'Ana', audioUrl: '/audio/palabras/ana.mp3' },
              { texto: 've', audioUrl: '/audio/palabras/ve.mp3' },
              { texto: 'un', audioUrl: '/audio/palabras/un.mp3' },
              { texto: 'auto', pictogramaUrl: '/pictogramas/arasaac/auto.png', audioUrl: '/audio/palabras/auto.mp3' },
              { texto: 'azul', audioUrl: '/audio/palabras/azul.mp3' },
            ],
            audioPaginaUrl: '/audio/cuentos/ana_auto.mp3',
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
      },
      {
        id: 'cuento-escuela',
        nivelId: 'nivel-c',
        titulo: 'Mi Liceo Piedra Azul',
        descripcion: 'Asociación de palabras del entorno escolar',
        portadaUrl: '/pictogramas/arasaac/colegio.png',
        estado: 'publicado',
        fechaCreacion: new Date().toISOString(),
        paginas: [
          {
            numeroPagina: 1,
            textoCompleto: 'Yo voy a mi escuela feliz',
            palabras: [
              { texto: 'Yo', audioUrl: '/audio/palabras/yo.mp3' },
              { texto: 'voy', audioUrl: '/audio/palabras/voy.mp3' },
              { texto: 'a', audioUrl: '/audio/palabras/a.mp3' },
              { texto: 'mi', audioUrl: '/audio/palabras/mi.mp3' },
              { texto: 'escuela', pictogramaUrl: '/pictogramas/arasaac/colegio.png', audioUrl: '/audio/palabras/colegio.mp3' },
              { texto: 'feliz', audioUrl: '/audio/palabras/feliz.mp3' },
            ],
            audioPaginaUrl: '/audio/cuentos/escuela.mp3',
          },
        ],
      },
    ]);

    console.log('✅ Dexie.js: Base de datos local inicializada correctamente.');
  } catch (error) {
    console.error('❌ Error al inicializar datos en Dexie.js:', error);
  }
}