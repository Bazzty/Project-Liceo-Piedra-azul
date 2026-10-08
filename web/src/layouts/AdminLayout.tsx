import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Users,
  Image as ImageIcon,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/common/Button';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection?: 'dashboard' | 'cuentos' | 'alumnos' | 'recursos';
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeSection = 'dashboard',
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();

  // Activa la paleta profesional limpia exclusivamente para la vista docente
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'admin');
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
    { id: 'cuentos', label: 'Gestión de Cuentos', icon: BookOpen },
    { id: 'alumnos', label: 'Lista de Alumnos', icon: Users },
    { id: 'recursos', label: 'Fotos Reales / Audio', icon: ImageIcon },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      {/* Botón Flotante para Menú Móvil */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-blue-700" />
          <span className="font-extrabold text-slate-800">Panel Docente PIE</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100"
          aria-label="Abrir menú"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Lateral Administrativo */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 p-4 flex flex-col justify-between transform transition-transform duration-300 md:static md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Logo e Identificador Docente */}
          <div className="p-2 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold shadow-sm">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900 text-base leading-tight">
                  Leer para Todos
                </h2>
                <span className="text-xs font-semibold text-slate-500">
                  Panel Administrativo
                </span>
              </div>
            </div>
          </div>

          {/* Menú de Navegación Docente */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-left transition-all text-sm ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bloque Inferior de Usuario y Salida */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500 font-bold">Sesión Docente:</p>
            <p className="text-sm font-extrabold text-slate-800 truncate">
              {user?.nombre || 'Educadora D. PIE'}
            </p>
          </div>
          <Button
            variant="danger"
            onClick={handleLogout}
            className="w-full justify-start gap-2 py-2 text-sm font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </Button>
        </div>
      </aside>

      {/* Contenido Principal de Administración */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        {/* Cabecera Superior del Área de Trabajo */}
        <header className="mb-6 pb-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">
              Liceo Piedra Azul — Gestión PIE
            </h1>
            <p className="text-sm font-semibold text-slate-500">
              Administration de cuentos, fotos reales y seguimiento pedagógico
            </p>
          </div>
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">
            <Sparkles className="w-4 h-4 text-blue-700" />
            <span>Modo Local (Offline)</span>
          </div>
        </header>

        {/* Render del Contenido Administrativo */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
          {children}
        </div>
      </main>
    </div>
  );
};