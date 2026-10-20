import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, MessageCircle, Palette, Star, Volume2 } from 'lucide-react';
import { useAlumno, useProgresosDeAlumno } from '@/api';
import { ROUTES } from '@/app/routes';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { TableroSAAC } from '@/features/tablero/components/TableroSAAC';
import { FondoPaisaje } from '@/shared/components/FondoPaisaje';
import { OsoBurbuja } from '@/shared/components/OsoBurbuja';
import { SelectorPaleta } from '@/shared/components/SelectorPaleta';
import { useAplicarTema } from '@/shared/hooks/useAplicarTema';
import { useHablar } from '@/shared/hooks/useHablar';
import { Modal } from '@/shared/ui';

const ESTILOS = {
  leer: 'bg-btnAprender-bg text-btnAprender-text border-btnAprender-border',
  hablar: 'bg-btnHablar-bg text-btnHablar-text border-btnHablar-border',
  estrellas: 'bg-btnLogros-bg text-btnLogros-text border-btnLogros-border',
  salir: 'bg-surface text-primary border-borderStrong',
} as const;

interface OpcionProps {
  orden: number;
  estilo: keyof typeof ESTILOS;
  icono: React.ReactNode;
  titulo: string;
  onClick: () => void;
}

/** Botón grande del menú: dibujo + una palabra. El parlante dice la palabra en voz alta. */
const Opcion: React.FC<OpcionProps> = ({ orden, estilo, icono, titulo, onClick }) => {
  const hablar = useHablar();
  return (
    <div className="relative animate-aparecer" style={{ animationDelay: `${orden * 120}ms` }}>
      <button
        type="button"
        onClick={onClick}
        className={`group w-full h-40 sm:h-60 lg:h-[17rem] rounded-card border-b-8 flex flex-col items-center justify-center gap-2 sm:gap-3 shadow-card cursor-pointer transition-transform hover:-translate-y-2 hover:scale-[1.03] active:translate-y-0 active:scale-95 ${ESTILOS[estilo]} ${estilo === 'salir' ? 'border-2 border-b-8' : ''}`}
      >
        <span className="group-hover:animate-girar [&>svg]:w-14 [&>svg]:h-14 sm:[&>svg]:w-24 sm:[&>svg]:h-24 lg:[&>svg]:w-28 lg:[&>svg]:h-28" aria-hidden>
          {icono}
        </span>
        <span className="text-2xl sm:text-4xl lg:text-5xl font-black">{titulo}</span>
      </button>
      <button
        type="button"
        onClick={() => hablar(titulo)}
        aria-label={`Escuchar: ${titulo}`}
        className="absolute top-3 right-3 w-12 h-12 rounded-full bg-onBrand/20 flex items-center justify-center cursor-pointer hover:bg-onBrand/35 text-current"
        style={{ color: estilo === 'salir' ? 'var(--text-primary)' : 'inherit' }}
      >
        <Volume2 className="w-6 h-6" aria-hidden />
      </button>
    </div>
  );
};

