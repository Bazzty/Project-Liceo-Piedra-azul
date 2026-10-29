import React, { useCallback, useEffect, useRef, useState } from 'react';
import { OsoCabeza } from './OsoCabeza';
import { useHablar } from '@/shared/hooks/useHablar';
import type { ClaveAudio } from '@/shared/config/audiosInterfaz';
import { useGuideStore } from '@/shared/store/useGuideStore';
import type { ReaccionGuia } from '@/shared/store/useGuideStore';
import { useAjustesStore } from '@/shared/store/useAjustesStore';
import { usePlayerStore } from '@/shared/store/usePlayerStore';
import '@/styles/osito.css';

/* ============================================================
   Osito de cuerpo completo: llega caminando, saluda, se queda un
   rato reaccionando a lo que pasa en la actividad y se va.
   ============================================================ */

type Fase = 'oculto' | 'entrando' | 'quieto' | 'saliendo';
type Accion = 'saludo' | 'feliz' | 'animo' | 'pensando' | 'toque' | 'baile' | 'salto' | 'asombro' | 'giro';
type Lado = 'derecha' | 'izquierda';

const DUR_ENTRADA = 2600;
const DUR_SALIDA = 2300;
const DUR_ACCION: Record<Accion, number> = {
	saludo: 1900, feliz: 1500, animo: 1500, pensando: 2300, toque: 600,
	baile: 2700, salto: 1100, asombro: 1700, giro: 1100,
};
const FRASES: Partial<Record<Accion, string>> = {
	feliz: '¡Muy bien!', animo: '¡Tú puedes!', pensando: 'Mmm… ¿cuál será?',
	baile: '¡A bailar!', salto: '¡Arriba!', asombro: '¡Guau!', giro: '¡Wiii!',
};
/* Lo que hace solito mientras está en pantalla (para que se vea vivo) */
const ACCIONES_LIBRES: Accion[] = ['baile', 'giro', 'salto', 'saludo', 'pensando', 'asombro'];
/* Cada toque del niño provoca algo distinto */
const CICLO_TOQUE: Accion[] = ['toque', 'giro', 'salto', 'baile', 'asombro', 'toque'];
const BOCAS_HABLA = ['AEI', 'O', 'CDNS', 'EE', 'U', 'BMP', 'AEI', 'L'];
const COLORES = ['#FFC83D', '#FF8FA3', '#7AD7F0', '#A78BFA', '#6EE7B7'];

interface Particula { id: number; dx: string; dy: string; rot: string; delay: string; color: string; corazon: boolean }

const crearParticulas = (corazon: boolean): Particula[] => {
	const n = corazon ? 5 : 9;
	return Array.from({ length: n }, (_, i) => {
		const ang = Math.PI + (Math.PI * (i + 0.5)) / n + (Math.random() - 0.5) * 0.3;
		const radio = 260 + Math.random() * 140;
		return {
			id: i,
			dx: `${(Math.cos(ang) * radio).toFixed(0)}%`,
			dy: `${(Math.sin(ang) * radio).toFixed(0)}%`,
			rot: `${((Math.random() - 0.5) * 240).toFixed(0)}deg`,
			delay: `${(Math.random() * 0.18).toFixed(2)}s`,
			color: COLORES[(i + Math.floor(Math.random() * 3)) % COLORES.length],
			corazon,
		};
	});
};

export interface OsitoActorProps {
	/** Frase que aparece en el globito (y que "dice" si hay audio). */
	mensaje?: string;
	/** Audio que se reproduce cuando el osito llega. */
	audioUrl?: string;
	/** Grabación de la voz suave del proyecto (ver audiosInterfaz.ts); si no existe, lee el mensaje con la voz del navegador. */
	clave?: ClaveAudio;
	/** Si es true, no habla al llegar (solo cuando lo tocan). */
	callado?: boolean;
	/** Reacción inicial después de llegar (por defecto "saludo"). */
	reaccionInicial?: Accion;
	/** Desde qué lado llega caminando (por defecto, la derecha). */
	lado?: Lado;
	/** Milisegundos que se queda en pantalla después de su última acción. */
	tiempoVisible?: number;
	/** Clases extra para la posición (por defecto abajo, sobre la barra inferior, del lado por donde llega). */
	posicion?: string;
	/** Retrasa la llegada del osito (ms). */
	retraso?: number;
}

