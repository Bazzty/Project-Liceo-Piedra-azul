// Revisión rápida antes de cada commit, solo sobre los archivos en stage.
// Lo más lento (tipos, suite completa, build) queda para el CI de cada PR.
export default {
  'frontend/**/*.{ts,tsx,js}': (archivos) => {
    const lista = archivos.join(' ');
    return [
      `npm --prefix frontend run lint -- --max-warnings 0 ${lista}`,
      // Solo los tests que dependen de lo que cambió.
      `npm --prefix frontend run test:related -- ${lista}`,
    ];
  },
  'backend/**/*.php': (archivos) => `sh scripts/hooks/pint-staged.sh ${archivos.join(' ')}`,
};