/** Inicio del estudiante: cuatro botones grandes con dibujo, voz y una sola palabra. */
export const VistaPrincipal: React.FC = () => {
  useAplicarTema();
  const navigate = useNavigate();
  const hablar = useHablar();
  const { activeStudentId, logout } = useAuthStore();
  const alumno = useAlumno(activeStudentId);
  const progresos = useProgresosDeAlumno(activeStudentId);
  const [hablarAbierto, setHablarAbierto] = useState(false);
  const [estrellasAbierto, setEstrellasAbierto] = useState(false);
  const [paletaAbierta, setPaletaAbierta] = useState(false);

  const nombre = alumno?.nombre ?? 'amigo';
  const leidos = (progresos ?? []).filter((p) => p.completado).length;
  const TOTAL_ESTRELLAS = 8;

  const salir = () => {
    logout();
    navigate(ROUTES.inicio);
  };

  return (
    <div className="relative overflow-hidden min-h-screen bg-app text-primary flex flex-col">
      <FondoPaisaje />
      <header className="relative bg-surface border-b-2 border-borderCustom px-4 sm:px-8 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {alumno?.avatarUrl ? (
            <img src={alumno.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover border-[3px] border-brand" />
          ) : (
            <span className="w-14 h-14 rounded-full bg-accent border-[3px] border-brand flex items-center justify-center text-2xl font-black text-onAccent" aria-hidden>
              {nombre.charAt(0).toUpperCase()}
            </span>
          )}
          <p className="text-2xl sm:text-3xl font-black">{nombre}</p>
        </div>
        <button
          type="button"
          onClick={() => setPaletaAbierta(true)}
          className="inline-flex items-center justify-center min-h-12 min-w-12 rounded-control border-2 border-borderStrong bg-surface text-primary cursor-pointer hover:border-brand"
        >
          <Palette className="w-5 h-5" aria-hidden />
          <span className="sr-only">Colores</span>
        </button>
      </header>

      <main className="relative flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:py-10 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-14">
        <div className="bg-brand rounded-card p-6 sm:p-8 lg:p-10 shrink-0 shadow-card">
          <OsoBurbuja mensaje="¿Qué hacemos?" size="lg" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-4xl">
          <Opcion orden={0} estilo="leer" titulo="Leer" icono={<BookOpen strokeWidth={1.8} />} onClick={() => navigate(ROUTES.aprender)} />
          <Opcion orden={1} estilo="hablar" titulo="Hablar" icono={<MessageCircle strokeWidth={1.8} />} onClick={() => setHablarAbierto(true)} />
          <Opcion
            orden={2}
            estilo="estrellas"
            titulo="Mis estrellas"
            icono={<Star strokeWidth={1.6} className="fill-accent" />}
            onClick={() => setEstrellasAbierto(true)}
          />
          <Opcion orden={3} estilo="salir" titulo="Salir" icono={<LogOut strokeWidth={1.8} />} onClick={salir} />
        </div>
      </main>

      <Modal isOpen={hablarAbierto} onClose={() => setHablarAbierto(false)} title="Hablar" size="full">
        <TableroSAAC />
      </Modal>

      <Modal isOpen={estrellasAbierto} onClose={() => setEstrellasAbierto(false)} title="Mis estrellas" size="sm">
        <div className="flex flex-col items-center gap-5 p-4 text-center">
          <div className="flex flex-wrap justify-center gap-2" role="img" aria-label={`${leidos} estrellas de ${TOTAL_ESTRELLAS}`}>
            {Array.from({ length: TOTAL_ESTRELLAS }, (_, i) => (
              <Star
                key={i}
                aria-hidden
                className={`w-12 h-12 animate-pop ${i < leidos ? 'fill-accent text-brand' : 'text-borderStrong'}`}
                style={{ animationDelay: `${i * 90}ms`, animationFillMode: 'backwards' }}
                strokeWidth={1.8}
              />
            ))}
          </div>
          <p className="text-3xl font-black text-primary">
            {leidos === 0 ? '¡Vamos por tu primera estrella!' : `¡Tienes ${leidos} ${leidos === 1 ? 'estrella' : 'estrellas'}!`}
          </p>
          <button
            type="button"
            onClick={() => hablar(leidos === 0 ? 'Vamos por tu primera estrella' : `Tienes ${leidos} estrellas`)}
            className="inline-flex items-center gap-2 min-h-12 px-5 rounded-control bg-accent text-onAccent font-extrabold cursor-pointer hover:bg-accent-hover"
          >
            <Volume2 className="w-5 h-5" aria-hidden />
            Escuchar
          </button>
        </div>
      </Modal>

      <SelectorPaleta isOpen={paletaAbierta} onClose={() => setPaletaAbierta(false)} />
    </div>
  );
};
