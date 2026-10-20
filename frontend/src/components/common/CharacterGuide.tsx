import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2 } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { getPersonajeAudio } from '@/config/audioConfig';

// 1. DICCIONARIO DE FONEMAS A VISEMAS
const MOUTH_MAP: Record<string, string> = {
	a: 'AEI', e: 'AEI', i: 'AEI', á: 'AEI', é: 'AEI', í: 'AEI',
	o: 'O', ó: 'O', u: 'U', ú: 'U',
	b: 'BMP', m: 'BMP', p: 'BMP',
	f: 'FV', v: 'FV',
	l: 'L', r: 'L',
	c: 'CDNS', d: 'CDNS', n: 'CDNS', s: 'CDNS', t: 'CDNS', z: 'CDNS', x: 'CDNS', y: 'CDNS',
	g: 'GK', k: 'GK', q: 'WQ', w: 'WQ',
	j: 'CH_J_SH',
	' ': 'NEUTRAL', '.': 'NEUTRAL', ',': 'NEUTRAL', '!': 'NEUTRAL', '?': 'NEUTRAL',
};

// 2. COORDENADAS DEL SPRITE SHEET (3 filas x 5 columnas)
const SPRITE_MAP: Record<string, { x: number; y: number }> = {
	'AEI': { x: 0, y: 0 },
	'TH': { x: 1, y: 0 },
	'O': { x: 2, y: 0 },
	'EE': { x: 3, y: 0 },
	'NEUTRAL': { x: 4, y: 0 },
	'HAPPY': { x: 0, y: 1 },
	'U': { x: 1, y: 1 },
	'BMP': { x: 2, y: 1 },
	'L': { x: 3, y: 1 },
	'FV': { x: 4, y: 1 },
	'CH_J_SH': { x: 0, y: 2 },
	'CDNS': { x: 1, y: 2 },
	'GK': { x: 2, y: 2 },
	'WQ': { x: 3, y: 2 },
	'REPOSO': { x: 4, y: 2 },
};

const parseTextToMouthCues = (text: string, speedFactor: number = 1.0) => {
	const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
	const cues: { viseme: string; duration: number }[] = [];
	for (let i = 0; i < normalized.length; i++) {
		const char = normalized[i];
		const viseme = MOUTH_MAP[char] || 'NEUTRAL';
		let duration = 70 * speedFactor;
		if (['a', 'e', 'i', 'o', 'u', 'á', 'é', 'í', 'ó', 'ú'].includes(char)) {
			duration = 140 * speedFactor;
		} else if (['.', '!', '?'].includes(char)) {
			duration = 250 * speedFactor;
		} else if ([',', ' '].includes(char)) {
			duration = 100 * speedFactor;
		}
		if (cues.length > 0 && cues[cues.length - 1].viseme === viseme) {
			cues[cues.length - 1].duration += duration;
		} else {
			cues.push({ viseme, duration });
		}
	}
	cues.push({ viseme: 'NEUTRAL', duration: 100 });
	return cues;
};

export interface CharacterGuideProps {
	mensaje: string;
	audioUrl?: string;
	className?: string;
	variant?: 'compact' | 'large';
}

