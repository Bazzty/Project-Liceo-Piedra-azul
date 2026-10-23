/**
 * Criterios con los que el panel avisa que un niño necesita apoyo.
 * SON PROVISIONALES: hay que validarlos con las docentes antes de usarlos de verdad.
 */
export const UMBRALES = {
  /** Días sin entrar para considerar que dejó de usar la aplicación. */
  diasSinEntrar: 5,
  /** Con este número de días con actividad (o menos) en la semana se pide atención. */
  diasActivosMinimos: 1,
  /** Por debajo de este % de juegos hechos sin ayuda, se considera que le cuesta. */
  porcentajeSinAyudaBajo: 50,
  /** Cuántas de sus últimas sesiones de juegos se promedian. */
  sesionesAPromediar: 3,
  /** Con tantos momentos de calma en la semana se avisa para conversar con el niño. */
  calmaVecesAviso: 3,
} as const;
