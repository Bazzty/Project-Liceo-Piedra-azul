/** Rutas de la aplicación. Única fuente de verdad: no escribir paths a mano en los componentes. */
export const ROUTES = {
  inicio: '/',
  muestra: '/muestra',

  profesorLogin: '/profesor/login',
  profesorPanel: '/profesor/panel',
  profesorEstudiantes: '/profesor/estudiantes',
  profesorCuentos: '/profesor/cuentos',
  profesorTarjetas: '/profesor/tarjetas',
  profesorAula: '/profesor/aula',

  aulaEspera: '/aula/espera',
  aulaAlumnos: '/aula/alumnos',

  menu: '/menu',
  aprender: '/aprender',
  catalogo: (nivelId: string) => `/aprender/${nivelId}`,
  lectura: (nivelId: string, cuentoId: string) => `/aprender/${nivelId}/${cuentoId}`,
} as const;
