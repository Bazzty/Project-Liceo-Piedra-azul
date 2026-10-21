import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Home, Lightbulb, RotateCcw, Star, Volume2 } from 'lucide-react';
import { crearRegistro, useCuento, useCuentos } from '@/api';
import { ROUTES } from '@/app/routes';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { Sticker } from '@/features/estrellas/Sticker';
import { useColeccion } from '@/features/estrellas/useColeccion';
import { PictogramaCard } from '@/features/aprender/components/PictogramaCard';
import { sonarAcierto, sonarToque } from '@/shared/audio/sonidos';
import { LayoutEstudiante } from '@/shared/components/LayoutEstudiante';
import { LluviaEstrellas } from '@/shared/components/LluviaEstrellas';
import { OsoBurbuja } from '@/shared/components/OsoBurbuja';
import { getPersonajeAudio } from '@/shared/config/audioConfig';
import type { ClaveAudio } from '@/shared/config/audiosInterfaz';
import { useHablar } from '@/shared/hooks/useHablar';
import { usePlayerStore } from '@/shared/store/usePlayerStore';
import { useGuideStore } from '@/shared/store/useGuideStore';
import { Button } from '@/shared/ui';
import type { CuentoPalabra } from '@/types';
import { generarRondas, type CartaMemoria, type Ronda } from './generarRondas';

const FALLOS_PARA_AYUDA = 2;
const PAUSA_TRAS_ACIERTO = 1300;

/** Dice la palabra con su grabación; si no la tiene, con la voz del navegador. */
const useDecirPalabra = () => {
	const hablar = useHablar();
	return useCallback(
		(p: CuentoPalabra) => {
			if (p.audioUrl) usePlayerStore.getState().playAudio(p.audioUrl, { alFallar: () => hablar(p.texto) });
			else hablar(p.texto);
		},
		[hablar]
	);
};

/** Imagen de la palabra; las que no tienen pictograma (me, de, el…) se muestran escritas. */
const FichaPalabra: React.FC<{ p: CuentoPalabra; className?: string }> = ({ p, className = '' }) =>
	p.pictogramaUrl ? (
		<img src={p.pictogramaUrl} alt={p.texto} className={`w-full h-full object-contain ${className}`} />
	) : (
		<span className="text-2xl sm:text-4xl font-black text-primary">{p.texto}</span>
	);

/**
 * La pregunta del juego, dicha en voz alta (los niños todavía no leen): suena sola al empezar y el
 * parlante la repite cuando quieran. Sin texto en pantalla.
 */
const PreguntaVoz: React.FC<{ texto: string; clave?: ClaveAudio; retraso?: number }> = ({ texto, clave, retraso = 700 }) => {
	const hablar = useHablar();
	useEffect(() => {
		const id = setTimeout(() => hablar(texto, clave), retraso);
		return () => clearTimeout(id);
	}, [hablar, texto, clave, retraso]);
	return (
		<button
			type="button"
			onClick={() => hablar(texto, clave)}
			aria-label={`Escuchar la pregunta: ${texto}`}
			className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent text-onAccent border-4 border-borderStrong flex items-center justify-center cursor-pointer hover:bg-accent-hover active:scale-95 transition-all shadow-card"
		>
			<Volume2 className="w-8 h-8 sm:w-10 sm:h-10" aria-hidden />
		</button>
	);
};

interface RondaProps {
	ronda: Ronda;
	/** `conAyuda` es true si el niño necesitó que le mostráramos la respuesta; `tema` es la palabra o frase trabajada. */
	alTerminar: (conAyuda: boolean, tema?: string) => void;
}

/** Marco de una opción: se mueve si no era, se ilumina si es la ayuda y se pone verde si acertó. */
const claseOpcion = (estado: 'normal' | 'error' | 'ayuda' | 'acierto') =>
	`relative flex flex-col items-center justify-center gap-2 rounded-card border-4 bg-surface p-3 sm:p-4 shadow-card cursor-pointer transition-all active:scale-95 ${
		estado === 'acierto'
			? 'border-statusOk bg-statusOk/15 scale-105'
			: estado === 'ayuda'
				? 'border-brand ring-8 ring-accent/80 animate-pulso'
				: estado === 'error'
					? 'border-borderStrong opacity-60 animate-saltito'
					: 'border-borderStrong hover:border-brand'
	}`;

