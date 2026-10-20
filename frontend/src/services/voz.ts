import { usePlayerStore } from '../store/usePlayerStore';

/**
 * Respaldo temporal: lee una palabra con la voz del dispositivo (Web Speech API)
 * cuando todavía no existe un MP3 para ella. Cuando el audio generado con IA esté
 * listo, basta con poner su `audioUrl` en la palabra y esto deja de usarse.
 */
export const hablarTexto = (texto: string): void => {
	if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
	const sintetizador = window.speechSynthesis;
	usePlayerStore.getState().stopAudio();
	sintetizador.cancel();

	const voces = sintetizador.getVoices();
	const prioridad = ['es-CL', 'es-MX', 'es-US', 'es-419', 'es-ES'];
	const voz =
		prioridad.map((l) => voces.find((v) => v.lang.replace('_', '-') === l)).find(Boolean) ??
		voces.find((v) => v.lang.toLowerCase().startsWith('es'));

	const frase = new SpeechSynthesisUtterance(texto);
	frase.lang = voz?.lang ?? 'es-CL';
	if (voz) frase.voice = voz;
	frase.rate = 0.8 * usePlayerStore.getState().playbackRate; // más lento, para niños
	frase.pitch = 1.1;
	sintetizador.speak(frase);
};

export const detenerVoz = (): void => {
	if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
};