export const OsitoActor: React.FC<OsitoActorProps> = ({
	mensaje,
	audioUrl,
	clave,
	callado = false,
	reaccionInicial = 'saludo',
	tiempoVisible = 7000,
	lado = 'derecha',
	posicion,
	retraso = 300,
}) => {
	const izq = lado === 'izquierda';
	const posicionFinal = posicion ?? (izq ? 'bottom-24 left-2 sm:left-6' : 'bottom-24 right-2 sm:right-6');
	const [fase, setFase] = useState<Fase>('oculto');
	const [accion, setAccion] = useState<Accion | null>(null);
	const [hablando, setHablando] = useState(false);
	const [boca, setBoca] = useState('NEUTRAL');
	const [texto, setTexto] = useState<string | undefined>(mensaje);
	const [particulas, setParticulas] = useState<Particula[]>([]);
	const [miradaLibre, setMiradaLibre] = useState<{ x: number; y: number } | null>(null);

	const ocupadoHasta = useRef(0);
	const toquesRef = useRef(0);
	const faseRef = useRef<Fase>('oculto');
	const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
	const salidaRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const hablaRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const reducido = useRef(false);
	const decir = useHablar();
	const propsRef = useRef({ mensaje, audioUrl, clave, callado, reaccionInicial, tiempoVisible });
	// Se actualiza después de cada render (no durante el render), antes de que el osito llegue
	useEffect(() => {
		propsRef.current = { mensaje, audioUrl, clave, callado, reaccionInicial, tiempoVisible };
	});

	const despues = useCallback((fn: () => void, ms: number) => {
		const id = setTimeout(() => {
			timers.current.delete(id);
			fn();
		}, ms);
		timers.current.add(id);
		return id;
	}, []);

	const cambiarFase = useCallback((f: Fase) => {
		faseRef.current = f;
		setFase(f);
	}, []);

	/* ---------- habla (mueve la boca mientras suena el audio) ---------- */
	const pararHabla = useCallback(() => {
		if (hablaRef.current) clearInterval(hablaRef.current);
		hablaRef.current = null;
		setHablando(false);
		setBoca('NEUTRAL');
	}, []);

	const hablar = useCallback(() => {
		const { audioUrl: url, mensaje: msg } = propsRef.current;
		if (!url && !msg) return;
		pararHabla();
		let audio: HTMLAudioElement | null = null;
		if (url) usePlayerStore.getState().playAudio(url);
		else if (msg) decir(msg, propsRef.current.clave);
		audio = usePlayerStore.getState().activeAudioInstance;
		const maxMs = audio ? 15000 : Math.min(4500, (msg?.length ?? 20) * 80);
		const t0 = performance.now();
		let i = 0;
		setHablando(true);
		hablaRef.current = setInterval(() => {
			const fin =
				performance.now() - t0 > maxMs ||
				(audio && (audio.ended || usePlayerStore.getState().activeAudioInstance !== audio));
			if (fin) {
				pararHabla();
				return;
			}
			i = (i + 1 + Math.floor(Math.random() * 2)) % BOCAS_HABLA.length;
			setBoca(BOCAS_HABLA[i]);
		}, 130);
	}, [pararHabla, decir]);

	/* ---------- salida programada ---------- */
	const irse = useCallback(() => {
		if (faseRef.current !== 'quieto') return;
		ocupadoHasta.current = Date.now() + 6000; // no hace cosas libres mientras se despide
		pararHabla();
		setTexto(undefined);
		setAccion('saludo'); // se despide con la mano
		despues(() => {
			setAccion(null);
			cambiarFase('saliendo');
			despues(() => cambiarFase('oculto'), reducido.current ? 300 : DUR_SALIDA);
		}, DUR_ACCION.saludo - 200);
	}, [despues, cambiarFase, pararHabla]);

	const programarSalida = useCallback(() => {
		if (salidaRef.current) clearTimeout(salidaRef.current);
		salidaRef.current = setTimeout(irse, propsRef.current.tiempoVisible);
		timers.current.add(salidaRef.current);
	}, [irse]);

	/* ---------- una acción (saludo, feliz, etc.) ---------- */
	const hacer = useCallback((a: Accion, reiniciaSalida = true) => {
		ocupadoHasta.current = Date.now() + DUR_ACCION[a] + 250;
		setAccion(null);
		// Pequeño reinicio para poder repetir la misma animación
		despues(() => {
			setAccion(a);
			const frase = FRASES[a];
			if (frase) {
				setTexto(frase);
				despues(() => setTexto(propsRef.current.mensaje), 2600);
			}
			if (a === 'feliz' || a === 'animo' || a === 'baile' || a === 'salto') {
				setParticulas(crearParticulas(a === 'animo' || a === 'baile'));
				despues(() => setParticulas([]), 1800);
			}
			despues(() => setAccion((x) => (x === a ? null : x)), DUR_ACCION[a]);
		}, 30);
		if (reiniciaSalida) programarSalida();
	}, [despues, programarSalida]);

	/* ---------- entrada ---------- */
	const entrar = useCallback(() => {
		if (faseRef.current !== 'oculto') return false;
		setTexto(propsRef.current.mensaje);
		cambiarFase('entrando');
		despues(() => {
			cambiarFase('quieto');
			hacer(propsRef.current.reaccionInicial);
			if (!propsRef.current.callado) hablar();
		}, reducido.current ? 300 : DUR_ENTRADA);
		return true;
	}, [cambiarFase, despues, hacer, hablar]);

	// Llegada inicial + limpieza
	useEffect(() => {
		reducido.current =
			(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false) || !useAjustesStore.getState().movimiento;
		const ts = timers.current;
		despues(entrar, retraso);
		return () => {
			ts.forEach(clearTimeout);
			ts.clear();
			if (hablaRef.current) clearInterval(hablaRef.current);
			hablaRef.current = null;
			faseRef.current = 'oculto';
		};
	}, [entrar, despues, retraso]);

	// Reacciones disparadas desde cualquier pantalla (useGuideStore)
	const disparo = useGuideStore((s) => s.disparo);
	const reaccionStore = useGuideStore((s) => s.reaccion);
	const disparoInicial = useRef(disparo);
	useEffect(() => {
		if (disparo === disparoInicial.current || !reaccionStore) return;
		const r: ReaccionGuia = reaccionStore;
		// Se reacciona en el siguiente turno (no dentro del propio efecto)
		const id = setTimeout(() => {
			if (faseRef.current === 'oculto') {
				// Estaba ausente: solo vuelve caminando para celebrar o saludar
				if (r !== 'feliz' && r !== 'saludo' && r !== 'baile') return;
				setTexto(undefined);
				cambiarFase('entrando');
				despues(() => {
					cambiarFase('quieto');
					hacer(r);
				}, reducido.current ? 300 : DUR_ENTRADA);
			} else if (faseRef.current === 'quieto') {
				hacer(r);
			}
		}, 0);
		return () => clearTimeout(id);
	}, [disparo, reaccionStore, hacer, cambiarFase, despues]);

	/* ---------- vida propia: mira alrededor y hace cosas solito ---------- */
	useEffect(() => {
		if (reducido.current) return;
		let id: ReturnType<typeof setTimeout>;
		const siguiente = () => {
			id = setTimeout(() => {
				if (faseRef.current === 'quieto' && Date.now() > ocupadoHasta.current && !hablaRef.current) {
					if (Math.random() < 0.55) {
						// Solo mira hacia otro lado un ratito
						setMiradaLibre({ x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.7) * 1.4 });
						despues(() => setMiradaLibre(null), 1300);
					} else {
						hacer(ACCIONES_LIBRES[Math.floor(Math.random() * ACCIONES_LIBRES.length)], false);
					}
				}
				siguiente();
			}, 2200 + Math.random() * 2400);
		};
		siguiente();
		return () => clearTimeout(id);
	}, [hacer, despues]);

	/* ---------- toque del niño ---------- */
	const alTocar = () => {
		if (faseRef.current !== 'quieto') return;
		hacer(CICLO_TOQUE[toquesRef.current++ % CICLO_TOQUE.length]);
		if (propsRef.current.audioUrl || propsRef.current.mensaje) hablar();
	};

	if (fase === 'oculto') return null;

	const feliz = ['feliz', 'animo', 'toque', 'saludo', 'baile', 'salto', 'giro'].includes(accion ?? '');
	const bocaMostrada = hablando ? boca : accion === 'asombro' ? 'O' : feliz ? 'HAPPY' : accion === 'pensando' ? 'U' : 'NEUTRAL';
	const mirada = accion === 'pensando' ? { x: -0.8, y: -1 } : accion === 'asombro' ? { x: 0, y: -1 } : miradaLibre;

	return (
		<div className={`osito-actor fixed z-40 pointer-events-none ${posicionFinal}`} data-fase={fase} data-lado={izq ? 'izq' : 'der'} aria-live="polite">
			<div className="osito-bob" data-caminando={fase === 'quieto' ? '0' : '1'}>
				{texto && fase === 'quieto' && (
					<div key={texto} className="osito-globo" role="status">
						{texto}
					</div>
				)}

				<div className="osito-flip">
				<div
					className="osito-acc pointer-events-auto cursor-pointer"
					data-accion={accion ?? ''}
					role="button"
					tabIndex={0}
					aria-label="Osito guía. Tócalo para jugar con él"
					onClick={alTocar}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							alTocar();
						}
					}}
				>
					<div className="osito-sombra" />

					{/* ---------- cuerpo ---------- */}
					<svg className="osito-cuerpo" viewBox="0 0 300 280" aria-hidden="true">
						<defs>
							<clipPath id="osito-clip-torso"><ellipse cx="150" cy="125" rx="82" ry="90" /></clipPath>
						</defs>

						{/* piernas */}
						<g className="osito-pierna osito-pierna-izq">
							<rect x="94" y="184" width="36" height="62" rx="17" fill="#52aeba" stroke="#3d5088" strokeWidth="4" />
							<ellipse cx="110" cy="256" rx="29" ry="14" fill="#7d77b8" stroke="#3d5088" strokeWidth="4" />
							<ellipse cx="110" cy="259" rx="12" ry="6" fill="#f2879b" />
						</g>
						<g className="osito-pierna osito-pierna-der">
							<rect x="170" y="184" width="36" height="62" rx="17" fill="#52aeba" stroke="#3d5088" strokeWidth="4" />
							<ellipse cx="190" cy="256" rx="29" ry="14" fill="#7d77b8" stroke="#3d5088" strokeWidth="4" />
							<ellipse cx="190" cy="259" rx="12" ry="6" fill="#f2879b" />
						</g>

						{/* torso */}
						<g clipPath="url(#osito-clip-torso)">
							<rect x="60" y="30" width="180" height="200" fill="#7d77b8" />
							<ellipse cx="150" cy="105" rx="96" ry="96" fill="#52aeba" />
							<ellipse cx="108" cy="70" rx="30" ry="16" fill="#6ad3d1" opacity="0.7" transform="rotate(-25 108 70)" />
						</g>
						<ellipse cx="150" cy="125" rx="82" ry="90" fill="none" stroke="#3d5088" strokeWidth="4" />
						<ellipse cx="150" cy="140" rx="46" ry="54" fill="#fbe4bd" stroke="#8e4b6a" strokeWidth="3" />

						{/* brazos */}
						<g className="osito-brazo osito-brazo-izq">
							<rect x="54" y="92" width="32" height="78" rx="16" fill="#52aeba" stroke="#3d5088" strokeWidth="4" />
							<circle cx="70" cy="166" r="16" fill="#7d77b8" stroke="#3d5088" strokeWidth="4" />
						</g>
						<g className="osito-brazo osito-brazo-der">
							<rect x="214" y="92" width="32" height="78" rx="16" fill="#52aeba" stroke="#3d5088" strokeWidth="4" />
							<circle cx="230" cy="166" r="16" fill="#7d77b8" stroke="#3d5088" strokeWidth="4" />
						</g>
					</svg>

					{/* ---------- cabeza ---------- */}
					<div className="osito-cabeza">
						<OsoCabeza boca={bocaMostrada} ojosFelices={feliz} mirada={mirada} invertirX={izq} />
					</div>

					{/* estrellitas / corazoncitos */}
					<div className="osito-particulas" aria-hidden="true">
						{particulas.map((p) => (
							<span
								key={p.id}
								className="oso-particula"
								style={{ '--dx': p.dx, '--dy': p.dy, '--rot': p.rot, '--delay': p.delay } as React.CSSProperties}
							>
								<svg viewBox="0 0 24 24">
									<path
										d={
											p.corazon
												? 'M12 21s-7.5-4.6-9.5-9.2C1 8 3.2 4.5 6.7 4.5c2 0 3.6 1.1 5.3 3 1.7-1.9 3.3-3 5.3-3 3.5 0 5.7 3.5 4.2 7.3C19.5 16.4 12 21 12 21z'
												: 'M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7L2 9.2l7.1-.6z'
										}
										fill={p.color}
										stroke="#fff"
										strokeWidth="1.4"
										strokeLinejoin="round"
									/>
								</svg>
							</span>
						))}
					</div>
				</div>
				</div>
			</div>
		</div>
	);
};
