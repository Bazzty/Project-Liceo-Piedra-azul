import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Users,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  GraduationCap,
  MonitorPlay,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

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
  const { adminThemeMode = 'light', toggleAdminTheme } = useThemeStore();
  const esOscuro = adminThemeMode === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'admin');
    root.setAttribute('data-admin-theme', adminThemeMode);
    if (esOscuro) {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    return () => {
      root.removeAttribute('data-admin-theme');
      root.classList.remove('dark');
      document.body.classList.remove('dark');
      root.setAttribute('data-theme', useThemeStore.getState().currentTheme);
    };
  }, [adminThemeMode, esOscuro]);

  const irA = (section: AdminSection) => {
    setIsSidebarOpen(false);
    onNavigate?.(section);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row transition-colors bg-[var(--admin-bg)] text-[var(--admin-text-primary)]">
      {/* Barra superior en móviles */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-[var(--admin-surface)] border-[var(--admin-border)]">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-[var(--admin-primary)]" />
          <span className="font-black text-base">Gestión Docente PIE</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAdminTheme}
            className="p-2 rounded-xl border border-[var(--admin-border)] text-[var(--admin-text-primary)] cursor-pointer"
            aria-label="Cambiar tema"
          >
            {esOscuro ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl border border-[var(--admin-border)] text-[var(--admin-text-primary)] cursor-pointer"
            aria-label="Abrir menú"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Lateral (Fijo al Viewport) */}
      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-50 h-screen w-72 flex flex-col border-r transition-transform duration-300 md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-[var(--admin-sidebar-bg)] border-[var(--admin-border)]`}
      >
        <div className="p-6 border-b border-[var(--admin-border)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--admin-primary-light)] text-[var(--admin-primary)] flex items-center justify-center font-black">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-base tracking-tight">Leer para Todos</h1>
            <p className="text-xs font-semibold text-[var(--admin-text-muted)]">
              Panel Administrador
            </p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => irA(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-left transition-colors text-xs sm:text-sm cursor-pointer ${
                  isActive
                    ? 'bg-[var(--admin-primary)] text-white shadow-xs'
                    : 'text-[var(--admin-sidebar-text)] hover:bg-[var(--admin-surface-hover)]'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Perfil del docente y salida siempre visibles al margen inferior */}
        <div className="p-4 border-t border-[var(--admin-border)] bg-[var(--admin-sidebar-bg)]">
          <div className="p-3 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] mb-3">
            <p className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider">
              Docente activo:
            </p>
            <p className="text-xs font-black truncate text-[var(--admin-text-primary)]">
              {user?.nombre || 'Profesora PIE'}
            </p>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          )}
        </div>
      </aside>

      {/* Área de Trabajo Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Cabecera Superior en Escritorio */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b bg-[var(--admin-surface)] border-[var(--admin-border)]">
          <div>
            <h2 className="text-lg font-black tracking-tight text-[var(--admin-text-primary)]">
              Liceo Piedra Azul — Gestión PIE
            </h2>
            <p className="text-xs font-semibold text-[var(--admin-text-muted)]">
              Seguimiento pedagógico, cuentos y control de aula
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleAdminTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] text-xs font-bold cursor-pointer transition-colors hover:bg-[var(--admin-surface-hover)]"
            >
              {esOscuro ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              <span>{esOscuro ? 'Modo Día' : 'Modo Noche'}</span>
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Modo Local (Offline)</span>
            </div>
          </div>
        </header>

        {/* Contenido Dinámico */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};