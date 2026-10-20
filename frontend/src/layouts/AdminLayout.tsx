import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Users,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  GraduationCap,
  Sparkles,
  MonitorPlay,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { Button } from '@/shared/ui';

export type AdminSection = 'dashboard' | 'alumnos' | 'cuentos' | 'aula';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection?: AdminSection;
  onNavigate?: (section: AdminSection) => void;
  onLogout?: () => void;
}

const NAV_ITEMS: { id: AdminSection; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
  { id: 'alumnos', label: 'Lista de Alumnos', icon: Users },
  { id: 'cuentos', label: 'Niveles y Cuentos', icon: BookOpen },
  { id: 'aula', label: 'Control de Aula', icon: MonitorPlay },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeSection = 'dashboard',
  onNavigate,
  onLogout,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuthStore();

  // Activa la paleta profesional limpia solo mientras se ve el panel docente
  // y devuelve el tema del alumno al salir.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'admin');
    return () => {
      document.documentElement.setAttribute('data-theme', useThemeStore.getState().currentTheme);
    };
  }, []);

  const irA = (section: AdminSection) => {
    setIsSidebarOpen(false);
    onNavigate?.(section);
  };

  return (
    <div className="min-h-screen bg-app text-primary text-left flex flex-col md:flex-row font-sans">
      {/* Barra superior en móvil */}
      <div className="md:hidden bg-surface border-b border-borderCustom p-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-brand" />
          <span className="font-extrabold text-primary">Panel Docente PIE</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-xl border border-borderCustom text-primary hover:bg-app cursor-pointer"
          aria-label="Abrir menú"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Menú lateral */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-borderCustom p-4 flex flex-col justify-between transform transition-transform duration-300 md:static md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          <div className="p-2 border-b border-borderCustom pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand text-onBrand flex items-center justify-center font-bold shadow-sm">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-extrabold text-primary text-base leading-tight">Leer para Todos</h2>
                <span className="text-xs font-semibold text-secondary">Panel Docente</span>
              </div>
            </div>
          </div>

          <nav className="space-y-1" aria-label="Secciones del panel docente">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => irA(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-left transition-all text-sm cursor-pointer ${
                    isActive ? 'bg-brand text-onBrand shadow-sm' : 'text-primary hover:bg-app'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Usuario y cierre de sesión */}
        <div className="pt-4 border-t border-borderCustom space-y-3">
          <div className="bg-app p-3 rounded-xl border border-borderCustom">
            <p className="text-xs text-secondary font-bold">Sesión docente:</p>
            <p className="text-sm font-extrabold text-primary truncate">{user?.nombre || 'Profesora PIE'}</p>
          </div>
          <Button variant="danger" onClick={onLogout} className="w-full justify-start gap-2 py-2 text-sm font-bold">
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </Button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full min-w-0">
        <header className="mb-6 pb-4 border-b border-borderCustom flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-primary">Liceo Piedra Azul — Gestión PIE</h1>
            <p className="text-sm font-semibold text-secondary">
              Seguimiento pedagógico, cuentos y personalización de los alumnos
            </p>
          </div>
          <div className="inline-flex items-center gap-2 bg-surface px-4 py-2 rounded-xl border border-borderCustom text-xs font-bold text-primary shadow-sm">
            <Sparkles className="w-4 h-4 text-brand" />
            <span>Modo Local (Offline)</span>
          </div>
        </header>

        <div className="bg-surface p-6 md:p-8 rounded-2xl border border-borderCustom shadow-sm">{children}</div>
      </main>
    </div>
  );
};
