import { useAjustesStore } from '@/shared/store/useAjustesStore';

let contexto: AudioContext | null = null;

const obtenerContexto = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!contexto) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    contexto = new AC();
  }
  if (contexto.state === 'suspended') void contexto.resume();
  return contexto;
};

const tono = (ctx: AudioContext, frecuencia: number, inicio: number, duracion: number, volumen: number) => {
  const osc = ctx.createOscillator();
  const ganancia = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frecuencia;
  ganancia.gain.setValueAtTime(0.0001, ctx.currentTime + inicio);
  ganancia.gain.exponentialRampToValueAtTime(volumen, ctx.currentTime + inicio + 0.02);
  ganancia.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + inicio + duracion);
  osc.connect(ganancia).connect(ctx.destination);
  osc.start(ctx.currentTime + inicio);
  osc.stop(ctx.currentTime + inicio + duracion + 0.05);
};

/** Sonidos generados en el momento (sin archivos, sin derechos de terceros). Respetan el ajuste de sonido. */
export const sonarToque = () => {
  if (!useAjustesStore.getState().sonido) return;
  const ctx = obtenerContexto();
  if (ctx) tono(ctx, 520, 0, 0.09, 0.07);
};

export const sonarAcierto = () => {
  if (!useAjustesStore.getState().sonido) return;
  const ctx = obtenerContexto();
  if (!ctx) return;
  [523, 659, 784].forEach((f, i) => tono(ctx, f, i * 0.11, 0.22, 0.08));
};

/** Burbuja que se revienta: un tono suave y corto, sin sobresaltos. */
export const sonarBurbuja = () => {
  if (!useAjustesStore.getState().sonido) return;
  const ctx = obtenerContexto();
  if (ctx) tono(ctx, 700 + Math.random() * 180, 0, 0.18, 0.035);
};

/** Campanita muy baja que marca el cambio entre inhalar y exhalar (más grave al exhalar). */
export const sonarRespiro = (inhala: boolean) => {
  if (!useAjustesStore.getState().sonido) return;
  const ctx = obtenerContexto();
  if (ctx) tono(ctx, inhala ? 392 : 294, 0, 1.4, 0.03);
};
