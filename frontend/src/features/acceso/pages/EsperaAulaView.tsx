import React, { useEffect } from 'react';
import { Button } from '@/shared/ui';
import { ArrowLeft, Clock } from 'lucide-react';
import { MainLayout } from '@/shared/layouts/MainLayout';
import { CharacterGuide } from '@/shared/components/CharacterGuide';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { getPersonajeAudio } from '@/shared/config/audioConfig';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes';

export const EsperaAulaView: React.FC = () => {
	const { isClassroomSessionActive, checkClassroomStatus } = useAuthStore();
	const navigate = useNavigate();

	useEffect(() => {
		const handleStorageChange = () => {
			checkClassroomStatus();
		};

		window.addEventListener('storage', handleStorageChange);
		const interval = setInterval(checkClassroomStatus, 1000);

		if (isClassroomSessionActive) {
			navigate(ROUTES.aulaAlumnos, { replace: true });
		}

		return () => {
			window.removeEventListener('storage', handleStorageChange);
			clearInterval(interval);
		};
	}, [isClassroomSessionActive, navigate, checkClassroomStatus]);

	return (
		<MainLayout>
			<div className="flex flex-col items-center justify-center min-h-[85vh] p-4 gap-6">
				<Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.inicio)} className="self-start">
					<ArrowLeft className="w-4 h-4" />
					VOLVER
				</Button>

				<div className="flex flex-col items-center justify-center gap-6 max-w-md w-full bg-surface border-4 border-borderCustom rounded-3xl p-6 sm:p-8 shadow-xl text-center">
					<div className="p-4 bg-brand/10 border-4 border-brand rounded-full animate-pulse text-brand">
						<Clock size={48} />
					</div>

					<div className="flex flex-col gap-2">
						<h2 className="text-2xl font-black text-primary">Esperando a la profesora</h2>
						<p className="text-secondary font-medium text-sm sm:text-base">
							Pronto comenzaremos la clase. En cuanto se active, ingresaremos al laboratorio.
						</p>
					</div>

					<CharacterGuide
						mensaje="Estoy esperando a que la profesora active la sesión. ¡Ya casi comenzamos!"
						audioUrl={getPersonajeAudio('espera')}
						variant="compact"
					/>
				</div>
			</div>
		</MainLayout>
	);
};