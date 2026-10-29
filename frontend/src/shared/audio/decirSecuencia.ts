import { useAjustesStore } from '@/shared/store/useAjustesStore';
import { usePlayerStore } from '@/shared/store/usePlayerStore';

export interface ElementoDeVoz {
  texto: string;
  /** Grabación de ese elemento; si no existe o falla, se lee con la voz del navegador. */
  audioUrl?: string;
}

const ESPERA_MAXIMA_MS = 5000;

/** Reproduce por el store del reproductor (una sola voz a la vez, misma velocidad). `false` si hay que usar el respaldo. */
const reproducirArchivo = (url: string, cancelada?: () => boolean) =>
  new Promise<boolean>((resolve) => {
    const store = usePlayerStore.getState();
    store.playAudio(url, { alFallar: () => terminar(false) });
    const audio = usePlayerStore.getState().activeAudioInstance;
    const vigilante = setInterval(() => {
      if (cancelada?.()) {
        usePlayerStore.getState().stopAudio();
        terminar(true);
      }
    }, 100);
    function terminar(sono: boolean) {
      clearInterval(vigilante);
      resolve(sono);
    }
    if (!audio) return terminar(false);
    // `pause` cubre que otro audio o stopAudio lo corten: no se vuelve a leer encima
    audio.addEventListener('ended', () => terminar(true), { once: true });
    audio.addEventListener('pause', () => terminar(true), { once: true });
  });

const leerEnVoz = (texto: string, lenta: boolean) =>
  new Promise<void>((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return resolve();
    const voz = new SpeechSynthesisUtterance(texto);
    voz.lang = 'es-CL';
    voz.rate = lenta ? 0.65 : 0.85;
    voz.pitch = 1.1;
    const fin = setTimeout(resolve, ESPERA_MAXIMA_MS);
    voz.onend = voz.onerror = () => {
      clearTimeout(fin);
      resolve();
    };
    window.speechSynthesis.speak(voz);
  });

/**
 * Dice varios elementos uno tras otro, esperando a que termine cada uno (no a un tiempo fijo).
 * `alDecir` avisa cuál está sonando, para marcarlo en pantalla. `cancelada()` permite cortar a la mitad.
 */
export async function decirSecuencia(
  elementos: ElementoDeVoz[],
  opciones: { alDecir?: (indice: number | null) => void; cancelada?: () => boolean } = {},
) {
  const { sonido, vozLenta } = useAjustesStore.getState();
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  for (let i = 0; i < elementos.length; i += 1) {
    if (opciones.cancelada?.()) break;
    opciones.alDecir?.(i);
    if (sonido) {
      const { texto, audioUrl } = elementos[i];
      const sono = audioUrl ? await reproducirArchivo(audioUrl, opciones.cancelada) : false;
      if (!sono && !opciones.cancelada?.()) await leerEnVoz(texto, vozLenta);
    } else {
      await new Promise((r) => setTimeout(r, 700));
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  opciones.alDecir?.(null);
}
