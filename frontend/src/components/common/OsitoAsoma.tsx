import React, { useCallback, useEffect, useRef, useState } from 'react';
import { OsoCabeza } from './OsoCabeza';
import { useGuideStore } from '../../store/useGuideStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import '../../styles/osito.css';

/* ============================================================
   Osito que se ASOMA por el borde de la pantalla (abajo, izquierda
   o derecha): primero solo los ojitos, que siguen el dedo/mouse;
   a veces sube un poco más, parpadea, sonríe y vuelve a esconderse.
   Si el niño lo toca, sale del todo, se ríe y dice su frase.
   ============================================================ */

type Estado = 'oculto' | 'ojos' | 'cabeza' | 'pop';
export type LadoAsoma = 'abajo' | 'izq' | 'der';

const BOCAS_HABLA = ['AEI', 'O', 'CDNS', 'EE', 'U', 'BMP', 'AEI', 'L'];
const alAzar = (min: number, max: number) => min + Math.random() * (max - min);

export interface OsitoAsomaProps {
	/** Por qué borde se asoma. */
	lado?: LadoAsoma;
	/** Posición sobre ese borde, de 0 a 100 (% desde la izquierda si es "abajo", desde arriba si es un lado). */
	pos?: number;
	/** Ancho de la cabeza (CSS). */
	tamano?: string;
	/** Frase que dice al tocarlo. */
	mensaje?: string;
	/** Audio que suena al tocarlo. */
	audioUrl?: string;
	/** Espera antes de la primera aparición (ms). */
	retraso?: number;
}

