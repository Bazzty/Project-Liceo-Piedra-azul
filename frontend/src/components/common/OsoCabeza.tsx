import React, { useEffect, useId, useRef } from 'react';
import '../../styles/guide.css';

/* Cabeza del osito (cabeza_base.png de 2400 x 1792) con ojos que parpadean,
   siguen el dedo/mouse y boca con sprite. Se usa dentro del osito de cuerpo completo. */

const SPRITE_MAP: Record<string, { x: number; y: number }> = {
	AEI: { x: 0, y: 0 }, TH: { x: 1, y: 0 }, O: { x: 2, y: 0 }, EE: { x: 3, y: 0 }, NEUTRAL: { x: 4, y: 0 },
	HAPPY: { x: 0, y: 1 }, U: { x: 1, y: 1 }, BMP: { x: 2, y: 1 }, L: { x: 3, y: 1 }, FV: { x: 4, y: 1 },
	CH_J_SH: { x: 0, y: 2 }, CDNS: { x: 1, y: 2 }, GK: { x: 2, y: 2 }, WQ: { x: 3, y: 2 }, REPOSO: { x: 4, y: 2 },
};
const SPRITE_OFFSETS_X: Record<string, number> = {
	AEI: -3, TH: -2, O: 0, EE: -3, NEUTRAL: 0, HAPPY: 0, U: 0, BMP: 0, L: -4, FV: 0, CH_J_SH: 0, CDNS: 0, GK: -1, WQ: -2, REPOSO: 0,
};

const OJO_IZQ = 'M807 846 L777 862 L752 884 L737 904 L723 931 L712 966 L707 997 L707 1033 L715 1059 L726 1075 L757 1101 L784 1114 L821 1125 L859 1130 L895 1130 L927 1123 L956 1111 L973 1100 L992 1077 L1000 1054 L1005 1025 L1005 992 L1001 967 L992 936 L980 910 L963 885 L945 867 L909 845 L880 837 L848 836Z';
const OJO_DER = 'M1567 838 L1515 838 L1492 845 L1469 857 L1440 882 L1423 906 L1410 933 L1396 991 L1396 1030 L1402 1060 L1409 1078 L1425 1098 L1463 1119 L1508 1130 L1553 1129 L1600 1120 L1622 1112 L1658 1091 L1674 1076 L1690 1049 L1693 1035 L1692 987 L1684 950 L1667 910 L1652 888 L1627 864 L1597 847Z';
const COLOR_PUPILA = '#263962';
const COLOR_PARPADO = '#6ad3d1';
const PUPILA_MAX_X = 55;
const PUPILA_MAX_Y = 45;

export interface OsoCabezaProps {
	/** Boca a mostrar: AEI, O, U, HAPPY, NEUTRAL… */
	boca?: string;
	/** Ojitos felices (arco cerrado) */
	ojosFelices?: boolean;
	/** Mirada fija (x,y en -1..1). Si es null, sigue el puntero. */
	mirada?: { x: number; y: number } | null;
	/** Úsalo cuando el osito está espejado (scaleX(-1)): invierte la dirección horizontal de la mirada. */
	invertirX?: boolean;
}

