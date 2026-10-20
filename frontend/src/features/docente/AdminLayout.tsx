import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { ROUTES } from '@/app/routes';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { useThemeStore } from '@/shared/store/useThemeStore';

export type AdminSection = 'dashboard' | 'alumnos' | 'cuentos' | 'aula';

const NAV_ITEMS: { id: AdminSection; numero: string; etiqueta: string; ruta: string }[] = [
  { id: 'dashboard', numero: '01', etiqueta: 'Resumen', ruta: ROUTES.profesorPanel },
  { id: 'alumnos', numero: '02', etiqueta: 'Estudiantes', ruta: ROUTES.profesorEstudiantes },
  { id: 'cuentos', numero: '03', etiqueta: 'Cuentos', ruta: ROUTES.profesorCuentos },
  { id: 'aula', numero: '04', etiqueta: 'Control de aula', ruta: ROUTES.profesorAula },
];

/** Piedra facetada: marca del proyecto (Piedra Azul). */
const MarcaPiedra: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden>
    <polygon points="16,2 29,10 25,28 7,28 3,10" fill="#2a8da3" />
    <polygon points="16,2 29,10 16,16" fill="#6cc3d6" />
    <polygon points="3,10 16,16 7,28" fill="#1a6b7c" />
    <polygon points="16,16 29,10 25,28 7,28" fill="#238196" fillOpacity="0.9" />
  </svg>
);

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: AdminSection;
}

/** Marco del panel docente: riel azul oscuro numerado a la izquierda y contenido en "hojas". */
export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeSection }) => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Paleta sobria del panel docente; devuelve la del alumno al salir.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'admin');
    return () => {
      document.documentElement.setAttribute('data-theme', useThemeStore.getState().currentTheme);
    };
  }, []);

  const cerrarSesion = () => {
    logout();
    navigate(ROUTES.inicio);
  };

  return (
    <div className="min-h-screen bg-app text-primary flex flex-col md:flex-row">
      {/* Barra superior en móvil */}
      <div className="md:hidden print:hidden bg-rail text-rail-text px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <MarcaPiedra className="w-8 h-8" />
          <span className="font-display text-lg font-semibold text-white">Leer para Todos</span>
        </div>
        <button
          type="button"
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="min-h-12 min-w-12 flex items-center justify-center rounded-control border border-rail-line text-white cursor-pointer"
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
        >
          {menuAbierto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <aside
        className={`print:hidden fixed inset-y-0 left-0 z-50 w-60 bg-rail text-rail-text flex flex-col justify-between py-6 transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          menuAbierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="flex items-center gap-3 px-5 pb-6">
            <MarcaPiedra className="w-10 h-10 shrink-0" />
            <div className="leading-tight">
              <p className="font-display text-xl font-semibold text-white">Leer para Todos</p>
              <p className="mt-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-rail-muted">Libro de clases</p>
            </div>
          </div>

          <nav aria-label="Secciones del panel docente" className="border-t border-rail-line">
            {NAV_ITEMS.map((item) => {
              const activo = item.id === activeSection;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setMenuAbierto(false);
                    navigate(item.ruta);
                  }}
                  aria-current={activo ? 'page' : undefined}
                  className={`w-full min-h-[3.25rem] flex items-center gap-4 px-5 py-3.5 border-b border-rail-line text-left cursor-pointer transition-colors ${
                    activo ? 'bg-rail-active text-white' : 'text-rail-text hover:bg-rail-active/60'
                  }`}
                >
                  <span className={`w-6 font-display text-base font-semibold ${activo ? 'text-rail-accent' : 'text-rail-muted'}`}>
                    {item.numero}
                  </span>
                  <span className="text-sm font-semibold">{item.etiqueta}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="px-5 flex flex-col gap-3">
          <div className="pt-4 border-t border-rail-line">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-rail-muted">Sesión</p>
            <p className="mt-1 font-display text-lg font-semibold text-white truncate">{user?.nombre ?? 'Profesora PIE'}</p>
            <p className="text-xs text-rail-muted">{user?.role === 'revisor' ? 'Revisor' : 'Docente'} · Kínder A</p>
          </div>
          <button
            type="button"
            onClick={cerrarSesion}
            className="min-h-12 rounded-control border border-rail-muted/60 text-sm font-semibold text-white cursor-pointer hover:bg-rail-active"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-10 py-6 md:py-8 flex flex-col gap-5 print:p-0">{children}</main>
    </div>
  );
};