/** Una ronda de elegir entre tres: escuchar la palabra y tocar la imagen, o ver la imagen y tocar la palabra. */
const RondaElegir: React.FC<RondaProps & { ronda: Extract<Ronda, { tipo: 'escucha' | 'lee' }> }> = ({ ronda, alTerminar }) => {
	const decir = useDecirPalabra();
	const [fallos, setFallos] = useState<string[]>([]);
	const [acertada, setAcertada] = useState(false);
	const esEscucha = ronda.tipo === 'escucha';
	const ayuda = fallos.length >= FALLOS_PARA_AYUDA;

	// En los dos juegos se dice la palabra al empezar: quien no lee la escucha y la busca
	useEffect(() => {
		const id = setTimeout(() => decir(ronda.meta), 500);
		return () => clearTimeout(id);
	}, [decir, ronda.meta]);

	const elegir = (p: CuentoPalabra) => {
		if (acertada) return;
		// Al tocar una palabra escrita se oye, para que pueda comparar con lo que escuchó
		if (!esEscucha) decir(p);
		if (p.texto === ronda.meta.texto) {
			setAcertada(true);
			sonarAcierto();
			useGuideStore.getState().reaccionar('feliz');
			setTimeout(() => alTerminar(ayuda, ronda.meta.texto), PAUSA_TRAS_ACIERTO);
		} else {
			sonarToque();
			useGuideStore.getState().reaccionar('animo');
			setFallos((f) => [...f, p.texto]);
			if (esEscucha) decir(p);
		}
	};

	const estadoDe = (p: CuentoPalabra) =>
		acertada && p.texto === ronda.meta.texto
			? 'acierto'
			: ayuda && !acertada && p.texto === ronda.meta.texto
				? 'ayuda'
				: fallos.includes(p.texto)
					? 'error'
					: 'normal';

	return (
		<div className="flex-1 w-full flex flex-col items-center justify-center gap-6 sm:gap-8">
			{!esEscucha && <PreguntaVoz texto="¿Cuál es?" clave="cual_es" retraso={1800} />}
			{esEscucha ? (
				<button
					type="button"
					onClick={() => decir(ronda.meta)}
					aria-label="Escuchar otra vez"
					className="min-h-20 sm:min-h-24 px-8 sm:px-12 rounded-full bg-accent text-onAccent border-4 border-borderStrong flex items-center gap-4 text-3xl sm:text-4xl font-black cursor-pointer hover:bg-accent-hover active:scale-95 transition-all shadow-card"
				>
					<Volume2 className="w-10 h-10 sm:w-12 sm:h-12" aria-hidden />
					<Volume2 className="w-7 h-7 sm:w-9 sm:h-9 opacity-60" aria-hidden />
				</button>
			) : (
				// Solo la imagen (si se viera la palabra, bastaría con copiarla); tocarla dice la palabra
				<button
					type="button"
					onClick={() => decir(ronda.meta)}
					aria-label="Escuchar la palabra"
					className="relative w-44 h-44 sm:w-60 sm:h-60 rounded-card border-4 border-borderStrong bg-surface p-3 shadow-card cursor-pointer active:scale-95 transition-transform"
				>
					<img src={ronda.meta.pictogramaUrl} alt="" className="w-full h-full object-contain" />
					<Volume2 className="absolute bottom-2 right-2 w-9 h-9 p-1.5 rounded-full bg-accent text-onAccent border-2 border-borderStrong" aria-hidden />
				</button>
			)}

			<div className="flex flex-wrap items-stretch justify-center gap-4 sm:gap-6 w-full">
				{ronda.opciones.map((p) => (
					<button key={p.texto} type="button" onClick={() => elegir(p)} className={`${claseOpcion(estadoDe(p))} ${esEscucha ? 'w-36 h-36 sm:w-52 sm:h-52' : 'min-w-36 sm:min-w-52 min-h-24 sm:min-h-32'}`} aria-label={esEscucha ? p.texto : undefined}>
						{esEscucha ? (
							<img src={p.pictogramaUrl} alt="" className="w-full h-full object-contain" />
						) : (
							<span className="text-3xl sm:text-5xl font-black text-primary">{p.texto}</span>
						)}
					</button>
				))}
			</div>
		</div>
	);
};

