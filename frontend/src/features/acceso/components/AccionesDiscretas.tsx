import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Lock, Palette } from 'lucide-react';
import { ROUTES } from '@/app/routes';
import { THEMES_CONFIG } from '@/shared/config/themes';
import { useThemeStore, type ThemeId } from '@/shared/store/useThemeStore';
import { Modal, OptionButton } from '@/shared/ui';

const ICONO =
  'inline-flex items-center justify-center min-h-12 min-w-12 rounded-control border-2 border-borderStrong bg-surface text-primary cursor-pointer hover:border-brand transition-colors';

/** Colores, ayuda y acceso docente: controles pequeños y discretos que no compiten con la acción del niño. */
export const AccionesDiscretas: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme, setTheme } = useThemeStore();
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const [paletaAbierta, setPaletaAbierta] = useState(false);

  return (
    <>
      <nav className="flex items-center gap-2" aria-label="Opciones">
        <button type="button" className={ICONO} onClick={() => setPaletaAbierta(true)}>
          <Palette className="w-5 h-5" aria-hidden />
          <span className="sr-only">Colores</span>
        </button>
        <button type="button" className={ICONO} onClick={() => setAyudaAbierta(true)}>
          <HelpCircle className="w-5 h-5" aria-hidden />
          <span className="sr-only">Ayuda</span>
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 min-h-12 px-3 rounded-control text-secondary text-sm font-bold cursor-pointer underline-offset-4 hover:text-brand hover:underline"
          onClick={() => navigate(ROUTES.profesorLogin)}
        >
          <Lock className="w-4 h-4" aria-hidden />
          <span className="hidden sm:inline">Acceso docente</span>
          <span className="sr-only sm:hidden">Acceso docente</span>
        </button>
      </nav>

      <Modal isOpen={ayudaAbierta} onClose={() => setAyudaAbierta(false)} title="Ayuda" size="sm">
        <ol className="flex flex-col gap-4 p-2 list-decimal list-inside text-lg font-semibold text-primary">
          <li>Toca al osito para escucharlo.</li>
          <li>Toca los números de tu tarjeta.</li>
          <li>Toca la palomita (✓) para entrar.</li>
          <li>Si eres docente, usa <strong>Acceso docente</strong>.</li>
        </ol>
      </Modal>

      <Modal isOpen={paletaAbierta} onClose={() => setPaletaAbierta(false)} title="Colores de la pantalla" size="sm">
        <div role="radiogroup" aria-label="Paleta de colores" className="flex flex-col gap-3 p-2">
          {THEMES_CONFIG.map((tema) => (
            <OptionButton
              key={tema.id}
              selected={currentTheme === tema.id}
              onClick={() => setTheme(tema.id as ThemeId)}
              className="flex items-center gap-3 px-4 py-3 font-extrabold text-left text-lg"
            >
              <span
                className="w-7 h-7 rounded-full border-2 border-borderStrong shrink-0"
                style={{ backgroundColor: tema.colorPreviewHex }}
                aria-hidden
              />
              {tema.nombre}
            </OptionButton>
          ))}
        </div>
      </Modal>
    </>
  );
};
