import { create } from 'zustand';

/**
 * Reacciones que puede hacer el osito guía.
 *  - saludo:   saltito y movimiento de bienvenida
 *  - feliz:    celebración (salto, ojitos felices, estrellitas)
 *  - animo:    "¡tú puedes!" (cabeceo suave y corazoncitos)
 *  - pensando: mira hacia arriba, inclina la cabeza
 *  - baile:    baila moviendo la cadera y los bracitos
 *  - salto:    un salto grande con los brazos arriba
 *  - asombro:  se estira, abre los brazos y dice «¡Guau!»
 *  - giro:     da una vuelta completa sobre sí mismo
 */
export type ReaccionGuia = 'saludo' | 'feliz' | 'animo' | 'pensando' | 'baile' | 'salto' | 'asombro' | 'giro';

interface GuideState {
	reaccion: ReaccionGuia | null;
	/** Se incrementa en cada disparo para que la misma reacción pueda repetirse. */
	disparo: number;
	reaccionar: (reaccion: ReaccionGuia) => void;
}

/**
 * Permite que cualquier pantalla haga reaccionar al osito sin pasarle props:
 *
 *   useGuideStore.getState().reaccionar('feliz');   // ¡acierto!
 *   useGuideStore.getState().reaccionar('animo');   // intenta otra vez
 */
export const useGuideStore = create<GuideState>()((set) => ({
	reaccion: null,
	disparo: 0,
	reaccionar: (reaccion) => set((s) => ({ reaccion, disparo: s.disparo + 1 })),
}));
