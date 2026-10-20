import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { CuentoPalabra } from '@/types';
import { usePlayerStore } from '@/store/usePlayerStore';
import { resolverYGuardarPictograma } from '@/services/arasaac';

export interface PictogramaCardProps {
	palabra: CuentoPalabra;
	isHighlighted?: boolean;
	onClick?: () => void;
	className?: string;
}

export const PictogramaCard: React.FC<PictogramaCardProps> = ({
	palabra,
	isHighlighted = false,
	onClick,
	className = '',
}) => {
	const { playAudio } = usePlayerStore();
	const [imgSrc, setImgSrc] = useState<string | null>(null);
	const [hasError, setHasError] = useState(false);

	// Búsqueda en IndexedDB si la palabra del cuento no trae pictogramaUrl explícito
	const picEnDb = useLiveQuery(
		async () => {
			if (palabra.pictogramaUrl) return null;
			const cleanText = palabra.texto.toLowerCase().trim();
			return await db.pictogramas.where('palabra').equalsIgnoreCase(cleanText).first();
		},
		[palabra.texto, palabra.pictogramaUrl]
	);

	const initialImageUrl = palabra.pictogramaUrl || picEnDb?.imagenUrl;

	useEffect(() => {
		setImgSrc(initialImageUrl || null);
		setHasError(false);
	}, [initialImageUrl, palabra.texto]);

	const handleImageError = async () => {
		if (!hasError) {
			const apiUrl = await resolverYGuardarPictograma(palabra.texto);
			if (apiUrl && apiUrl !== imgSrc) {
				setImgSrc(apiUrl);
			} else {
				setHasError(true);
			}
		}
	};

	const handlePalabraClick = () => {
		if (palabra.audioUrl) {
			playAudio(palabra.audioUrl);
		}
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
			className={`flex flex-col items-center gap-3 cursor-pointer group transform hover:scale-105 active:scale-95 transition-all bg-app p-4 rounded-3xl border-4 shadow-md ${
				isHighlighted
					? 'border-brand bg-brand/15 ring-4 ring-brand/30 scale-105'
					: 'border-borderCustom hover:border-brand'
			} ${className}`}
		>
			{/* Marco del Pictograma */}
			<div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center bg-surface rounded-2xl p-2 border-2 border-borderCustom shadow-inner overflow-hidden">
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

			{/* Texto de la Palabra */}
			<span className="font-black text-lg sm:text-xl text-primary text-center">
				{palabra.texto}
			</span>

			{/* Botones de Sílabas Separadas (Nivel A) */}
			{palabra.silabas && palabra.silabas.length > 0 && (
				<div className="flex gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
					{palabra.silabas.map((silaba, idx) => (
						<button
							key={idx}
							onClick={(e) => handleSilabaClick(e, silaba.audioUrl)}
							className="px-3 py-1.5 bg-brand text-white font-black text-sm rounded-xl shadow border-2 border-brand-hover hover:scale-110 active:scale-95 transition-all cursor-pointer"
						>
							{silaba.texto}
						</button>
					))}
				</div>
			)}
		</div>
	);
};