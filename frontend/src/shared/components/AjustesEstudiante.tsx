import React from 'react';
import { ListMinus, Move, MousePointerClick, Rabbit, Rows2, Turtle, Volume2, VolumeX, Zap } from 'lucide-react';
import { THEMES_CONFIG } from '@/shared/config/themes';
import { useAjustesStore } from '@/shared/store/useAjustesStore';
import { useThemeStore, type ThemeId } from '@/shared/store/useThemeStore';
import { Interruptor, Modal, OptionButton } from '@/shared/ui';

/** Ajustes del niño: colores, sonido, movimiento y velocidad de la voz. Todo con ícono y una palabra. */
export const AjustesEstudiante: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentTheme, setTheme } = useThemeStore();
  const { sonido, movimiento, vozLenta, barrido, pocasOpciones, setSonido, setMovimiento, setVozLenta, setBarrido, setPocasOpciones } = useAjustesStore();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mis ajustes" size="sm">
      <div className="flex flex-col gap-5 p-2">
        <section className="flex flex-col gap-3" aria-label="Colores">
          <h4 className="text-lg font-black text-primary">Colores</h4>
          <div role="radiogroup" aria-label="Paleta de colores" className="grid grid-cols-2 gap-3">
            {THEMES_CONFIG.map((tema) => (
              <OptionButton
                key={tema.id}
                selected={currentTheme === tema.id}
                onClick={() => setTheme(tema.id as ThemeId)}
                className="flex items-center gap-2 px-3 py-3 font-extrabold text-left"
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
        </section>

        <section className="flex flex-col gap-3" aria-label="Sonido y movimiento">
          <Interruptor
            activo={sonido}
            onChange={setSonido}
            etiqueta="Sonido"
            icono={sonido ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
          />
          <Interruptor
            activo={movimiento}
            onChange={setMovimiento}
            etiqueta="Movimiento"
            icono={movimiento ? <Zap aria-hidden /> : <Move aria-hidden />}
          />
          <Interruptor
            activo={vozLenta}
            onChange={setVozLenta}
            etiqueta="Voz lenta"
            icono={vozLenta ? <Turtle aria-hidden /> : <Rabbit aria-hidden />}
          />
          <Interruptor
            activo={barrido}
            onChange={setBarrido}
            etiqueta="Un botón"
            icono={<MousePointerClick aria-hidden />}
          />
          <Interruptor
            activo={pocasOpciones}
            onChange={setPocasOpciones}
            etiqueta="Pocas opciones"
            icono={pocasOpciones ? <Rows2 aria-hidden /> : <ListMinus aria-hidden />}
          />
        </section>
      </div>
    </Modal>
  );
};
