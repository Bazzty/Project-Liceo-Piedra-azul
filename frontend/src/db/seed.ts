import { db } from './db';

export async function seedDatabase() {
  try {
    // 1. Niveles Pedagógicos
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

    // 2. Tabla de Comunicación SAAC con rutas estáticas locales y 'esFotoReal: false'
    await db.pictogramas.bulkPut([
      // --- NECESIDADES ---
      { id: 'pic-agua', palabra: 'agua', categoria: 'necesidades', imagenUrl: '/pictogramas/arasaac/agua.png', esFotoReal: false },
      { id: 'pic-bano', palabra: 'baño', categoria: 'necesidades', imagenUrl: '/pictogramas/arasaac/bano.png', esFotoReal: false },
      { id: 'pic-comer', palabra: 'comer', categoria: 'necesidades', imagenUrl: '/pictogramas/arasaac/comer.png', esFotoReal: false },
      { id: 'pic-dormir', palabra: 'dormir', categoria: 'necesidades', imagenUrl: '/pictogramas/arasaac/dormir.png', esFotoReal: false },
      { id: 'pic-ayuda', palabra: 'ayuda', categoria: 'necesidades', imagenUrl: '/pictogramas/arasaac/ayuda.png', esFotoReal: false },
      { id: 'pic-dolor', palabra: 'dolor', categoria: 'necesidades', imagenUrl: '/pictogramas/arasaac/dolor.png', esFotoReal: false },
      { id: 'pic-frio', palabra: 'frío', categoria: 'necesidades', imagenUrl: '/pictogramas/arasaac/frio.png', esFotoReal: false },
      { id: 'pic-calor', palabra: 'calor', categoria: 'necesidades', imagenUrl: '/pictogramas/arasaac/calor.png', esFotoReal: false },

      // --- EMOCIONES ---
      { id: 'pic-feliz', palabra: 'feliz', categoria: 'emociones', imagenUrl: '/pictogramas/arasaac/feliz.png', esFotoReal: false },
      { id: 'pic-triste', palabra: 'triste', categoria: 'emociones', imagenUrl: '/pictogramas/arasaac/triste.png', esFotoReal: false },
      { id: 'pic-enojado', palabra: 'enojado', categoria: 'emociones', imagenUrl: '/pictogramas/arasaac/enojado.png', esFotoReal: false },
      { id: 'pic-asustado', palabra: 'asustado', categoria: 'emociones', imagenUrl: '/pictogramas/arasaac/asustado.png', esFotoReal: false },
      { id: 'pic-cansado', palabra: 'cansado', categoria: 'emociones', imagenUrl: '/pictogramas/arasaac/cansado.png', esFotoReal: false },
      { id: 'pic-bien', palabra: 'bien', categoria: 'emociones', imagenUrl: '/pictogramas/arasaac/bien.png', esFotoReal: false },

      // --- PERSONAS ---
      { id: 'pic-mama', palabra: 'mamá', categoria: 'personas', imagenUrl: '/pictogramas/arasaac/mama.png', esFotoReal: false },
      { id: 'pic-papa', palabra: 'papá', categoria: 'personas', imagenUrl: '/pictogramas/arasaac/papa.png', esFotoReal: false },
      { id: 'pic-profesor', palabra: 'profesor', categoria: 'personas', imagenUrl: '/pictogramas/arasaac/profesor.png', esFotoReal: false },
      { id: 'pic-amigo', palabra: 'amigo', categoria: 'personas', imagenUrl: '/pictogramas/arasaac/amigo.png', esFotoReal: false },
      { id: 'pic-nino', palabra: 'niño', categoria: 'personas', imagenUrl: '/pictogramas/arasaac/nino.png', esFotoReal: false },
      { id: 'pic-nina', palabra: 'niña', categoria: 'personas', imagenUrl: '/pictogramas/arasaac/nina.png', esFotoReal: false },

      // --- ACCIONES ---
      { id: 'pic-quiero', palabra: 'quiero', categoria: 'acciones', imagenUrl: '/pictogramas/arasaac/quiero.png', esFotoReal: false },
      { id: 'pic-ir', palabra: 'ir', categoria: 'acciones', imagenUrl: '/pictogramas/arasaac/ir.png', esFotoReal: false },
      { id: 'pic-jugar', palabra: 'jugar', categoria: 'acciones', imagenUrl: '/pictogramas/arasaac/jugar.png', esFotoReal: false },
      { id: 'pic-ver', palabra: 'ver', categoria: 'acciones', imagenUrl: '/pictogramas/arasaac/ver.png', esFotoReal: false },
      { id: 'pic-escuchar', palabra: 'escuchar', categoria: 'acciones', imagenUrl: '/pictogramas/arasaac/escuchar.png', esFotoReal: false },
      { id: 'pic-parar', palabra: 'parar', categoria: 'acciones', imagenUrl: '/pictogramas/arasaac/parar.png', esFotoReal: false },
      { id: 'pic-ama', palabra: 'ama', categoria: 'acciones', imagenUrl: '/pictogramas/arasaac/ama.png', esFotoReal: false },

      // --- OBJETOS ---
      { id: 'pic-colegio', palabra: 'colegio', categoria: 'objetos', imagenUrl: '/pictogramas/arasaac/colegio.png', esFotoReal: false },
      { id: 'pic-lapiz', palabra: 'lápiz', categoria: 'objetos', imagenUrl: '/pictogramas/arasaac/lapiz.png', esFotoReal: false },
      { id: 'pic-libro', palabra: 'libro', categoria: 'objetos', imagenUrl: '/pictogramas/arasaac/libro.png', esFotoReal: false },
      { id: 'pic-mesa', palabra: 'mesa', categoria: 'objetos', imagenUrl: '/pictogramas/arasaac/mesa.png', esFotoReal: false },
      { id: 'pic-silla', palabra: 'silla', categoria: 'objetos', imagenUrl: '/pictogramas/arasaac/silla.png', esFotoReal: false },
      { id: 'pic-mochila', palabra: 'mochila', categoria: 'objetos', imagenUrl: '/pictogramas/arasaac/mochila.png', esFotoReal: false },
      { id: 'pic-auto', palabra: 'auto', categoria: 'objetos', imagenUrl: '/pictogramas/arasaac/auto.png', esFotoReal: false },
      { id: 'pic-azul', palabra: 'azul', categoria: 'objetos', imagenUrl: '/pictogramas/arasaac/azul.png', esFotoReal: false },
      { id: 'pic-yo', palabra: 'yo', categoria: 'personas', imagenUrl: '/pictogramas/arasaac/yo.png', esFotoReal: false },
    ]);

    // 3. Alumnos Demo
    await db.alumnos.bulkPut([
      {
        id: 'estudiante-mateo',
        nombre: 'Mateo',
        apellido: "Perez",
        avatarUrl: '/assets/avatars/estudiante_demo.jpg',
        temaId: 'calma-azul',
        personajeId: 'dinosaurio',
        fechaCreacion: new Date().toISOString(),
      },
      {
        id: 'estudiante-sofia',
        nombre: 'Sofía',
        apellido: "Perez",
        avatarUrl: '/assets/avatars/estudiante_demo.jpg',
        temaId: 'calma-azul',
        personajeId: 'estrella',
        fechaCreacion: new Date().toISOString(),
      },
    ]);

    // 4. Cuentos con Pictogramas Asignados
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
    ]);

    console.log('✅ Base de datos local inicializada con rutas locales de pictogramas.');
  } catch (error) {
    console.error('❌ Error al inicializar datos:', error);
  }
}