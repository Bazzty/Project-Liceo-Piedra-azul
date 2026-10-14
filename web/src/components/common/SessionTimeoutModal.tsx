import React from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
import { Modal } from './Modal';
import { CharacterGuide } from './CharacterGuide';
import { getPersonajeAudio } from '../../config/audioConfig';

export interface SessionTimeoutModalProps {
	isOpen: boolean;
	onContinuar: () => void;
	onCerrarSesion: () => void;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
	isOpen,
	onContinuar,
	onCerrarSesion,
}) => {
	return (
		<Modal isOpen={isOpen} onClose={onContinuar} title="Inactividad detectada" size="compact">
			<div className="flex flex-col items-center gap-6 p-2 text-center">
				<CharacterGuide
					mensaje="¿Sigues ahí? Llevamos un ratito sin interactuar. ¿Deseas continuar leyendo o prefieres descansar?"
					audioUrl={getPersonajeAudio('espera')}
					variant="compact"
				/>

				<div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
					<button
						onClick={onContinuar}
						className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand text-white font-black rounded-2xl shadow-md border-2 border-brand-hover hover:opacity-90 active:scale-95 transition-all cursor-pointer text-sm"
					>
						<RefreshCw size={18} />
						CONTINUAR LEYENDO
					</button>
					<button
						onClick={onCerrarSesion}
						className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-app text-secondary font-black rounded-2xl shadow-sm border-2 border-borderCustom hover:border-red-400 hover:text-red-500 active:scale-95 transition-all cursor-pointer text-sm"
					>
						<LogOut size={18} />
						GUARDAR Y SALIR
					</button>
				</div>
			</div>
		</Modal>
	);
};