import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CuentoPalabra } from '../../db/db';
import { getArasaacImageUrl, fetchArasaacPictogramId } from '../../services/arasaac';

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
	const [fallbackRemoteUrl, setFallbackRemoteUrl] = useState<string | null>(null);

	const picEnDb = useLiveQuery(
		async () => {
			if (palabra.pictogramaUrl) return null;
			const cleanText = palabra.texto.toLowerCase().trim();
			return await db.pictogramas.where('palabra').equalsIgnoreCase(cleanText).first();
		},
		[palabra.texto, palabra.pictogramaUrl]
	);

	const finalImageUrl = fallbackRemoteUrl || palabra.pictogramaUrl || picEnDb?.imagenUrl;

	const handleImageError = async () => {
		if (!fallbackRemoteUrl) {
			const cleanWord = palabra.texto.toLowerCase().trim();
			const remoteId = await fetchArasaacPictogramId(cleanWord);
			if (remoteId) {
				setFallbackRemoteUrl(getArasaacImageUrl(remoteId));
			}
		}
	};

	return (
		<div
			role="button"
			tabIndex={0}
			onClick={onClick}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					if (onClick) onClick();
				}
			}}
			className={`flex flex-col items-center gap-2 cursor-pointer group transform hover:scale-105 active:scale-95 transition-all bg-app p-4 rounded-3xl border-4 shadow-md ${
				isHighlighted
					? 'border-brand bg-brand/15 ring-4 ring-brand/30 scale-105'
					: 'border-borderCustom hover:border-brand'
			} ${className}`}
		>
			<div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center bg-surface rounded-2xl p-2 border-2 border-borderCustom shadow-inner overflow-hidden">
				{finalImageUrl ? (
					<img
						src={finalImageUrl}
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

			<span className="font-black text-base sm:text-lg text-primary text-center">
				{palabra.texto}
			</span>
		</div>
	);
};