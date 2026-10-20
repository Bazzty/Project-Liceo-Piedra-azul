import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Sparkles, Star } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { MainLayout } from '@/layouts/MainLayout';
import { CharacterGuide } from '@/components/common/CharacterGuide';
import { useAuthStore } from '@/store/useAuthStore';
import { db } from '@/db/db';
import type { Cuento, Progreso } from '@/types';
import { resolverYGuardarPictograma } from '@/services/arasaac';

// Subcomponente interno para la portada de la tarjeta con fallback a ARASAAC
const PortadaCuento: React.FC<{ cuento: Cuento }> = ({ cuento }) => {
	const [imgSrc, setImgSrc] = useState(cuento.portadaUrl);
	const [hasError, setHasError] = useState(false);

	useEffect(() => {
		setImgSrc(cuento.portadaUrl);
		setHasError(false);
	}, [cuento.portadaUrl, cuento.titulo]);

	const handleImageError = async () => {
		if (!hasError) {
			// Intenta obtener la imagen desde ARASAAC si la ruta local no existe en /public/
			const apiUrl = await resolverYGuardarPictograma(cuento.titulo);
			if (apiUrl && apiUrl !== imgSrc) {
				setImgSrc(apiUrl);
			} else {
				setHasError(true);
			}
		}
	};

	return (
		<div className="w-full h-36 flex items-center justify-center bg-app rounded-2xl overflow-hidden p-2">
			{imgSrc && !hasError ? (
				<img
					src={imgSrc}
					alt={cuento.titulo}
					onError={handleImageError}
					className="w-full h-full object-contain group-hover:scale-105 transition-transform"
				/>
			) : (
				<div className="flex flex-col items-center justify-center text-secondary gap-1">
					<BookOpen size={36} />
					<span className="text-xs font-bold text-center">{cuento.titulo}</span>
				</div>
			)}
		</div>
	);
};

export interface CatalogoCuentosProps {
	nivelId: string;
	onSelectCuento: (cuentoId: string) => void;
	onBack: () => void;
	onSessionTimeoutRedirect?: () => void;
}

export const CatalogoCuentos: React.FC<CatalogoCuentosProps> = ({
	nivelId,
	onSelectCuento,
	onBack,
}) => {
	const { activeStudentId } = useAuthStore();
	const nivel = useLiveQuery(() => db.niveles.get(nivelId), [nivelId]);
	const cuentos = useLiveQuery(
		() => db.cuentos.where('nivelId').equals(nivelId).toArray(),
		[nivelId]
	);
	const progresos = useLiveQuery(
		async () => {
			if (!activeStudentId) return [];
			return await db.progresos.where('alumnoId').equals(activeStudentId).toArray();
		},
		[activeStudentId]
	);

	const cuentoEstaCompletado = (cuentoId?: string) => {
		if (!cuentoId || !progresos) return false;
		return progresos.some((p: Progreso) => p.cuentoId === cuentoId && p.completado);
	};

	return (
		<MainLayout>
			<div className="flex flex-col gap-6 max-w-5xl mx-auto w-full p-4 min-h-[85vh]">
				{/* Encabezado Fijo */}
				<div className="flex items-center justify-between w-full bg-surface border-4 border-borderCustom rounded-3xl p-4 shadow-md">
					<button
						onClick={onBack}
						className="flex items-center gap-2 bg-app px-4 py-2 rounded-2xl border-2 border-borderCustom font-black text-primary hover:border-brand transition-all active:scale-95 cursor-pointer shadow-sm"
					>
						<ArrowLeft size={20} />
						VOLVER
					</button>

					<div className="text-center">
						<span className="text-xs font-black text-brand tracking-wider uppercase">
							{nivel ? `NIVEL ${nivel.codigo}` : 'NIVEL DE LECTURA'}
						</span>
						<h1 className="text-lg sm:text-2xl font-black text-primary">
							{nivel ? nivel.nombre : 'Catálogo de Cuentos'}
						</h1>
					</div>

					<div className="w-16 sm:w-24" />
				</div>

				{/* Guía en modo compacto */}
				<CharacterGuide
					mensaje="Elige una actividad o cuento para comenzar a practicar."
					variant="compact"
				/>

				{/* Grilla de Actividades */}
				<div className="flex flex-col gap-4">
					<h2 className="text-xl font-black text-primary flex items-center gap-2">
						<Sparkles className="text-brand" size={24} />
						Actividades Disponibles
					</h2>

					{!cuentos || cuentos.length === 0 ? (
						<div className="flex flex-col items-center justify-center p-12 bg-surface border-4 border-borderCustom rounded-3xl text-center gap-3">
							<BookOpen size={48} className="text-secondary" />
							<p className="text-lg font-bold text-secondary">
								Aún no hay actividades cargadas para este nivel.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
							{cuentos.map((cuento: Cuento) => {
								const completado = cuentoEstaCompletado(cuento.id);
								return (
									<div
										key={cuento.id}
										role="button"
										tabIndex={0}
										onClick={() => cuento.id && onSelectCuento(cuento.id)}
										onKeyDown={(e) => {
											if ((e.key === 'Enter' || e.key === ' ') && cuento.id) {
												e.preventDefault();
												onSelectCuento(cuento.id);
											}
										}}
										className="bg-surface rounded-3xl border-4 border-borderCustom p-4 shadow-xl hover:border-brand transition-all active:scale-98 cursor-pointer flex flex-col justify-between gap-3 group relative overflow-hidden"
									>
										{/* Indicador ⭐ COMPLETADO */}
										{completado && (
											<div className="absolute top-3 right-3 bg-brand text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-md z-10">
												<Star size={14} fill="currentColor" />
												COMPLETADO
											</div>
										)}

										{/* Portada Resiliente con Fallback a ARASAAC */}
										<PortadaCuento cuento={cuento} />

										{/* Título y Descripción */}
										<div className="flex flex-col gap-1">
											<h3 className="font-black text-lg text-primary group-hover:text-brand transition-colors">
												{cuento.titulo}
											</h3>
											<p className="text-xs text-secondary line-clamp-2">
												{cuento.descripcion}
											</p>
										</div>

										{/* Pie de Tarjeta */}
										<div className="flex items-center justify-between border-t-2 border-borderCustom pt-3 mt-1">
											<span className="text-xs font-bold text-secondary">
												{cuento.paginas?.length || 1} {cuento.paginas?.length === 1 ? 'Página' : 'Páginas'}
											</span>
											<span className="text-xs font-black text-brand bg-brand/10 px-3 py-1 rounded-xl">
												{completado ? 'RELEER' : 'LEER'}
											</span>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</MainLayout>
	);
};