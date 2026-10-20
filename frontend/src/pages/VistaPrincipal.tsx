import React, { useState } from 'react';
import { BookOpen, MessageSquare, Palette, Star } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore, type ThemeId } from '../store/useThemeStore';
import { THEMES_CONFIG } from '../config/themes';
import { MainLayout } from '../layouts/MainLayout';
import { CharacterGuide } from '../components/common/CharacterGuide';
import { Modal } from '../components/common/Modal';
import { TableroSAAC } from '../components/tablero/TableroSAAC';
import { getPersonajeAudio } from '../config/audioConfig';

export interface VistaPrincipalProps {
	onNavigateToAprender?: () => void;
	onOpenHablar?: () => void;
	onSessionTimeoutRedirect?: () => void;
}

export const VistaPrincipal: React.FC<VistaPrincipalProps> = ({
	onNavigateToAprender,
	onOpenHablar,
}) => {
	const { activeStudentId } = useAuthStore();
	const { currentTheme, setTheme } = useThemeStore();
	const [isHablarModalOpen, setIsHablarModalOpen] = useState(false);
	const [isColoresModalOpen, setIsColoresModalOpen] = useState(false);
	const nombreAlumno = activeStudentId ? 'Mateo' : 'Amigo';

	const handleAprenderClick = () => {
		if (typeof onNavigateToAprender === 'function') {
			onNavigateToAprender();
		}
	};

	const handleHablarClick = () => {
		if (typeof onOpenHablar === 'function') {
			onOpenHablar();
		} else {
			setIsHablarModalOpen(true);
		}
	};

	return (
		<MainLayout>
			<div className="flex flex-col items-center justify-center min-h-[80vh] p-4 gap-6">
				{/* Personaje Guía Central (variant="compact") */}
				<CharacterGuide
					mensaje={`¡Hola, ${nombreAlumno}! ¿Qué te gustaría hacer hoy?`}
					audioUrl={getPersonajeAudio('bienvenida')}
					variant="compact"
				/>

				{/* Grilla 2x2 */}
				<div className="grid grid-cols-2 gap-4 w-full max-w-md sm:max-w-lg">
					{/* 1. APRENDER */}
					<div
						onClick={handleAprenderClick}
						style={{
							backgroundColor: 'var(--btn-aprender-bg)',
							color: 'var(--btn-aprender-text)',
							borderColor: 'var(--btn-aprender-border)',
						}}
						className="p-3 sm:p-4 rounded-3xl border-4 shadow-lg hover:opacity-90 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 sm:gap-2 w-full h-full cursor-pointer group"
					>
						<BookOpen className="w-10 h-10 sm:w-12 sm:h-12 group-hover:scale-110 transition-transform" />
						<span className="font-black text-base sm:text-lg">APRENDER</span>
					</div>

					{/* 2. HABLAR */}
					<div
						onClick={handleHablarClick}
						style={{
							backgroundColor: 'var(--btn-hablar-bg)',
							color: 'var(--btn-hablar-text)',
							borderColor: 'var(--btn-hablar-border)',
						}}
						className="p-3 sm:p-4 rounded-3xl border-4 shadow-lg hover:opacity-90 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 sm:gap-2 w-full h-full cursor-pointer group"
					>
						<MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 group-hover:scale-110 transition-transform" />
						<span className="font-black text-base sm:text-lg">HABLAR</span>
					</div>

					{/* 3. COLORES */}
					<div
						onClick={() => setIsColoresModalOpen(true)}
						style={{
							backgroundColor: 'var(--btn-colores-bg)',
							color: 'var(--btn-colores-text)',
							borderColor: 'var(--btn-colores-border)',
						}}
						className="p-3 sm:p-4 rounded-3xl border-4 shadow-lg hover:opacity-90 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 sm:gap-2 w-full h-full cursor-pointer group"
					>
						<Palette className="w-10 h-10 sm:w-12 sm:h-12 group-hover:scale-110 transition-transform" />
						<span className="font-black text-base sm:text-lg">COLORES</span>
					</div>

					{/* 4. LOGROS */}
					<div
						onClick={() => alert('¡Aquí verás tus estrellas y medallas de avance!')}
						style={{
							backgroundColor: 'var(--btn-logros-bg)',
							color: 'var(--btn-logros-text)',
							borderColor: 'var(--btn-logros-border)',
						}}
						className="p-3 sm:p-4 rounded-3xl border-4 shadow-lg hover:opacity-90 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 sm:gap-2 w-full h-full cursor-pointer group"
					>
						<Star className="w-10 h-10 sm:w-12 sm:h-12 group-hover:scale-110 transition-transform" />
						<span className="font-black text-base sm:text-lg">LOGROS</span>
					</div>
				</div>

				{/* Modal HABLAR (Tablero SAAC) */}
				<Modal isOpen={isHablarModalOpen} onClose={() => setIsHablarModalOpen(false)} title="Tablero de Comunicación (SAAC)" size="full">
					<TableroSAAC />
				</Modal>

				{/* Modal COLORES */}
				<Modal isOpen={isColoresModalOpen} onClose={() => setIsColoresModalOpen(false)} title="Elige tu Paleta de Colores">
					<div className="flex flex-col gap-3">
						<p className="text-sm text-secondary">
							Diseñado para cumplir con la Ley TEA 21.545 y bajo estímulo visual.
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
							{THEMES_CONFIG.map((theme) => (
								<button
									key={theme.id}
									onClick={() => setTheme(theme.id as ThemeId)}
									className={`flex items-center gap-3 p-4 rounded-2xl border-4 transition-all font-black text-sm cursor-pointer shadow text-left ${
										currentTheme === theme.id
											? 'border-brand bg-brand/10 ring-2 ring-brand scale-[1.02] text-primary'
											: 'border-borderCustom bg-surface hover:bg-app text-secondary'
									}`}
								>
									🎨 {theme.nombre}
								</button>
							))}
						</div>
					</div>
				</Modal>
			</div>
		</MainLayout>
	);
};