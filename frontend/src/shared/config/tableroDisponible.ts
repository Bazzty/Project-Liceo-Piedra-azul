import { ROUTES } from '@/app/routes';

const esRuta = (ruta: string, base: string) => ruta === base || ruta.startsWith(`${base}/`);

/**
 * El botón del tablero está en las vistas del niño (menú y lectura) y en el panel docente.
 * No aparece en el acceso (login, espera de aula, mosaico de alumnos) ni en la muestra de componentes.
 */
export const tableroDisponible = (ruta: string): boolean => {
  if (esRuta(ruta, ROUTES.profesorLogin)) return false;
  return esRuta(ruta, ROUTES.menu) || esRuta(ruta, ROUTES.aprender) || esRuta(ruta, '/profesor');
};
