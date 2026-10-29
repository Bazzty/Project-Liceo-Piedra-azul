import React from 'react';
import { Clock, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/shared/ui';
import { useAuthStore } from '@/features/acceso/useAuthStore';

export interface SessionTimeoutModalProps {
	onClose?: () => void;
	onContinuar?: () => void;
	onCerrarSesion?: () => void;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
	onClose,
	onContinuar,
	onCerrarSesion,
}) => {
	const { isSessionExpiredModalOpen, closeSessionExpiredModal, logout } = useAuthStore();

	if (!isSessionExpiredModalOpen) return null;

	const handleConfirm = () => {
		if (closeSessionExpiredModal) {
			closeSessionExpiredModal();
		}
		if (onContinuar) {
			onContinuar();
		}
		if (onClose) {
			onClose();
		}
	};

	const handleExit = () => {
		if (closeSessionExpiredModal) {
			closeSessionExpiredModal();
		}
		if (onCerrarSesion) {
			onCerrarSesion();
		} else {
			logout();
		}
	};

	return (
		<div className="fixed inset-0 bg-overlay backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-surface border-4 border-borderCustom rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl flex flex-col items-center text-center gap-6 animate-scale-up">
				{/* Encabezado Decorativo */}
				<div className="p-4 bg-brand/10 border-4 border-brand rounded-full text-brand">
					<Clock size={48} />
				</div>

				<div className="flex flex-col gap-2">
					<span className="text-xs font-black text-brand tracking-widest uppercase">
						Tiempo de Laboratorio Cumplido
					</span>
					<h2 className="text-2xl sm:text-3xl font-black text-primary">
						¡Sesión de Aula Finalizada!
					</h2>
					<p className="text-secondary font-medium text-sm sm:text-base mt-1">
						Han transcurrido las 1.5 horas de uso continuo fijadas para el estudiante.
					</p>
				</div>

				{/* Nota Informativa Docente */}
				<div className="flex items-start gap-3 bg-app border-2 border-borderCustom rounded-2xl p-4 text-left w-full">
					<Info className="text-brand shrink-0 mt-0.5" size={20} />
					<p className="text-xs sm:text-sm text-secondary font-medium">
						<strong className="text-primary font-bold">Nota para el docente:</strong> Tu sesión continúa activa. Puedes seleccionar otro alumno o reactivar al mismo estudiante en el mosaico.
					</p>
				</div>

				{/* Botones de Acción */}
				<div className="flex flex-col gap-3 w-full mt-2">
					<Button
						onClick={handleConfirm}
						className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand text-onBrand font-black text-base rounded-2xl shadow-lg border-2 border-brand-hover hover:opacity-90 active:scale-95 transition-all cursor-pointer"
					>
						Volver al Mosaico de Alumnos
						<ArrowRight size={20} />
					</Button>

					{onCerrarSesion && (
						<button
							onClick={handleExit}
							className="text-xs sm:text-sm text-secondary hover:text-statusDanger font-bold py-2 transition-colors cursor-pointer"
						>
							Cerrar Sesión Definitivamente
						</button>
					)}
				</div>
			</div>
		</div>
	);
};