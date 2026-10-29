import React from 'react';
import { THEMES_CONFIG } from '@/shared/config/themes';
import { useThemeStore, type ThemeId } from '@/shared/store/useThemeStore';
import { Modal, OptionButton } from '@/shared/ui';

/** Ventana para elegir la paleta de colores; el cambio se aplica al instante. */
export const SelectorPaleta: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentTheme, setTheme } = useThemeStore();
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Colores de la pantalla" size="sm">
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
  );
};
