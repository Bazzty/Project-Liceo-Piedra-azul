import React, { useState } from 'react';
import { ArrowLeft, KeyRound, UserCheck, ShieldCheck, LayoutDashboard, MonitorPlay } from 'lucide-react';
import { AuthLayout } from '../layouts/AuthLayout';
import { useAuthStore } from '../store/useAuthStore';

export const LoginProfesorView: React.FC = () => {
  const [usuario, setUsuario] = useState('profesora@piedraazul.cl');
  const [password, setPassword] = useState('123456');
  const [destinoLogin, setDestinoLogin] = useState<'panel-docente' | 'control-aula'>('panel-docente');
  const [error, setError] = useState('');
  const { setVistaInicio1, setModoInicio, modoInicio, setRole, login } = useAuthStore();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (usuario && password) {
      login({
        id: 'prof-1',
        nombre: 'Profesora PIE',
        email: usuario,
        role: 'docente',
      });
      setRole('docente');
      setVistaInicio1(destinoLogin);
    } else {
      setError('Por favor ingresa un usuario y contraseña válidos.');
    }
  };

  const handleVolver = () => {
    if (modoInicio === 'selector') {
      setModoInicio('selector');
    } else {
      setVistaInicio1('portal');
    }
  };

  return (
    <AuthLayout
      titulo="Acceso Docente PIE"
      subtitulo="Ingresa tus credenciales para administrar la clase"
    >
      <div className="flex flex-col gap-6">
        {/* Botón de retorno */}
        <button
          onClick={handleVolver}
          className="flex items-center gap-2 text-xs font-bold text-secondary hover:text-primary transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{modoInicio === 'selector' ? 'Volver al Selector de Prototipos' : 'Volver al Portal'}</span>
        </button>

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {/* Campo Correo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-primary flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-brand" />
              <span>Correo o Usuario</span>
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-app border border-borderCustom rounded-2xl focus-within:border-brand transition-colors">
              <input
                type="email"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-xs sm:text-sm text-primary placeholder-secondary"
                placeholder="profesora@piedraazul.cl"
                required
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-primary flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-brand" />
              <span>Contraseña</span>
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-app border border-borderCustom rounded-2xl focus-within:border-brand transition-colors">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-xs sm:text-sm text-primary placeholder-secondary"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Selector de Destino de Navegación */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-xs font-bold text-secondary">Destino al ingresar:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDestinoLogin('panel-docente')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  destinoLogin === 'panel-docente'
                    ? 'bg-brand text-white border-brand shadow-sm scale-[1.02]'
                    : 'bg-app text-secondary border-borderCustom hover:border-brand'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Panel General</span>
              </button>
              <button
                type="button"
                onClick={() => setDestinoLogin('control-aula')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  destinoLogin === 'control-aula'
                    ? 'bg-brand text-white border-brand shadow-sm scale-[1.02]'
                    : 'bg-app text-secondary border-borderCustom hover:border-brand'
                }`}
              >
                <MonitorPlay className="w-4 h-4" />
                <span>Control de Aula</span>
              </button>
            </div>
          </div>

          {/* Botón Ingresar */}
          <button
            type="submit"
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-brand text-white font-black rounded-2xl shadow hover:opacity-90 active:scale-95 transition-all cursor-pointer text-sm"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>INGRESAR A LA PLATAFORMA</span>
          </button>
        </form>
      </div>
    </AuthLayout>
  );
};