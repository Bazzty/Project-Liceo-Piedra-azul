export type EventoPersonaje = 'bienvenida' | 'espera' | 'despedida' | 'felicitaciones';

export interface VozPersonaje {
	id: string;
	nombre: string;
	audios: Record<EventoPersonaje, string[]>;
}

export const CATALOGO_AUDIOS_PERSONAJE: Record<string, VozPersonaje> = {
	'voz-default': {
		id: 'voz-default',
		nombre: 'Voz Principal (Oso)',
		audios: {
			bienvenida: ['/audio/personaje/bienvenida.mp3'],
			espera: ['/audio/personaje/esperando_profesora.mp3'],
			despedida: ['/audio/personaje/despedida.mp3'],
			felicitaciones: ['/audio/personaje/felicitaciones.mp3'],
		},
	},
};

export const getPersonajeAudio = (
	evento: EventoPersonaje,
	vozId: string = 'voz-default'
): string => {
	const voz = CATALOGO_AUDIOS_PERSONAJE[vozId] || CATALOGO_AUDIOS_PERSONAJE['voz-default'];
	const listaAudios = voz.audios[evento];
	if (!listaAudios || listaAudios.length === 0) {
		return `/audio/personaje/${evento}.mp3`;
	}
	// Selección aleatoria si existen múltiples opciones configuradas
	const index = Math.floor(Math.random() * listaAudios.length);
	return listaAudios[index];
};