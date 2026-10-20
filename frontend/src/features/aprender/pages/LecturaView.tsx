import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Volume2, CheckCircle2 } from 'lucide-react';
import { MainLayout } from '@/shared/layouts/MainLayout';
import { PictogramaCard } from '@/features/aprender/components/PictogramaCard';
import { CharacterGuide } from '@/shared/components/CharacterGuide';
import { usePlayerStore } from '@/shared/store/usePlayerStore';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { getPersonajeAudio } from '@/shared/config/audioConfig';
import { registrarProgreso, useCuento } from '@/api';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/app/routes';

export const LecturaView: React.FC = () => {
	const { nivelId = '', cuentoId } = useParams();
	const navigate = useNavigate();
	const { playAudio } = usePlayerStore();
	const { activeStudentId } = useAuthStore();
	const [paginaActual, setPaginaActual] = useState(0);
	const [actividadCompletada, setActividadCompletada] = useState(false);

	const cuento = useCuento(cuentoId);

	const handleVolver = () => navigate(ROUTES.catalogo(nivelId));

	const [cuentoAnterior, setCuentoAnterior] = useState(cuentoId);
	if (cuentoAnterior !== cuentoId) {
		setCuentoAnterior(cuentoId);
		setPaginaActual(0);
		setActividadCompletada(false);
	}

	if (!cuento) {
		return (
			<MainLayout>
				<div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
					<div className="animate-spin text-brand text-4xl">
						📚
					</div>
					<p className="text-xl font-black text-secondary">
						Cargando actividad de lectura...
					</p>
				</div>
			</MainLayout>
		);
	}

	const paginas = cuento.paginas || [];
	const paginaData = paginas[paginaActual];
	const esUltimaPagina = paginaActual === paginas.length - 1;

	const handleReproducirAudioPagina = () => {
		if (paginaData?.audioPaginaUrl) {
			playAudio(paginaData.audioPaginaUrl);
		} else if (paginaData?.palabras?.[0]?.audioUrl) {
			playAudio(paginaData.palabras[0].audioUrl);
		}
	};

	const handleSiguientePagina = async () => {
		if (esUltimaPagina) {
			setActividadCompletada(true);
			if (activeStudentId && cuento.id) {
				await registrarProgreso({
					alumnoId: activeStudentId,
					cuentoId: cuento.id,
					completado: true,
					fechaUltimoAcceso: new Date().toISOString(),
				});
			}
		} else {
			setPaginaActual((prev) => prev + 1);
		}
	};

	const handleAnteriorPagina = () => {
		if (paginaActual > 0) {
			setPaginaActual((prev) => prev - 1);
		}
	};

	if (actividadCompletada) {
		return (
			<MainLayout>
				<div className="flex flex-col items-center justify-center min-h-[80vh] p-4 gap-6 text-center">
					<div className="p-4 bg-brand/10 border-4 border-brand rounded-full text-brand animate-bounce">
						<CheckCircle2 size={64} />
					</div>
					<h1 className="text-3xl font-black text-primary">
						¡Excelente trabajo!
					</h1>
					<p className="text-lg font-medium text-secondary max-w-md">
						Has completado la actividad "{cuento.titulo}".
					</p>
					<CharacterGuide
						mensaje="¡Lo has hecho genial! Completaste toda la lectura."
						audioUrl={getPersonajeAudio('felicitaciones')}
						variant="compact"
					/>
					<button
						onClick={handleVolver}
						className="px-6 py-3 bg-brand text-onBrand font-black rounded-2xl shadow-lg border-4 border-brand-hover hover:opacity-90 active:scale-95 transition-all cursor-pointer"
					>
						VOLVER AL INICIO
					</button>
				</div>
			</MainLayout>
		);
	}

	return (
		<MainLayout>
			<div className="flex flex-col items-center justify-between min-h-[85vh] p-4 gap-6 max-w-4xl mx-auto w-full">
				{/* Barra Superior de Navegación */}
				<div className="flex items-center justify-between w-full bg-surface border-4 border-borderCustom rounded-3xl p-4 shadow-md">
					<button
						onClick={handleVolver}
						className="flex items-center gap-2 bg-app px-4 py-2 rounded-2xl border-2 border-borderCustom font-black text-primary hover:border-brand transition-all active:scale-95 cursor-pointer shadow-sm"
					>
						<ArrowLeft size={20} />
						SALIR
					</button>
					<h2 className="text-lg sm:text-xl font-black text-primary text-center px-2">
						{cuento.titulo}
					</h2>
					{(paginaData?.audioPaginaUrl || paginaData?.palabras?.[0]?.audioUrl) ? (
						<button
							onClick={handleReproducirAudioPagina}
							className="flex items-center gap-2 bg-brand text-onBrand px-4 py-2 rounded-2xl font-black shadow-md border-2 border-brand-hover hover:scale-105 active:scale-95 transition-all cursor-pointer"
						>
							<Volume2 size={20} />
							<span className="hidden sm:inline">ESCUCHAR</span>
						</button>
					) : (
						<div className="w-10" />
					)}
				</div>

				{/* Área Central: Tarjeta Nivel A (palabra única) o Nivel D (frase) */}
				<div className="flex-1 flex flex-col items-center justify-center w-full my-4">
					{paginaData?.palabras && paginaData.palabras.length === 1 ? (
						<div className="w-full max-w-xs sm:max-w-sm flex justify-center">
							<PictogramaCard palabra={paginaData.palabras[0]} isHighlighted={true} className="w-full" />
						</div>
					) : (
						<div className="flex flex-wrap items-center justify-center gap-4 w-full p-6 bg-surface border-4 border-borderCustom rounded-3xl shadow-lg">
							{paginaData?.palabras?.map((p, idx) => (
								<PictogramaCard key={idx} palabra={p} />
							))}
						</div>
					)}
				</div>

				{/* Barra Inferior de Paginación */}
				<div className="flex items-center justify-between w-full bg-surface border-4 border-borderCustom rounded-3xl p-4 shadow-md">
					<button
						onClick={handleAnteriorPagina}
						disabled={paginaActual === 0}
						className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black border-2 transition-all ${
							paginaActual === 0
								? 'opacity-40 cursor-not-allowed bg-app border-borderCustom text-secondary'
								: 'bg-app border-borderCustom text-primary hover:border-brand cursor-pointer active:scale-95 shadow-sm'
						}`}
					>
						<ChevronLeft size={20} />
						ANTERIOR
					</button>

					<span className="font-black text-base sm:text-lg text-primary">
						PÁGINA {paginaActual + 1} DE {paginas.length}
					</span>

					<button
						onClick={handleSiguientePagina}
						className="flex items-center gap-2 px-6 py-2 bg-brand text-onBrand font-black rounded-2xl shadow-md border-2 border-brand-hover hover:scale-105 active:scale-95 transition-all cursor-pointer"
					>
						{esUltimaPagina ? 'FINALIZAR' : 'SIGUIENTE'}
						<ChevronRight size={20} />
					</button>
				</div>
			</div>
		</MainLayout>
	);
};