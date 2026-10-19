import React, { useEffect } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { CharacterGuide } from '../components/common/CharacterGuide';
import { useAuthStore } from '../store/useAuthStore';
import { getPersonajeAudio } from '../config/audioConfig';

export const EsperaAulaView: React.FC = () => {
	const { setVistaInicio1, isClassroomSessionActive, checkClassroomStatus } = useAuthStore();

	useEffect(() => {
		const handleStorageChange = () => {
			checkClassroomStatus();
		};

		window.addEventListener('storage', handleStorageChange);
		const interval = setInterval(checkClassroomStatus, 1000);

		if (isClassroomSessionActive) {
			setVistaInicio1('aula-mosaico');
		}

		return () => {
			window.removeEventListener('storage', handleStorageChange);
			clearInterval(interval);
		};
	}, [isClassroomSessionActive, setVistaInicio1, checkClassroomStatus]);

	return (
		<MainLayout>
			<div className="flex flex-col items-center justify-center min-h-[85vh] p-4 gap-6">
				<button
					onClick={() => setVistaInicio1('portal')}
					className="flex items-center gap-2 bg-surface px-4 py-2 rounded-2xl border-2 border-borderCustom font-black text-primary hover:border-brand transition-all active:scale-95 self-start cursor-pointer shadow"
				>
					<ArrowLeft size={20} />
					VOLVER
				</button>

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