export const CharacterGuide: React.FC<CharacterGuideProps> = ({
	mensaje,
	audioUrl,
	className = '',
	variant = 'compact',
}) => {
	const { playAudio, currentAudioUrl } = usePlayerStore();
	const [currentViseme, setCurrentViseme] = useState('NEUTRAL');
	const [imageError, setImageError] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const baseUrl = import.meta.env.BASE_URL || '/';
	const cabezaUrl = `${baseUrl}assets/personajes/oso/cabeza_base.png`.replace(/\/\//g, '/');
	const spriteUrl = `${baseUrl}assets/personajes/oso/bocas_sprite.png`.replace(/\/\//g, '/');

	const stopLipSync = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		setCurrentViseme('NEUTRAL');
	}, []);

	useEffect(() => {
		return () => stopLipSync();
	}, [stopLipSync]);

	useEffect(() => {
		if (audioUrl && currentAudioUrl !== audioUrl) {
			stopLipSync();
		}
	}, [currentAudioUrl, audioUrl, stopLipSync]);

	const runLipSync = useCallback((text: string) => {
		stopLipSync();
		const cues = parseTextToMouthCues(text, 1.0);
		let index = 0;

		const playNextCue = () => {
			if (index >= cues.length) {
				stopLipSync();
				return;
			}
			const cue = cues[index];
			setCurrentViseme(cue.viseme);
			index++;
			timeoutRef.current = setTimeout(playNextCue, cue.duration);
		};

		playNextCue();
	}, [stopLipSync]);

	const handleSpeak = () => {
		runLipSync(mensaje);
		const targetAudio = audioUrl || getPersonajeAudio('bienvenida');
		playAudio(targetAudio);
	};

	const SPRITE_OFFSETS_X: Record<string, number> = {
		'AEI': -3, 'TH': -2, 'O': 0, 'EE': -3, 'NEUTRAL': 0, 'HAPPY': 0, 'U': 0,
		'BMP': 0, 'L': -4, 'FV': 0, 'CH_J_SH': 0, 'CDNS': 0, 'GK': -1, 'WQ': -2, 'REPOSO': 0,
	};

	const coords = SPRITE_MAP[currentViseme] || SPRITE_MAP['NEUTRAL'];

	const renderAvatar = (sizeClasses: string) => {
		const offsetX = SPRITE_OFFSETS_X[currentViseme] || 0;
		return (
      <div className={`relative rounded-full overflow-hidden shrink-0 ${sizeClasses} bg-brand/10 border-2 border-brand/30`}>
        {!imageError ? (
          <>
            <img 
              src={cabezaUrl} 
              alt="Guía Oso" 
              onError={(e) => {
                console.error('❌ Error al cargar cabeza_base:', e.currentTarget.src);
                setImageError(true);
              }}
              className="absolute inset-0 w-full h-full object-contain"
            />
            
            <div 
              className="absolute top-[40%] left-[26%] w-[50%] h-[50%] overflow-hidden"
              style={{ clipPath: 'inset(0 0 18% 0)' }}
            >
              <img 
                src={spriteUrl}
                alt="Bocas Animadas"
                className="absolute top-0 left-0 max-w-none transition-none"
                style={{
                  width: '500%',
                  height: '300%',
                  // Sumamos el porcentaje matemático + los píxeles de corrección manual
                  transform: `translate(calc(-${coords.x * 20}% + ${offsetX}px), -${coords.y * 33.333}%)`
                }}
              />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            🐻
          </div>
        )}
      </div>
    );
  };

  if (variant === 'large') {
    return (
      <div className={`flex flex-col items-center justify-center bg-surface/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-xl border-2 border-borderCustom text-center h-full ${className}`}>
        <div 
          role="button"
          tabIndex={0}
          onClick={handleSpeak}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSpeak()}
          className="cursor-pointer hover:scale-105 transition-transform mb-4"
          title="Toca para escuchar"
        >
          {renderAvatar('w-24 h-24 sm:w-32 sm:h-32')}
        </div>

        <div className="bg-app border-2 border-borderCustom rounded-2xl p-4 shadow-sm w-full relative mb-4">
          <p className="text-primary text-base sm:text-lg font-bold leading-relaxed">
            "{mensaje}"
          </p>
        </div>

        <button
          onClick={handleSpeak}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white font-bold text-sm rounded-2xl shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer"
        >
          <Volume2 className="w-4 h-4" />
          <span>TOCA PARA ESCUCHAR</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div 
        role="button"
        tabIndex={0}
        onClick={handleSpeak}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleSpeak();
          }
        }}
        className="group relative cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-brand rounded-full transition-transform hover:scale-105 active:scale-95"
        title="Escuchar mensaje"
      >
        {renderAvatar('w-16 h-16 sm:w-20 sm:h-20')}
        <div className="absolute -bottom-1 -right-1 bg-surface p-1 rounded-full shadow-md text-brand border border-borderCustom group-hover:bg-brand group-hover:text-white transition-colors">
          <Volume2 className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="flex-1 bg-surface border-2 border-borderCustom rounded-2xl p-4 shadow-sm relative">
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-surface border-l-2 border-b-2 border-borderCustom transform rotate-45" />
        
        <p className="text-primary text-base sm:text-lg font-semibold leading-relaxed">
          "{mensaje}"
        </p>
      </div>
    </div>
  );
};