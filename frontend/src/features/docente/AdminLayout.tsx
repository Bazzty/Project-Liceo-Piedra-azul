import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CreditCard, Gauge, GraduationCap, LayoutGrid, ListChecks, Menu, Users, X, type LucideIcon } from 'lucide-react';
import { ROUTES } from '@/app/routes';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { MarcaPiedra } from '@/features/docente/components/MarcaPiedra';
import { useThemeStore } from '@/shared/store/useThemeStore';

export type AdminSection = 'dashboard' | 'alumnos' | 'actividades' | 'curriculo' | 'cuentos' | 'tarjetas' | 'aula';

const NAV_ITEMS: { id: AdminSection; icono: LucideIcon; color: string; etiqueta: string; ruta: string }[] = [
  { id: 'dashboard', color: 'text-tinte-azul-fuerte', icono: LayoutGrid, etiqueta: 'Resumen', ruta: ROUTES.profesorPanel },
  { id: 'alumnos', color: 'text-tinte-coral-fuerte', icono: Users, etiqueta: 'Estudiantes', ruta: ROUTES.profesorEstudiantes },
  { id: 'actividades', color: 'text-tinte-ambar-fuerte', icono: ListChecks, etiqueta: 'Actividades', ruta: ROUTES.profesorActividades },
  { id: 'curriculo', color: 'text-tinte-verde-fuerte', icono: GraduationCap, etiqueta: 'Cobertura curricular', ruta: ROUTES.profesorCurriculo },
  { id: 'cuentos', color: 'text-tinte-moca-fuerte', icono: BookOpen, etiqueta: 'Cuentos', ruta: ROUTES.profesorCuentos },
  { id: 'tarjetas', color: 'text-tinte-azul-fuerte', icono: CreditCard, etiqueta: 'Tarjetas de acceso', ruta: ROUTES.profesorTarjetas },
  { id: 'aula', color: 'text-tinte-coral-fuerte', icono: Gauge, etiqueta: 'Control de aula', ruta: ROUTES.profesorAula },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: AdminSection;
}

/** Marco del panel docente: barra lateral de papel con íconos de colores y contenido en tarjetas. */
export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeSection }) => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { user, logout, terminarSupervision } = useAuthStore();
  const navigate = useNavigate();

  // Paleta sobria del panel docente; devuelve la del alumno al salir.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'admin');
    return () => {
      document.documentElement.setAttribute('data-theme', useThemeStore.getState().currentTheme);
    };
  }, []);

  // Si venía de acompañar a un niño, la supervisión termina al volver al panel
  useEffect(() => {
    terminarSupervision();
  }, [terminarSupervision]);

  const cerrarSesion = () => {
    logout();
    navigate(ROUTES.inicio);
  };

  return (
    <div className="min-h-screen bg-app text-primary flex flex-col md:flex-row">
      {/* Barra superior en móvil */}
      <div className="md:hidden print:hidden bg-rail text-rail-text border-b border-rail-line px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <MarcaPiedra className="w-8 h-8" />
          <span className="text-base font-medium text-primary">Leer para Todos</span>
        </div>
        <button
          type="button"
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="min-h-12 min-w-12 flex items-center justify-center rounded-control border border-rail-line text-primary cursor-pointer"
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
        >
          {menuAbierto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <aside
        className={`print:hidden fixed inset-y-0 left-0 z-50 w-64 bg-rail text-rail-text flex flex-col justify-between py-5 border-r border-rail-line transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          menuAbierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="flex items-center gap-3 px-5 pb-5">
            <MarcaPiedra className="w-10 h-10 shrink-0" />
            <div className="leading-tight">
              <p className="text-base font-medium text-primary">Leer para Todos</p>
              <p className="mt-0.5 text-xs text-rail-muted">Libro de clases</p>
            </div>
          </div>

          <nav aria-label="Secciones del panel docente" className="px-3 flex flex-col gap-1">
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
                  className={`w-full min-h-12 flex items-center gap-3 px-3 py-2.5 rounded-lg text-left cursor-pointer transition-colors ${
                    activo ? 'bg-rail-active text-primary font-medium border border-rail-line' : 'border border-transparent text-rail-text hover:bg-black/5'
                  }`}
                >
                  <item.icono className={`w-[1.125rem] h-[1.125rem] shrink-0 ${item.color}`} aria-hidden />
                  <span className="text-[0.9375rem]">{item.etiqueta}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="px-4 flex flex-col gap-3">
          <div className="pt-4 border-t border-rail-line">
            <p className="text-xs text-rail-muted">Sesión</p>
            <p className="mt-1 text-base font-medium text-primary truncate">{user?.nombre ?? 'Profesora PIE'}</p>
            <p className="text-xs text-rail-muted">{user?.role === 'revisor' ? 'Revisor' : 'Docente'} · Kínder A</p>
          </div>
          <button
            type="button"
            onClick={cerrarSesion}
            className="min-h-12 rounded-control border border-rail-line bg-rail-active text-sm font-medium text-primary cursor-pointer hover:bg-black/5"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-10 py-6 md:py-8 flex flex-col gap-5 print:p-0">{children}</main>
    </div>
  );
};
