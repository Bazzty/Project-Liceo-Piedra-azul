import React, { useState } from 'react';
import { Volume2, Trash2 } from 'lucide-react';
import type { Pictograma } from '@/types';
import { usePlayerStore } from '@/shared/store/usePlayerStore';
import { resolverYGuardarPictograma } from '@/features/tablero/arasaac';
import { usePictogramasPorCategoria } from '@/api';

interface ItemTableroProps {
	pic: Pictograma;
	onSelect: (pic: Pictograma) => void;
}

const ItemTablero: React.FC<ItemTableroProps> = ({ pic, onSelect }) => {
	const [imgSrc, setImgSrc] = useState(pic.imagenUrl);
	const [hasError, setHasError] = useState(false);

	const handleImageError = async () => {
		if (!hasError) {
			const apiUrl = await resolverYGuardarPictograma(pic.palabra);
			if (apiUrl && apiUrl !== imgSrc) {
				setImgSrc(apiUrl);
			} else {
				setHasError(true);
			}
		}
	};

	return (
		<div
			role="button"
			tabIndex={0}
			onClick={() => onSelect(pic)}
			onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(pic)}
			className="flex flex-col items-center justify-between p-3 bg-surface border-2 border-borderCustom hover:border-brand rounded-2xl shadow hover:scale-105 active:scale-95 transition-all cursor-pointer h-32 w-full"
		>
			<div className="w-16 h-16 flex items-center justify-center overflow-hidden">
				{!hasError ? (
					<img
						src={imgSrc}
						alt={pic.palabra}
						onError={handleImageError}
						className="w-full h-full object-contain"
					/>
				) : (
					<div className="text-2xl font-black text-secondary">
						{pic.palabra.charAt(0).toUpperCase()}
					</div>
				)}
			</div>

			<span className="font-bold text-sm text-primary text-center truncate w-full">
				{pic.palabra}
			</span>
		</div>
	);
};

export const TableroSAAC: React.FC = () => {
	const { playAudio } = usePlayerStore();
	const [categoriaActiva, setCategoriaActiva] = useState('todos');
	const [fraseConstruida, setFraseConstruida] = useState<Pictograma[]>([]);

	const pictogramas = usePictogramasPorCategoria(categoriaActiva as Pictograma['categoria'] | 'todos');

	const handleSelectPictograma = (pic: Pictograma) => {
		setFraseConstruida((prev) => [...prev, pic]);
		if (pic.audioUrl) {
			playAudio(pic.audioUrl);
		}
	};

	const handleReproducirFrase = () => {
		if (fraseConstruida.length === 0) return;

		let delay = 0;
		fraseConstruida.forEach((pic) => {
			if (pic.audioUrl) {
				setTimeout(() => {
					playAudio(pic.audioUrl!);
				}, delay);
				delay += 900;
			}
		});
	};

	const handleLimpiarFrase = () => {
		setFraseConstruida([]);
	};

	const categorias = [
		{ id: 'todos', label: 'Todos' },
		{ id: 'necesidades', label: 'Necesidades' },
		{ id: 'emociones', label: 'Emociones' },
		{ id: 'personas', label: 'Personas' },
		{ id: 'acciones', label: 'Acciones' },
		{ id: 'objetos', label: 'Objetos' },
	];

	return (
		<div className="flex flex-col gap-6 w-full">
			{/* Barra de Construcción de Frase */}
			<div className="flex items-center justify-between min-h-24 p-4 bg-surface border-4 border-borderCustom rounded-3xl shadow-inner gap-4 overflow-x-auto">
				<div className="flex items-center gap-3 flex-1 overflow-x-auto py-2">
					{fraseConstruida.length === 0 ? (
						<p className="text-secondary font-medium text-sm sm:text-base italic px-2">
							Toca los pictogramas abajo para construir tu mensaje...
						</p>
					) : (
						fraseConstruida.map((item, index) => (
							<div
								key={index}
								className="flex flex-col items-center bg-app border-2 border-borderCustom rounded-2xl p-2 min-w-[70px] shadow-sm animate-fade-in"
							>
								<img src={item.imagenUrl} alt={item.palabra} className="w-12 h-12 object-contain" />
								<span className="text-xs font-black text-primary mt-1">{item.palabra}</span>
							</div>
						))
					)}
				</div>

				{fraseConstruida.length > 0 && (
					<div className="flex items-center gap-2 shrink-0">
						<button
							onClick={handleReproducirFrase}
							className="flex items-center gap-2 bg-brand text-onBrand px-4 py-3 rounded-2xl font-black shadow hover:opacity-90 active:scale-95 transition-all cursor-pointer text-sm"
							title="Reproducir frase"
						>
							<Volume2 size={20} />
							<span className="hidden sm:inline">LEER</span>
						</button>
						<button
							onClick={handleLimpiarFrase}
							className="p-3 bg-statusDanger-bg text-statusDanger rounded-2xl border-2 border-statusDanger hover:opacity-80 active:scale-95 transition-all cursor-pointer shadow-sm"
							title="Limpiar frase"
						>
							<Trash2 size={20} />
						</button>
					</div>
				)}
			</div>

			{/* Categorías */}
			<div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
				{categorias.map((cat) => (
					<button
						key={cat.id}
						onClick={() => setCategoriaActiva(cat.id)}
						className={`px-4 py-2 rounded-xl font-extrabold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer border-2 shadow-sm ${
							categoriaActiva === cat.id
								? 'bg-brand text-onBrand border-brand-hover scale-105'
								: 'bg-surface text-secondary border-borderCustom hover:border-brand'
						}`}
					>
						{cat.label}
					</button>
				))}
			</div>

			{/* Grilla de Pictogramas */}
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[50vh] overflow-y-auto p-1">
				{pictogramas?.map((pic) => (
					<ItemTablero key={pic.id || pic.palabra} pic={pic} onSelect={handleSelectPictograma} />
				))}
			</div>
		</div>
	);
};