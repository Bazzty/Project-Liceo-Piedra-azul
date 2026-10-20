import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, HelpCircle, Lock, Palette, School } from 'lucide-react';
import { ROUTES } from '@/app/routes';
import { TarjetaIlustrada } from '@/features/acceso/components/TarjetaIlustrada';
import { OsoBurbuja } from '@/shared/components/OsoBurbuja';
import { getPersonajeAudio } from '@/shared/config/audioConfig';
import { THEMES_CONFIG } from '@/shared/config/themes';
import { useAplicarTema } from '@/shared/hooks/useAplicarTema';
import { useThemeStore, type ThemeId } from '@/shared/store/useThemeStore';
import { Modal, OptionButton } from '@/shared/ui';

const BOTON_SUPERIOR =
  'inline-flex items-center gap-2 min-h-12 px-4 rounded-control border-2 border-onBrand/50 text-onBrand font-bold text-sm cursor-pointer hover:bg-onBrand/15 transition-colors';

/**
 * Portada pensada para quien aún no sabe leer: el osito habla al tocarlo y la única
 * acción grande es una tarjeta dibujada. El acceso docente queda discreto, arriba.
 */
export const InicioView: React.FC = () => {
  useAplicarTema();
  const navigate = useNavigate();
  const { currentTheme, setTheme } = useThemeStore();
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const [paletaAbierta, setPaletaAbierta] = useState(false);

  return (
    <div className="relative overflow-hidden min-h-screen bg-brand text-onBrand flex flex-col">
      <div className="absolute -top-28 -right-20 w-96 h-96 rounded-full bg-onBrand/10" aria-hidden />
      <div className="absolute -bottom-40 -left-24 w-[28rem] h-[28rem] rounded-full bg-onBrand/10" aria-hidden />

      <nav className="relative w-full max-w-5xl mx-auto px-4 pt-5 flex items-center justify-between gap-3" aria-label="Principal">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-control bg-onBrand/15 border-2 border-onBrand/40 flex items-center justify-center" aria-hidden>
            <BookOpen className="w-7 h-7" />
          </span>
          <div className="leading-tight">
            <p className="text-xl font-black">Leer para Todos</p>
            <p className="text-sm font-bold hidden sm:block">Liceo Piedra Azul · Puerto Montt</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className={BOTON_SUPERIOR} onClick={() => setPaletaAbierta(true)}>
            <Palette className="w-5 h-5" aria-hidden />
            <span className="sr-only">Colores</span>
          </button>
          <button type="button" className={BOTON_SUPERIOR} onClick={() => setAyudaAbierta(true)}>
            <HelpCircle className="w-5 h-5" aria-hidden />
            <span className="sr-only">Ayuda</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 min-h-12 px-3 rounded-control text-onBrand font-bold text-sm cursor-pointer underline-offset-4 hover:underline"
            onClick={() => navigate(ROUTES.profesorLogin)}
          >
            <Lock className="w-4 h-4" aria-hidden />
            <span className="hidden sm:inline">Acceso docente</span>
            <span className="sr-only sm:hidden">Acceso docente</span>
          </button>
        </div>
      </nav>

      <main className="relative flex-1 w-full max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16">
        <OsoBurbuja mensaje="¡Hola!" audioUrl={getPersonajeAudio('bienvenida')} size="lg" />

        <div className="flex flex-col items-center gap-5 w-full max-w-sm">
          <h1 className="text-5xl font-black text-center">¡Vamos a leer!</h1>

          <button
            type="button"
            onClick={() => navigate(ROUTES.casaLogin)}
            aria-label="Entrar con mi tarjeta"
            className="group w-full flex flex-col items-center gap-4 p-6 rounded-card bg-surface text-primary border-4 border-accent shadow-card cursor-pointer transition-transform hover:-translate-y-1 active:translate-y-0"
          >
            <TarjetaIlustrada className="w-56 max-w-full" />
            <span className="w-full min-h-16 inline-flex items-center justify-center gap-3 rounded-control bg-brand text-onBrand text-3xl font-black group-hover:bg-brand-hover">
              Entrar
              <ArrowRight className="w-8 h-8" aria-hidden />
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate(ROUTES.aulaEspera)}
            className="inline-flex items-center justify-center gap-2 min-h-12 px-5 rounded-control border-2 border-onBrand/60 text-onBrand font-bold text-base cursor-pointer hover:bg-onBrand/15 transition-colors"
          >
            <School className="w-5 h-5" aria-hidden />
            Estoy en el laboratorio
          </button>
        </div>
      </main>

      <footer className="relative px-4 pb-6 text-center text-sm font-semibold">
        Prototipo de demostración · Datos ficticios
      </footer>

      <Modal isOpen={ayudaAbierta} onClose={() => setAyudaAbierta(false)} title="Ayuda" size="sm">
        <ol className="flex flex-col gap-4 p-2 list-decimal list-inside text-lg font-semibold text-primary">
          <li>Toca al osito para escucharlo.</li>
          <li>Toca <strong>Entrar</strong> y escribe el número de tu tarjeta.</li>
          <li>Si eres docente, usa <strong>Acceso docente</strong>, arriba.</li>
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
    </div>
  );
};
