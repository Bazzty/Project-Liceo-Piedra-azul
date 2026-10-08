import React, { useState } from 'react';
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
  activeSection = 'dashboard' 
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout, user } = useAuthStore();

  const menuItems = [
    { id: 'dashboard', label: 'Panel Control', icon: LayoutDashboard },
    { id: 'cuentos', label: 'Gestión Cuentos', icon: BookOpen },
    { id: 'alumnos', label: 'Control Alumnos', icon: Users },
    { id: 'recursos', label: 'Banco Pictogramas', icon: ImageIcon },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Barra superior Móvil */}
      <header className="md:hidden bg-white border-b-2 border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-8 h-8 text-indigo-600" />
          <span className="font-black text-lg tracking-tight text-indigo-950">Aula LPT</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          className="p-2 rounded-xl border-2 border-slate-200 hover:bg-slate-50 text-slate-700"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Menú Lateral (Sidebar) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-300 p-4 flex flex-col justify-between
        md:relative md:transform-none md:flex
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-6">
          {/* Encabezado Admin */}
          <div className="hidden md:flex items-center gap-2 pb-4 border-b border-slate-800">
            <GraduationCap className="w-8 h-8 text-indigo-400" />
            <div className="flex flex-col">
              <span className="font-black tracking-tight text-lg leading-tight">Aula LPT</span>
              <span className="text-xs text-slate-400 font-medium">Panel Docente</span>
            </div>
          </div>

          {/* Info del usuario logueado */}
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm text-white">
              {user?.nombre?.charAt(0).toUpperCase() || 'D'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold truncate">{user?.nombre || 'Docente'}</span>
              <span className="text-xs text-indigo-300 capitalize">{user?.rol || 'Administrador'}</span>
            </div>
          </div>

          {/* Enlaces de Navegación */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setIsSidebarOpen(false);
                    // Aquí se manejará el enrutamiento formal
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-colors text-left ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Cierre de Sesión al Fondo */}
        <div className="pt-4 border-t border-slate-800">
          <Button
            variant="danger"
            size="md"
            onClick={handleLogout}
            className="w-full justify-start gap-2 bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white border-0 shadow-none"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </Button>
        </div>
      </aside>

      {/* Overlay para móviles */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Contenedor del Contenido de Trabajo */}
      <main className="flex-1 p-4 md:p-8 z-10 relative overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
};