export const OsitoAsoma: React.FC<OsitoAsomaProps> = ({
	lado = 'izq',
	pos = 55,
	tamano = 'clamp(6rem, 17vw, 10rem)',
	mensaje = '¡Hola! Aquí estoy',
	audioUrl,
	retraso = 1800,
}) => {
	const [estado, setEstado] = useState<Estado>('oculto');
	const [feliz, setFeliz] = useState(false);
	const [boca, setBoca] = useState('NEUTRAL');
	const [mirada, setMirada] = useState<{ x: number; y: number } | null>(null);
	const [dice, setDice] = useState(false);

	const token = useRef(0); // invalida el ciclo en curso cuando el niño lo toca
	const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
	const hablaRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const reducido = useRef(false);

	const esperar = useCallback((ms: number) => new Promise<void>((ok) => {
		const id = setTimeout(() => {
			timers.current.delete(id);
			ok();
		}, ms);
		timers.current.add(id);
	}), []);

	const pararHabla = useCallback(() => {
		if (hablaRef.current) clearInterval(hablaRef.current);
		hablaRef.current = null;
		setBoca('NEUTRAL');
		setDice(false);
	}, []);

	/* ---------- ciclo: se esconde → ojitos → cabeza → se esconde ---------- */
	const ciclo = useCallback(async () => {
		const mio = ++token.current;
		const vigente = () => token.current === mio;
		await esperar(alAzar(2500, 6000));
		while (vigente()) {
			setFeliz(false);
			setEstado('ojos');
			// A veces mira hacia el centro de la pantalla, como buscando a alguien
			if (Math.random() < 0.5) {
				await esperar(alAzar(900, 1500));
				if (!vigente()) return;
				setMirada({ x: lado === 'izq' ? 0.8 : lado === 'der' ? -0.8 : 0, y: lado === 'abajo' ? -0.9 : -0.2 });
				await esperar(alAzar(900, 1600));
				if (!vigente()) return;
				setMirada(null);
			}
			await esperar(alAzar(1500, 3200));
			if (!vigente()) return;

			if (Math.random() < 0.6) {
				setEstado('cabeza');
				setFeliz(Math.random() < 0.6);
				await esperar(alAzar(1600, 2800));
				if (!vigente()) return;
				setEstado('ojos');
				setFeliz(false);
				await esperar(alAzar(600, 1100));
				if (!vigente()) return;
			}
			setEstado('oculto');
			await esperar(alAzar(4000, 9000));
		}
	}, [esperar, lado]);

	useEffect(() => {
		reducido.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
		const ts = timers.current;
		if (reducido.current) {
			setEstado('ojos'); // quieto, sin ciclo
		} else {
			const id = setTimeout(() => void ciclo(), retraso);
			ts.add(id);
		}
		return () => {
			token.current++;
			ts.forEach(clearTimeout);
			ts.clear();
			if (hablaRef.current) clearInterval(hablaRef.current);
		};
	}, [ciclo, retraso]);

	/* ---------- sale del todo (por toque o por una reacción de la actividad) ---------- */
	const salirDelTodo = useCallback(async (hablar: boolean) => {
		token.current++; // corta el ciclo normal
		const mio = token.current;
		setMirada(null);
		setEstado('pop');
		setFeliz(true);
		if (hablar) {
			setDice(true);
			if (audioUrl) usePlayerStore.getState().playAudio(audioUrl);
			let i = 0;
			if (hablaRef.current) clearInterval(hablaRef.current);
			hablaRef.current = setInterval(() => {
				i = (i + 1 + Math.floor(Math.random() * 2)) % BOCAS_HABLA.length;
				setBoca(BOCAS_HABLA[i]);
			}, 130);
		}
		await esperar(hablar ? 2600 : 1800);
		if (token.current !== mio) return;
		pararHabla();
		setFeliz(false);
		setEstado('ojos');
		await esperar(900);
		if (token.current !== mio) return;
		if (!reducido.current) void ciclo();
	}, [audioUrl, ciclo, esperar, pararHabla]);

	// Se emociona cuando la actividad dispara una reacción (acierto, ánimo, etc.)
	const disparo = useGuideStore((s) => s.disparo);
	const disparoInicial = useRef(disparo);
	useEffect(() => {
		if (disparo === disparoInicial.current) return;
		void salirDelTodo(false);
	}, [disparo, salirDelTodo]);

	const visibleAhora = estado !== 'oculto';

	return (
		<div
			className="osito-asoma"
			data-lado={lado}
			data-estado={estado}
			style={{ '--asoma-w': tamano, '--asoma-pos': `${pos}%` } as React.CSSProperties}
		>
			<div
				className="osito-asoma-cuerpo"
				role="button"
				tabIndex={visibleAhora ? 0 : -1}
				aria-label="Osito que se asoma. Tócalo para saludarlo"
				onClick={() => visibleAhora && void salirDelTodo(true)}
				onKeyDown={(e) => {
					if ((e.key === 'Enter' || e.key === ' ') && visibleAhora) {
						e.preventDefault();
						void salirDelTodo(true);
					}
				}}
			>
				{dice && mensaje && <div className="osito-asoma-globo" role="status">{mensaje}</div>}

				<div className="osito-asoma-cabeza">
					<OsoCabeza boca={feliz && !dice ? 'HAPPY' : boca} ojosFelices={feliz} mirada={mirada} />
				</div>

				{lado === 'abajo' && (
					<svg className="osito-asoma-manos" viewBox="0 0 100 24" aria-hidden="true">
						<g className="osito-mano osito-mano-izq">
							<ellipse cx="16" cy="14" rx="11" ry="9" fill="#7d77b8" stroke="#3d5088" strokeWidth="2.4" />
							<ellipse cx="16" cy="15" rx="4.5" ry="3.4" fill="#f2879b" />
						</g>
						<g className="osito-mano osito-mano-der">
							<ellipse cx="84" cy="14" rx="11" ry="9" fill="#7d77b8" stroke="#3d5088" strokeWidth="2.4" />
							<ellipse cx="84" cy="15" rx="4.5" ry="3.4" fill="#f2879b" />
						</g>
					</svg>
				)}
			</div>
		</div>
	);
};