export const OsoCabeza: React.FC<OsoCabezaProps> = ({ boca = 'NEUTRAL', ojosFelices = false, mirada = null, invertirX = false }) => {
	const idUnico = useId().replace(/:/g, '');
	const stageRef = useRef<HTMLDivElement | null>(null);
	const ojosRef = useRef<SVGGElement | null>(null);
	const pizqRef = useRef<SVGGElement | null>(null);
	const pderRef = useRef<SVGGElement | null>(null);
	const miradaRef = useRef<OsoCabezaProps['mirada']>(mirada);
	const signoRef = useRef(invertirX ? -1 : 1);
	useEffect(() => {
		signoRef.current = invertirX ? -1 : 1;
	}, [invertirX]);

	const baseUrl = import.meta.env.BASE_URL || '/';
	const cabezaUrl = `${baseUrl}assets/personajes/oso/cabeza_base.png`.replace(/\/\//g, '/');
	const spriteUrl = `${baseUrl}assets/personajes/oso/bocas_sprite.png`.replace(/\/\//g, '/');

	const mirarA = (x: number, y: number) => {
		const t = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
		if (pizqRef.current) pizqRef.current.style.transform = t;
		if (pderRef.current) pderRef.current.style.transform = t;
	};

	useEffect(() => {
		miradaRef.current = mirada;
		if (mirada) mirarA(mirada.x * signoRef.current * PUPILA_MAX_X, mirada.y * PUPILA_MAX_Y);
	}, [mirada, invertirX]);

	useEffect(() => {
		if (ojosRef.current) {
			if (ojosFelices) ojosRef.current.setAttribute('data-happy', '1');
			else ojosRef.current.removeAttribute('data-happy');
		}
	}, [ojosFelices]);

	// Parpadeo natural
	useEffect(() => {
		let id: ReturnType<typeof setTimeout>;
		let id2: ReturnType<typeof setTimeout>;
		const programar = () => {
			id = setTimeout(() => {
				const o = ojosRef.current;
				if (o) {
					o.setAttribute('data-blink', '1');
					id2 = setTimeout(() => o.removeAttribute('data-blink'), 150);
				}
				programar();
			}, 1800 + Math.random() * 3200);
		};
		programar();
		return () => {
			clearTimeout(id);
			clearTimeout(id2);
		};
	}, []);

	// Los ojos siguen el puntero
	useEffect(() => {
		if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
		let raf = 0;
		let px = 0;
		let py = 0;
		const aplicar = () => {
			raf = 0;
			const el = stageRef.current;
			if (!el || miradaRef.current) return;
			const r = el.getBoundingClientRect();
			if (r.width === 0) return;
			const dx = px - (r.left + r.width / 2);
			const dy = py - (r.top + r.height * 0.55);
			const dist = Math.hypot(dx, dy) || 1;
			const fuerza = Math.min(1, dist / (r.width * 1.1));
			mirarA((dx / dist) * fuerza * signoRef.current * PUPILA_MAX_X, (dy / dist) * fuerza * PUPILA_MAX_Y);
		};
		const mover = (e: PointerEvent) => {
			px = e.clientX;
			py = e.clientY;
			if (!raf) raf = requestAnimationFrame(aplicar);
		};
		window.addEventListener('pointermove', mover, { passive: true });
		window.addEventListener('pointerdown', mover, { passive: true });
		return () => {
			window.removeEventListener('pointermove', mover);
			window.removeEventListener('pointerdown', mover);
			if (raf) cancelAnimationFrame(raf);
		};
	}, []);

	const renderOjo = (lado: 'izq' | 'der') => {
		const ruta = lado === 'izq' ? OJO_IZQ : OJO_DER;
		const cx = lado === 'izq' ? 888 : 1513;
		const cy = 994;
		const s = lado === 'izq' ? 1 : -1;
		const clipId = `${idUnico}-ojo-${lado}`;
		const x0 = lado === 'izq' ? 690 : 1380;
		const ecx = lado === 'izq' ? 856 : 1544;
		return (
			<g key={lado}>
				<defs>
					<clipPath id={clipId}><path d={ruta} /></clipPath>
					<clipPath id={`${clipId}-lid`}>
						<path d={ruta} transform={`translate(${ecx} 983) scale(1.1) translate(${-ecx} -983)`} />
					</clipPath>
				</defs>
				<g clipPath={`url(#${clipId})`}>
					<rect x={x0} y={820} width={330} height={330} fill="#fdfdfd" />
					<g ref={lado === 'izq' ? pizqRef : pderRef} className="oso-pupila">
						<ellipse cx={cx} cy={cy} rx={100} ry={115} fill={COLOR_PUPILA} />
						<circle cx={cx + s * -63} cy={cy - 54} r={40} fill="#fdfdfd" />
						<circle cx={cx + s * 52} cy={cy + 56} r={18} fill="#c9d1e6" fillOpacity={0.55} />
					</g>
				</g>
				<g clipPath={`url(#${clipId}-lid)`}>
					<rect className="oso-lid oso-lid-top" x={x0} y={800} width={330} height={195} fill={COLOR_PARPADO} />
					<rect className="oso-lid oso-lid-top" x={x0} y={975} width={330} height={20} fill={COLOR_PUPILA} />
					<rect className="oso-lid oso-lid-bottom" x={x0} y={985} width={330} height={195} fill={COLOR_PARPADO} />
					<rect className="oso-happy" x={x0} y={800} width={330} height={380} fill={COLOR_PARPADO} />
				</g>
				<path
					className="oso-happy"
					d={`M${cx - 120} ${cy + 60} Q${cx} ${cy - 130} ${cx + 120} ${cy + 60}`}
					fill="none" stroke={COLOR_PUPILA} strokeWidth={30} strokeLinecap="round"
				/>
			</g>
		);
	};

	const coords = SPRITE_MAP[boca] || SPRITE_MAP.NEUTRAL;
	const offsetX = SPRITE_OFFSETS_X[boca] || 0;

	/* Caja cuadrada (igual que el avatar circular original) para reutilizar
	   las mismas proporciones de ojos y boca. */
	return (
		<div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
			<div
				ref={stageRef}
				className="absolute left-0 w-full"
				style={{ top: '50%', aspectRatio: '2400 / 1792', transform: 'translateY(-50%)' }}
			>
				<img src={cabezaUrl} alt="Osito" draggable={false} className="absolute inset-0 w-full h-full select-none" />
				<svg viewBox="0 0 2400 1792" className="absolute inset-0 w-full h-full" aria-hidden="true">
					<g ref={ojosRef} className="oso-eyes">
						{renderOjo('izq')}
						{renderOjo('der')}
					</g>
				</svg>
			</div>
			<div
				className="absolute top-[40%] left-[26%] w-[50%] h-[50%] overflow-hidden"
				style={{ clipPath: 'inset(0 0 18% 0)' }}
			>
				<img
					src={spriteUrl}
					alt=""
					draggable={false}
					className="absolute top-0 left-0 max-w-none select-none"
					style={{
						width: '500%',
						height: '300%',
						transform: `translate(calc(-${coords.x * 20}% + ${offsetX / 4}px), -${coords.y * 33.333}%)`,
					}}
				/>
			</div>
		</div>
	);
};
