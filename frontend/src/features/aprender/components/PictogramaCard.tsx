import React, { useState } from 'react';
import type { CuentoPalabra } from '@/types';
import { usePlayerStore } from '@/shared/store/usePlayerStore';
import { resolverYGuardarPictograma } from '@/features/tablero/arasaac';
import { usePictogramaPorPalabra } from '@/api';
import { useHablar } from '@/shared/hooks/useHablar';

export interface PictogramaCardProps {
	palabra: CuentoPalabra;
	isHighlighted?: boolean;
	onClick?: () => void;
	className?: string;
	/** Tamaño grande para quien aún no lee: pictograma enorme y sílabas fáciles de tocar. */
	grande?: boolean;
}

export const PictogramaCard: React.FC<PictogramaCardProps> = ({
	palabra,
	isHighlighted = false,
	onClick,
	className = '',
	grande = false,
}) => {
	const { playAudio } = usePlayerStore();
	const hablar = useHablar();
	const [imgSrc, setImgSrc] = useState<string | null>(null);
	const [hasError, setHasError] = useState(false);

	// Búsqueda en IndexedDB si la palabra del cuento no trae pictogramaUrl explícito
	const picEnDb = usePictogramaPorPalabra(palabra.texto, !palabra.pictogramaUrl);

	const initialImageUrl = palabra.pictogramaUrl || picEnDb?.imagenUrl;

	// Reinicia la imagen cuando cambia la palabra o su pictograma (ajuste durante el render)
	const claveImagen = `${palabra.texto}|${initialImageUrl ?? ''}`;
	const [claveAnterior, setClaveAnterior] = useState('');
	if (claveAnterior !== claveImagen) {
		setClaveAnterior(claveImagen);
		setImgSrc(initialImageUrl || null);
		setHasError(false);
	}

	// Palabra de contenido (con dibujo previsto) vs. palabra funcional, que no lo lleva
	const sinDibujo = !palabra.pictogramaUrl && !palabra.clave && !picEnDb;

	const handleImageError = async () => {
		if (!hasError) {
			const apiUrl = await resolverYGuardarPictograma(palabra.clave ?? palabra.texto);
			if (apiUrl && apiUrl !== imgSrc) {
				setImgSrc(apiUrl);
			} else {
				setHasError(true);
			}
		}
	};

	const handlePalabraClick = () => {
		// Si la palabra aún no tiene audio grabado, se lee con la voz del navegador
		if (palabra.audioUrl) playAudio(palabra.audioUrl);
		else hablar(palabra.texto);
		if (onClick) {
			onClick();
		}
	};

	const handleSilabaClick = (e: React.MouseEvent, audioUrl: string) => {
		e.stopPropagation();
		playAudio(audioUrl);
	};

	return (
		<div
			role="button"
			tabIndex={0}
			onClick={handlePalabraClick}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					handlePalabraClick();
				}
			}}
			className={`flex flex-col items-center gap-3 cursor-pointer group transform hover:scale-105 active:scale-95 transition-all bg-surface p-4 rounded-card border-4 shadow-card ${
				isHighlighted
					? 'border-brand bg-accent/30 ring-8 ring-accent/70 scale-105'
					: 'border-borderCustom hover:border-brand'
			} ${className}`}
		>
			{/* Marco del pictograma. Las palabras sin dibujo (un, mi, con, tengo…) se muestran solo escritas,
			    en vez de una letra suelta que parece un error. */}
			{!sinDibujo && (
				<div className={`${grande ? 'w-36 h-36 sm:w-48 sm:h-48 lg:w-60 lg:h-60' : 'w-24 h-24 sm:w-28 sm:h-28'} flex items-center justify-center bg-surface rounded-control p-2 border-2 border-borderCustom shadow-inner overflow-hidden`}>
					{imgSrc && !hasError ? (
						<img
							src={imgSrc}
							alt={palabra.texto}
							onError={handleImageError}
							className="w-full h-full object-contain group-hover:scale-110 transition-transform"
						/>
					) : (
						<div className="text-3xl font-black text-secondary">
							{palabra.texto.charAt(0).toUpperCase()}
						</div>
					)}
				</div>
			)}

			{/* Texto de la Palabra */}
			<span className={`font-black text-primary text-center ${grande ? 'text-3xl sm:text-5xl' : 'text-lg sm:text-xl'}`}>
				{palabra.texto}
			</span>

			{/* Botones de Sílabas Separadas (Nivel A) */}
			{palabra.silabas && palabra.silabas.length > 0 && (
				<div className="flex gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
					{palabra.silabas.map((silaba, idx) => (
						<button
							key={idx}
							onClick={(e) => handleSilabaClick(e, silaba.audioUrl)}
							className={`${grande ? 'px-6 py-3 text-2xl min-h-14' : 'px-3 py-1.5 text-sm'} bg-brand text-onBrand font-black rounded-control shadow border-2 border-brand-hover hover:scale-110 active:scale-95 transition-all cursor-pointer`}
						>
							{silaba.texto}
						</button>
					))}
				</div>
			)}
		</div>
	);
};