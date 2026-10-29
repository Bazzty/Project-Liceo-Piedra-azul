/**
 * Tarjetas de acceso ficticias: cada niño tiene un código corto impreso en su tarjeta.
 * SOLO DEMO: estos códigos en texto plano no pueden pasar al backend; allí se guardan como hash (ver CLAUDE.md).
 */
export interface TarjetaDemo {
  codigo: string;
  alumnoId: string;
}

export const LARGO_CODIGO = 5;

export const TARJETAS_DEMO: TarjetaDemo[] = [
  { codigo: '24681', alumnoId: 'estudiante-mateo' },
  { codigo: '13579', alumnoId: 'estudiante-sofia' },
  { codigo: '48210', alumnoId: 'estudiante-benjamin' },
  { codigo: '90357', alumnoId: 'estudiante-valentina' },
  { codigo: '62814', alumnoId: 'estudiante-joaquin' },
  { codigo: '75193', alumnoId: 'estudiante-emilia' },
];

export const buscarTarjeta = (codigo: string) => TARJETAS_DEMO.find((t) => t.codigo === codigo);
