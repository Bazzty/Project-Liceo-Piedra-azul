import React from 'react';
import { Play, Square, Users, CheckCircle, ShieldCheck } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AdminLayout } from '../layouts/AdminLayout';
import { useAuthStore } from '../store/useAuthStore';
import { db, type Alumno } from '../db/db';

export const ControlAulaView: React.FC = () => {
  const { setVistaInicio1, isClassroomSessionActive, activarSesionAula, desactivarSesionAula, logout } = useAuthStore();
  const alumnos = useLiveQuery(() => db.alumnos.toArray(), []);

  const navegar = (seccion: string) => {
    if (seccion === 'dashboard') setVistaInicio1('panel-docente');
    if (seccion === 'alumnos') setVistaInicio1('panel-docente');
    if (seccion === 'cuentos') setVistaInicio1('panel-docente');
  };

  const cerrarSesion = () => {
    logout();
    setVistaInicio1('portal');
  };

  return (
    <AdminLayout activeSection="aula" onNavigate={navegar} onLogout={cerrarSesion}>
      <div className="flex flex-col gap-6 w-full animate-fade-in">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-admin-surface border border-admin-border rounded-xl p-6 shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-admin-text-main">Habilitación de Laboratorio PIE</h2>
            <p className="text-xs text-admin-text-secondary mt-0.5">
              Control de tiempo de aula y habilitación masiva de computadores para estudiantes de Kínder
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-admin-primary-light text-admin-primary font-bold text-xs self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4" /> Módulo Docente
          </span>
        </div>

        {/* Tarjeta KPI Estado de Aula */}
        <div className="bg-admin-surface border border-admin-border rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                isClassroomSessionActive
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : 'bg-admin-border text-admin-text-muted'
              }`}
            >
              {isClassroomSessionActive ? <Play className="w-6 h-6 fill-current" /> : <Square className="w-6 h-6 fill-current" />}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-admin-text-secondary">Estado de la Clase</span>
              <span className="text-base font-bold text-admin-text-main mt-0.5">
                Sesión de Computadores:{' '}
                <span className={isClassroomSessionActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-admin-text-muted'}>
                  {isClassroomSessionActive ? 'ACTIVA (1.5 Horas Disponibles)' : 'INACTIVA'}
                </span>
              </span>
            </div>
          </div>

          {/* Botones de Activación */}
          <div className="w-full md:w-auto">
            {!isClassroomSessionActive ? (
              <button
                onClick={() => activarSesionAula(1.5)}
                className="w-full md:w-auto py-2.5 px-5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" /> Activar Clase (1.5 HRS)
              </button>
            ) : (
              <button
                onClick={desactivarSesionAula}
                className="w-full md:w-auto py-2.5 px-5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" /> Finalizar Clase Ahora
              </button>
            )}
          </div>
        </div>

        {/* Lista de Alumnos Habilitados en Grid Sobrio */}
        <div className="bg-admin-surface border border-admin-border rounded-xl p-6 flex flex-col gap-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-admin-text-main flex items-center gap-2">
              <Users className="w-4 h-4 text-admin-primary" /> Estudiantes Habilitados para la Sesión
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-admin-bg border border-admin-border text-admin-text-secondary">
              {alumnos?.length || 0} Registrados
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {alumnos?.map((a: Alumno) => (
              <div
                key={a.id}
                className="bg-admin-bg border border-admin-border rounded-lg p-3.5 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-admin-surface border border-admin-border flex items-center justify-center font-bold text-admin-text-main text-xs shrink-0 overflow-hidden">
                    {a.avatarUrl ? (
                      <img src={a.avatarUrl} alt={a.nombre} className="w-full h-full object-cover" />
                    ) : (
                      a.nombre.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-admin-text-main truncate">
                      {a.nombre} {a.apellido}
                    </span>
                    <span className="text-[10px] text-admin-text-secondary">Kínder A</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle className="w-3 h-3" /> Conectado
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};