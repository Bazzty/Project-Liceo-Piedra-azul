import React, { useEffect } from 'react';
import { Header } from '@/shared/components/Header';
import { useThemeStore } from '@/shared/store/useThemeStore';
import { useSessionTimeout } from '@/features/acceso/useSessionTimeout';
import { SessionTimeoutModal } from '@/features/acceso/SessionTimeoutModal';

export interface MainLayoutProps {
	children: React.ReactNode;
	onSessionTimeoutRedirect?: () => void;
	allowScroll?: boolean; // Habilita el desplazamiento en vistas con contenido extenso
}

export const MainLayout: React.FC<MainLayoutProps> = ({
	children,
	onSessionTimeoutRedirect,
	allowScroll = false,
}) => {
	const { currentTheme, showCharacterBackground } = useThemeStore();

	// Activa el temporizador de sesión de laboratorio de 1.5 horas
	useSessionTimeout();

	// Aplica el tema cromático seleccionado en el atributo data-theme global
	useEffect(() => {
		document.documentElement.setAttribute('data-theme', currentTheme);
	}, [currentTheme]);

	return (
		<div className={`min-h-screen bg-app text-primary flex flex-col relative ${allowScroll ? 'overflow-y-auto' : 'overflow-hidden'}`}>
			{/* Header Fijo Superior */}
			<Header />

			{/* Área Principal de Trabajo */}
			<main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 z-10">
				{children}
			</main>

			{/* Personajes flotantes de fondo en las esquinas inferiores */}
			{showCharacterBackground && (
				<div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden">
					<div className="absolute -bottom-4 -left-4 text-7xl sm:text-8xl opacity-20 filter drop-shadow">
						🦕
					</div>
					<div className="absolute -bottom-4 -right-4 text-7xl sm:text-8xl opacity-20 filter drop-shadow">
						⭐
					</div>
				</div>
			)}

			{/* Modal de Expiración de Sesión de Aula */}
			<SessionTimeoutModal
				onContinuar={() => {
					if (onSessionTimeoutRedirect) {
						onSessionTimeoutRedirect();
					}
				}}
				onClose={() => {
					if (onSessionTimeoutRedirect) {
						onSessionTimeoutRedirect();
					}
				}}
			/>
		</div>
	);
};