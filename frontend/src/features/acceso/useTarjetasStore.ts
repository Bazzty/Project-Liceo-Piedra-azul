import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LARGO_CODIGO, TARJETAS_DEMO, type TarjetaDemo } from '@/mocks/tarjetas';

const nuevoCodigo = (usados: Set<string>) => {
  let codigo: string;
  do {
    codigo = String(Math.floor(10 ** (LARGO_CODIGO - 1) + Math.random() * 9 * 10 ** (LARGO_CODIGO - 1)));
  } while (usados.has(codigo));
  return codigo;
};

interface TarjetasState {
  tarjetas: TarjetaDemo[];
  /** Entrega una tarjeta a cada alumno que todavía no tiene. */
  asegurar: (alumnoIds: string[]) => void;
  /** Cambia el código de un alumno: el anterior deja de funcionar. */
  regenerar: (alumnoId: string) => void;
  buscar: (codigo: string) => TarjetaDemo | undefined;
}

/**
 * Tarjetas de acceso de los niños (código corto impreso). En el prototipo viven en el navegador;
 * con backend serán un recurso de la API y el código nunca saldrá de ahí en texto plano.
 */
export const useTarjetasStore = create<TarjetasState>()(
  persist(
    (set, get) => ({
      tarjetas: TARJETAS_DEMO,
      asegurar: (alumnoIds) => {
        const { tarjetas } = get();
        const faltan = alumnoIds.filter((id) => !tarjetas.some((t) => t.alumnoId === id));
        if (faltan.length === 0) return;
        const usados = new Set(tarjetas.map((t) => t.codigo));
        const nuevas = faltan.map((alumnoId) => {
          const codigo = nuevoCodigo(usados);
          usados.add(codigo);
          return { alumnoId, codigo };
        });
        set({ tarjetas: [...tarjetas, ...nuevas] });
      },
      regenerar: (alumnoId) => {
        const { tarjetas } = get();
        const usados = new Set(tarjetas.map((t) => t.codigo));
        const codigo = nuevoCodigo(usados);
        set({
          tarjetas: tarjetas.some((t) => t.alumnoId === alumnoId)
            ? tarjetas.map((t) => (t.alumnoId === alumnoId ? { ...t, codigo } : t))
            : [...tarjetas, { alumnoId, codigo }],
        });
      },
      buscar: (codigo) => get().tarjetas.find((t) => t.codigo === codigo),
    }),
    { name: 'tarjetas-acceso', version: 1 },
  ),
);
