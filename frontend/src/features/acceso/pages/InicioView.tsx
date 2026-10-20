import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, GraduationCap, HelpCircle, Palette, School, Smile } from 'lucide-react';
import { ROUTES } from '@/app/routes';
import { THEMES_CONFIG } from '@/shared/config/themes';
import { useAplicarTema } from '@/shared/hooks/useAplicarTema';
import { useThemeStore, type ThemeId } from '@/shared/store/useThemeStore';
import { Button, Modal, OptionButton } from '@/shared/ui';

const BASE = import.meta.env.BASE_URL || '/';

const BOTON_SUPERIOR =
  'inline-flex items-center gap-2 min-h-12 px-4 rounded-control border-2 border-onBrand/50 text-onBrand font-bold text-sm cursor-pointer hover:bg-onBrand/15 transition-colors';

interface EntradaProps {
  icono: React.ReactNode;
  titulo: string;
  descripcion: string;
  destacada?: boolean;
  onClick: () => void;
}

/** Tarjeta de entrada grande: toda la tarjeta es el botón. */
const Entrada: React.FC<EntradaProps> = ({ icono, titulo, descripcion, destacada = false, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group text-left flex flex-col gap-5 p-6 sm:p-8 rounded-card border-2 bg-surface shadow-card cursor-pointer transition-all hover:-translate-y-1 active:translate-y-0 ${
      destacada ? 'border-brand' : 'border-borderStrong'
    }`}
  >
    <span
      className={`w-16 h-16 rounded-control flex items-center justify-center ${
        destacada ? 'bg-brand text-onBrand' : 'bg-app text-primary border-2 border-borderStrong'
      }`}
      aria-hidden
    >
      {icono}
    </span>
    <span className="flex flex-col gap-1">
      <span className="text-3xl font-black text-primary">{titulo}</span>
      <span className="text-lg font-semibold text-secondary">{descripcion}</span>
    </span>
    <span
      className={`mt-auto inline-flex items-center justify-between gap-2 min-h-12 px-5 rounded-control font-extrabold text-base ${
        destacada ? 'bg-brand text-onBrand group-hover:bg-brand-hover' : 'bg-app text-primary border-2 border-borderStrong group-hover:border-brand'
      }`}
    >
      Entrar
      <ArrowRight className="w-5 h-5" aria-hidden />
    </span>
  </button>
);

export const InicioView: React.FC = () => {
  useAplicarTema();
  const navigate = useNavigate();
  const { currentTheme, setTheme } = useThemeStore();
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const [paletaAbierta, setPaletaAbierta] = useState(false);

  return (
    <div className="min-h-screen bg-app text-primary flex flex-col">
      {/* Banda de marca */}
      <header className="relative overflow-hidden bg-brand text-onBrand rounded-b-[2.5rem] pb-28 sm:pb-32">
        <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-onBrand/10" aria-hidden />
        <div className="absolute top-32 -left-24 w-72 h-72 rounded-full bg-onBrand/10" aria-hidden />

        <div className="relative max-w-5xl mx-auto px-4 pt-5 flex flex-col gap-8">
          <nav className="flex items-center justify-between gap-3" aria-label="Principal">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-control bg-onBrand/15 border-2 border-onBrand/40 flex items-center justify-center" aria-hidden>
                <BookOpen className="w-7 h-7" />
              </span>
              <div className="leading-tight">
                <p className="text-xl font-black">Leer para Todos</p>
                <p className="text-sm font-bold">Liceo Piedra Azul · Puerto Montt</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className={BOTON_SUPERIOR} onClick={() => setPaletaAbierta(true)}>
                <Palette className="w-5 h-5" aria-hidden />
                <span className="hidden sm:inline">Colores</span>
                <span className="sr-only sm:hidden">Colores</span>
              </button>
              <button type="button" className={BOTON_SUPERIOR} onClick={() => setAyudaAbierta(true)}>
                <HelpCircle className="w-5 h-5" aria-hidden />
                <span className="hidden sm:inline">Ayuda</span>
                <span className="sr-only sm:hidden">Ayuda</span>
              </button>
            </div>
          </nav>

          <div className="flex flex-col-reverse md:flex-row items-center md:justify-between gap-8">
            <div className="flex flex-col gap-3 text-center md:text-left max-w-xl">
              <h1 className="text-4xl sm:text-5xl font-black leading-tight">Aprendemos a leer juntos</h1>
              <p className="text-xl font-semibold">Cuentos con letras, dibujos y voz para cada estudiante.</p>
            </div>
            <div className="flex flex-col items-center gap-4 shrink-0">
              <div className="relative bg-surface text-primary rounded-card shadow-card px-5 py-3 text-center">
                <p className="text-xl font-black">¡Hola! ¿Quién va a leer hoy?</p>
                <span className="absolute left-1/2 -bottom-2 w-4 h-4 -translate-x-1/2 rotate-45 bg-surface" aria-hidden />
              </div>
              <img
                src={`${BASE}assets/personajes/oso/cabeza_base.png`.replace(/\/\//g, '/')}
                alt="Osito, tu guía de lectura, saludando"
                className="w-32 h-32 sm:w-40 sm:h-40 object-contain bg-surface rounded-full border-4 border-onBrand/60 p-2"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Entradas, montadas sobre la banda */}
      <main className="relative flex-1 w-full max-w-4xl mx-auto px-4 -mt-16 sm:-mt-20 flex flex-col gap-6 pb-10">
        <h2 className="sr-only">¿Cómo quieres entrar?</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <Entrada
              destacada
              icono={<Smile className="w-9 h-9" />}
              titulo="Soy estudiante"
              descripcion="Entra con tu tarjeta y lee tus cuentos."
              onClick={() => navigate(ROUTES.casaLogin)}
            />
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.aulaEspera)} className="self-center">
              <School className="w-4 h-4" aria-hidden />
              Estoy en el laboratorio del colegio
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            <Entrada
              icono={<GraduationCap className="w-9 h-9" />}
              titulo="Soy docente"
              descripcion="Mira el avance del curso y prepara cuentos."
              onClick={() => navigate(ROUTES.profesorLogin)}
            />
          </div>
        </div>
      </main>

      <footer className="px-4 pb-8 text-center text-sm font-semibold text-secondary">
        Prototipo de demostración · Datos ficticios · Proyecto Leer para Todos
      </footer>

      <Modal isOpen={ayudaAbierta} onClose={() => setAyudaAbierta(false)} title="Ayuda" size="sm">
        <ol className="flex flex-col gap-4 p-2 list-decimal list-inside text-lg font-semibold text-primary">
          <li>Si eres estudiante, toca <strong>Soy estudiante</strong>.</li>
          <li>Escribe el número de tu tarjeta.</li>
          <li>Si eres docente, toca <strong>Soy docente</strong>.</li>
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