/** ¿Con qué sonido empieza? Se oye la palabra, se ve su imagen y se elige la sílaba inicial. */
const RondaSonido: React.FC<RondaProps & { ronda: Extract<Ronda, { tipo: 'sonido' }> }> = ({ ronda, alTerminar }) => {
	const decir = useDecirPalabra();
	const hablar = useHablar();
	const [fallos, setFallos] = useState<string[]>([]);
	const [acertada, setAcertada] = useState(false);
	const ayuda = fallos.length >= FALLOS_PARA_AYUDA;

	useEffect(() => {
		const id = setTimeout(() => decir(ronda.meta), 500);
		return () => clearTimeout(id);
	}, [decir, ronda.meta]);

	const elegir = (silaba: string) => {
		if (acertada) return;
		hablar(silaba);
		if (silaba === ronda.correcta) {
			setAcertada(true);
			sonarAcierto();
			useGuideStore.getState().reaccionar('feliz');
			setTimeout(() => alTerminar(ayuda, ronda.meta.texto), PAUSA_TRAS_ACIERTO);
		} else {
			sonarToque();
			useGuideStore.getState().reaccionar('animo');
			setFallos((f) => [...f, silaba]);
		}
	};

	return (
		<div className="flex-1 w-full flex flex-col items-center justify-center gap-6 sm:gap-8">
			<PictogramaCard palabra={{ ...ronda.meta, silabas: undefined }} grande />
			<PreguntaVoz texto="¿Con qué empieza?" clave="que_empieza" retraso={1900} />
			<div className="flex flex-wrap items-stretch justify-center gap-4 sm:gap-6 w-full">
				{ronda.opciones.map((silaba) => {
					const estado = acertada && silaba === ronda.correcta ? 'acierto' : ayuda && !acertada && silaba === ronda.correcta ? 'ayuda' : fallos.includes(silaba) ? 'error' : 'normal';
					return (
						<button key={silaba} type="button" onClick={() => elegir(silaba)} className={`${claseOpcion(estado)} min-w-32 sm:min-w-44 min-h-24 sm:min-h-32`}>
							<span className="text-5xl sm:text-7xl font-black text-primary">{silaba}</span>
						</button>
					);
				})}
			</div>
		</div>
	);
};

const FALLOS_MEMORIA_SIN_AYUDA = 3;

/** Memoria: se dan vuelta dos cartas y se buscan las parejas de imagen y palabra. */
const RondaMemoria: React.FC<RondaProps & { ronda: Extract<Ronda, { tipo: 'memoria' }> }> = ({ ronda, alTerminar }) => {
	const decir = useDecirPalabra();
	const [abiertas, setAbiertas] = useState<number[]>([]);
	const [parejas, setParejas] = useState<string[]>([]);
	const [fallos, setFallos] = useState(0);
	const bloqueo = useRef(false);
	const totalPares = ronda.cartas.length / 2;

	const voltear = (i: number) => {
		const carta: CartaMemoria = ronda.cartas[i];
		if (bloqueo.current || abiertas.includes(i) || parejas.includes(carta.clave)) return;
		sonarToque();
		decir(carta.palabra);
		const nuevas = [...abiertas, i];
		setAbiertas(nuevas);
		if (nuevas.length < 2) return;

		bloqueo.current = true;
		const [a, b] = nuevas.map((n) => ronda.cartas[n]);
		if (a.clave === b.clave) {
			setTimeout(() => {
				const logradas = [...parejas, a.clave];
				setParejas(logradas);
				setAbiertas([]);
				bloqueo.current = false;
				sonarAcierto();
				useGuideStore.getState().reaccionar('feliz');
				if (logradas.length === totalPares) setTimeout(() => alTerminar(fallos >= FALLOS_MEMORIA_SIN_AYUDA), PAUSA_TRAS_ACIERTO);
			}, 600);
		} else {
			setTimeout(() => {
				setAbiertas([]);
				setFallos((f) => f + 1);
				bloqueo.current = false;
				useGuideStore.getState().reaccionar('animo');
			}, 1100);
		}
	};

	return (
		<div className="flex-1 w-full flex flex-col items-center justify-center gap-6">
			<PreguntaVoz texto="Busca las parejas." clave="busca_parejas" />
			<div className="grid grid-cols-3 gap-3 sm:gap-5">
				{ronda.cartas.map((carta, i) => {
					const visible = abiertas.includes(i) || parejas.includes(carta.clave);
					const lograda = parejas.includes(carta.clave);
					return (
						<button
							key={`${carta.clave}-${carta.cara}`}
							type="button"
							onClick={() => voltear(i)}
							aria-label={visible ? carta.palabra.texto : 'Carta dada vuelta'}
							className={`w-28 h-28 sm:w-40 sm:h-40 rounded-card border-4 flex items-center justify-center p-2 shadow-card cursor-pointer active:scale-95 transition-all ${
								lograda ? 'border-statusOk bg-statusOk/15' : visible ? 'border-brand bg-surface' : 'border-borderStrong bg-brand hover:bg-brand-hover'
							}`}
						>
							{visible ? (
								carta.cara === 'imagen' ? (
									<img src={carta.palabra.pictogramaUrl} alt="" className="w-full h-full object-contain" />
								) : (
									<span className="text-2xl sm:text-4xl font-black text-primary">{carta.palabra.texto}</span>
								)
							) : (
								<Star className="w-12 h-12 sm:w-16 sm:h-16 text-onBrand fill-accent" strokeWidth={2.5} aria-hidden />
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
};

/** Completa la frase: falta una palabra y se elige su imagen entre tres. */
const RondaCompleta: React.FC<RondaProps & { ronda: Extract<Ronda, { tipo: 'completa' }> }> = ({ ronda, alTerminar }) => {
	const hablar = useHablar();
	const decir = useDecirPalabra();
	const [fallos, setFallos] = useState<string[]>([]);
	const [acertada, setAcertada] = useState(false);
	const meta = ronda.palabras[ronda.hueco];
	const ayuda = fallos.length >= FALLOS_PARA_AYUDA;

	const elegir = (p: CuentoPalabra) => {
		if (acertada) return;
		decir(p);
		if (p.texto === meta.texto) {
			setAcertada(true);
			sonarAcierto();
			useGuideStore.getState().reaccionar('feliz');
			setTimeout(() => hablar(ronda.frase), 500);
			setTimeout(() => alTerminar(ayuda, meta.texto), PAUSA_TRAS_ACIERTO + 1200);
		} else {
			sonarToque();
			useGuideStore.getState().reaccionar('animo');
			setFallos((f) => [...f, p.texto]);
		}
	};

	return (
		<div className="flex-1 w-full flex flex-col items-center justify-center gap-6 sm:gap-10">
			<PreguntaVoz texto={`${ronda.palabras.slice(0, ronda.hueco).map((p) => p.texto).join(' ')}... ¿qué falta?`} />
			<div className="flex items-center justify-center gap-3 sm:gap-4 bg-surface/90 rounded-card p-3 sm:p-4" aria-label={ronda.frase}>
				{ronda.palabras.map((p, i) =>
					i === ronda.hueco && !acertada ? (
						<div key={i} className="w-24 h-24 sm:w-36 sm:h-36 rounded-control border-4 border-dashed border-borderStrong bg-app flex items-center justify-center text-4xl sm:text-6xl font-black text-secondary" aria-label="Falta una palabra">
							?
						</div>
					) : (
						<div key={i} className={`w-24 h-24 sm:w-36 sm:h-36 rounded-control border-4 flex items-center justify-center bg-surface ${i === ronda.hueco ? 'border-statusOk bg-statusOk/15 animate-pop' : 'border-borderStrong'}`}>
							<FichaPalabra p={p} className="p-1" />
						</div>
					)
				)}
			</div>
			<p className="text-2xl sm:text-4xl font-black text-primary bg-surface/90 rounded-full px-6 py-2 text-center">
				{ronda.palabras.map((p, i) => (i === ronda.hueco && !acertada ? '___' : p.texto)).join(' ')}
			</p>
			<div className="flex flex-wrap items-stretch justify-center gap-4 sm:gap-6">
				{ronda.opciones.map((p) => {
					const estado = acertada && p.texto === meta.texto ? 'acierto' : ayuda && !acertada && p.texto === meta.texto ? 'ayuda' : fallos.includes(p.texto) ? 'error' : 'normal';
					return (
						<button key={p.texto} type="button" onClick={() => elegir(p)} aria-label={p.texto} className={`${claseOpcion(estado)} w-28 h-28 sm:w-40 sm:h-40`}>
							<FichaPalabra p={p} />
						</button>
					);
				})}
			</div>
		</div>
	);
};

/** Ordenar la oración: se tocan las imágenes en el orden en que se dicen. */
const RondaOrdenar: React.FC<RondaProps & { ronda: Extract<Ronda, { tipo: 'ordena' }> }> = ({ ronda, alTerminar }) => {
	const decir = useDecirPalabra();
	const [colocadas, setColocadas] = useState<CuentoPalabra[]>([]);
	const [fallos, setFallos] = useState(0);
	const [hubeAyuda, setHubeAyuda] = useState(false);
	const [errorActual, setErrorActual] = useState<string | null>(null);
	const siguiente = ronda.orden[colocadas.length];
	const terminada = colocadas.length === ronda.orden.length;
	const ayuda = fallos >= FALLOS_PARA_AYUDA && !terminada;
	const completaRef = useRef(false);

	const colocar = (p: CuentoPalabra, porAyuda = false) => {
		if (terminada) return;
		decir(p);
		if (p === siguiente) {
			sonarToque();
			setErrorActual(null);
			setFallos(0);
			if (porAyuda) setHubeAyuda(true);
			const nuevas = [...colocadas, p];
			setColocadas(nuevas);
			if (nuevas.length === ronda.orden.length && !completaRef.current) {
				completaRef.current = true;
				sonarAcierto();
				useGuideStore.getState().reaccionar('baile');
				setTimeout(() => alTerminar(porAyuda || hubeAyuda, ronda.frase), PAUSA_TRAS_ACIERTO + 600);
			}
		} else {
			sonarToque();
			useGuideStore.getState().reaccionar('animo');
			setErrorActual(p.texto);
			setFallos((f) => f + 1);
		}
	};

	const disponibles = ronda.mezcla.filter((p) => !colocadas.includes(p));

	return (
		<div className="flex-1 w-full flex flex-col items-center justify-center gap-6 sm:gap-10">
			<PreguntaVoz texto="Pon en orden." clave="pon_en_orden" />
			<div className="flex items-center justify-center gap-3 sm:gap-4 bg-surface/90 rounded-card p-3 sm:p-4 border-4 border-dashed border-borderStrong" aria-label="Tu oración">
				{ronda.orden.map((_, i) => {
					const p = colocadas[i];
					return (
						<div key={i} className={`w-24 h-24 sm:w-36 sm:h-36 rounded-control border-4 flex items-center justify-center ${p ? 'border-statusOk bg-statusOk/15 animate-pop' : 'border-borderStrong bg-app'}`}>
							{p ? <FichaPalabra p={p} className="p-1" /> : <span className="text-3xl font-black text-secondary" aria-hidden>{i + 1}</span>}
						</div>
					);
				})}
			</div>

			{terminada ? (
				<p className="text-3xl sm:text-5xl font-black text-primary bg-surface/90 rounded-full px-8 py-2 text-center">{ronda.frase}</p>
			) : (
				<div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
					{disponibles.map((p) => (
						<button key={p.texto} type="button" onClick={() => colocar(p)} aria-label={p.texto} className={`${claseOpcion(ayuda && p === siguiente ? 'ayuda' : errorActual === p.texto ? 'error' : 'normal')} w-28 h-28 sm:w-40 sm:h-40`}>
							<FichaPalabra p={p} />
						</button>
					))}
				</div>
			)}
			{ayuda && (
				<Button variant="accent" size="xl" onClick={() => siguiente && colocar(siguiente, true)} aria-label="Te ayudo">
					<Lightbulb className="w-9 h-9" aria-hidden />
					<Volume2 className="w-7 h-7 opacity-60" aria-hidden />
				</Button>
			)}
		</div>
	);
};

/** Actividades que siguen a cada cuento: se arman con sus palabras y se hacen con voz e imágenes. */
export const ActividadesView: React.FC = () => {
	const { nivelId = '', cuentoId } = useParams();
	const navigate = useNavigate();
	const cuento = useCuento(cuentoId);
	const cuentos = useCuentos();
	const activeStudentId = useAuthStore((s) => s.activeStudentId);
	const supervision = useAuthStore((s) => s.supervision);

	const [vuelta, setVuelta] = useState(0);
	const [indice, setIndice] = useState(0);
	const [sinAyuda, setSinAyuda] = useState(0);
	const [terminado, setTerminado] = useState(false);
	const [stickerNuevo, setStickerNuevo] = useState<number | null>(null);
	const coleccion = useColeccion(activeStudentId);
	// Palabras en las que necesitó ayuda: se guardan para que la docente sepa qué le cuesta
	const dificiles = useRef<string[]>([]);

	const rondas = cuento && cuentos ? generarRondas(cuento, cuentos.filter((c) => c.estado === 'publicado' && c.id !== cuento.id), vuelta) : null;
	const total = rondas?.length ?? 0;
	const volver = () => navigate(ROUTES.catalogo(nivelId));

	const alTerminarRonda = async (conAyuda: boolean, tema?: string) => {
		if (conAyuda && tema) dificiles.current.push(tema);
		const aciertos = sinAyuda + (conAyuda ? 0 : 1);
		setSinAyuda(aciertos);
		if (indice + 1 < total) {
			setIndice(indice + 1);
			return;
		}
		// Gana un sticker la primera vez que completa las actividades de este cuento
		const esPrimera = !!cuento?.id && !coleccion.cuentosConActividad.has(cuento.id);
		setStickerNuevo(esPrimera && !supervision ? coleccion.siguiente : null);
		setTerminado(true);
		sonarAcierto();
		useGuideStore.getState().reaccionar('baile');
		if (activeStudentId && cuento && !supervision) {
			await crearRegistro({
				alumnoId: activeStudentId,
				tipo: 'actividad',
				cuentoId: cuento.id,
				aciertos,
				total,
				dificiles: [...new Set(dificiles.current)],
				detalle: `Actividades de «${cuento.titulo}»: ${aciertos} de ${total} sin ayuda`,
				lugar: 'casa',
				fecha: new Date().toISOString(),
			});
		}
	};

	const reiniciar = () => {
		setVuelta((v) => v + 1);
		setIndice(0);
		setSinAyuda(0);
		setStickerNuevo(null);
		dificiles.current = [];
		setTerminado(false);
	};

	if (!cuento || !rondas) {
		return (
			<LayoutEstudiante onVolver={volver}>
				<main className="flex-1 flex items-center justify-center">
					<p className="text-3xl font-black text-primary">Un momento…</p>
				</main>
			</LayoutEstudiante>
		);
	}

	if (total === 0) {
		return (
			<LayoutEstudiante onVolver={volver}>
				<main className="flex-1 flex flex-col items-center justify-center gap-6 p-6 text-center">
					<OsoBurbuja mensaje="Pronto habrá juegos aquí" clave="pronto" size="md" />
					<Button variant="accent" size="xl" onClick={volver}>
						<BookOpen className="w-8 h-8" aria-hidden />
						Otro cuento
					</Button>
				</main>
			</LayoutEstudiante>
		);
	}

	if (terminado) {
		const estrellas = sinAyuda / total >= 0.8 ? 3 : sinAyuda / total >= 0.5 ? 2 : 1;
		return (
			<LayoutEstudiante
				osito={{ tipo: 'actor', mensaje: '¡Lo lograste!', audioUrl: getPersonajeAudio('felicitaciones'), reaccionInicial: 'baile', tiempoVisible: 9000, posicion: 'max-lg:hidden bottom-8 right-8' }}
			>
				<LluviaEstrellas />
				<main className="relative flex-1 w-full max-w-3xl mx-auto px-4 py-6 flex flex-col items-center justify-center gap-6 text-center">
					<h1 className="text-4xl sm:text-5xl font-black text-primary bg-surface/90 rounded-full px-8 py-2">¡Qué bien jugaste!</h1>
					<div className="flex items-center justify-center gap-3 bg-surface/90 rounded-full px-8 py-4" role="img" aria-label={`${estrellas} de 3 estrellas`}>
						{[1, 2, 3].map((n) => (
							<Star key={n} className={`w-16 h-16 sm:w-24 sm:h-24 ${n <= estrellas ? 'fill-accent text-borderStrong animate-pop' : 'text-borderStrong opacity-40'}`} strokeWidth={2.5} aria-hidden />
						))}
					</div>
					{stickerNuevo !== null && (
						<div className="flex flex-col items-center gap-2">
							<Sticker indice={stickerNuevo} obtenido size="lg" animar />
							<p className="text-2xl font-black text-primary bg-surface/90 rounded-full px-5 py-1">¡Sticker nuevo!</p>
						</div>
					)}
					<OsoBurbuja mensaje="¡Lo lograste!" audioUrl={getPersonajeAudio('felicitaciones')} size="md" className="lg:hidden" />
					<div className="flex flex-wrap items-center justify-center gap-4">
						<Button variant="accent" size="xl" onClick={reiniciar}>
							<RotateCcw className="w-8 h-8" aria-hidden />
							Jugar otra vez
						</Button>
						<Button variant="secondary" size="xl" onClick={volver}>
							<BookOpen className="w-8 h-8" aria-hidden />
							Otro cuento
						</Button>
						<Button variant="secondary" size="xl" onClick={() => navigate(ROUTES.menu)}>
							<Home className="w-8 h-8" aria-hidden />
							Inicio
						</Button>
					</div>
				</main>
			</LayoutEstudiante>
		);
	}

	const ronda = rondas[indice];
	return (
		<LayoutEstudiante
			onVolver={volver}
			osito={{ tipo: 'actor', lado: 'izquierda', mensaje: '¡Vamos a jugar!', clave: 'intentemos', callado: true, reaccionInicial: 'saludo', tiempoVisible: 6000, retraso: 900, posicion: 'max-lg:hidden bottom-28 left-4' }}
		>
			<main className="relative flex-1 w-full max-w-5xl mx-auto px-4 py-4 sm:py-6 flex flex-col items-center gap-4">
				<h1 className="sr-only">Actividades de {cuento.titulo}</h1>
				<ol className="flex items-center justify-center gap-3 bg-surface/90 rounded-full px-5 py-2" aria-label={`Juego ${indice + 1} de ${total}`}>
					{rondas.map((_, i) => (
						<li key={i} aria-hidden className={`rounded-full border-2 border-borderStrong transition-all ${i === indice ? 'w-6 h-6 bg-accent border-brand' : i < indice ? 'w-4 h-4 bg-brand' : 'w-4 h-4 bg-surface'}`} />
					))}
				</ol>
				{ronda.tipo === 'ordena' ? (
					<RondaOrdenar key={`${vuelta}-${indice}`} ronda={ronda} alTerminar={alTerminarRonda} />
				) : ronda.tipo === 'sonido' ? (
					<RondaSonido key={`${vuelta}-${indice}`} ronda={ronda} alTerminar={alTerminarRonda} />
				) : ronda.tipo === 'memoria' ? (
					<RondaMemoria key={`${vuelta}-${indice}`} ronda={ronda} alTerminar={alTerminarRonda} />
				) : ronda.tipo === 'completa' ? (
					<RondaCompleta key={`${vuelta}-${indice}`} ronda={ronda} alTerminar={alTerminarRonda} />
				) : (
					<RondaElegir key={`${vuelta}-${indice}`} ronda={ronda} alTerminar={alTerminarRonda} />
				)}
			</main>
		</LayoutEstudiante>
	);
};
