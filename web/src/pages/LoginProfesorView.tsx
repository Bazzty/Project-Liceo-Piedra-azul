import React, { useState } from 'react';
import { ArrowLeft, KeyRound, UserCheck, ShieldCheck } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { useAuthStore } from '../store/useAuthStore';

export const LoginProfesorView: React.FC = () => {
  const [usuario, setUsuario] = useState('profesora@piedraazul.cl');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const { setVistaInicio1, setRole } = useAuthStore();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (usuario && password) {
      setRole('docente');
      setVistaInicio1('control-aula');
    } else {
      setError('Por favor ingresa usuario y contraseña válidos.');
    }
  };

  return (
    <MainLayout allowScroll={true}>
      <div className="flex flex-col gap-6 w-full max-w-md mx-auto py-12 px-4 justify-center h-full">
        
        <button
          onClick={() => setVistaInicio1('portal')}
          className="flex items-center gap-2 bg-surface px-4 py-2 rounded-2xl border-2 border-borderCustom font-black text-primary hover:border-brand transition-all active:scale-95 self-start cursor-pointer shadow"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>VOLVER AL PORTAL</span>
        </button>

        <div className="bg-surface rounded-3xl border-4 border-borderCustom p-8 shadow-2xl flex flex-col gap-6">
          
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-16 h-16 bg-sky-500/10 text-sky-600 rounded-2xl flex items-center justify-center border-2 border-sky-500/30">
              <UserCheck className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-primary">Acceso Docente PIE</h3>
            <p className="text-secondary text-sm font-medium">Ingresa tus credenciales para administrar la clase</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border-2 border-red-500/30 text-red-700 px-4 py-3 rounded-2xl text-xs font-extrabold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-secondary">Correo o Usuario</label>
              <div className="flex items-center gap-3 bg-app px-4 py-3 rounded-2xl border-2 border-borderCustom focus-within:border-brand">
                <KeyRound className="w-5 h-5 text-secondary shrink-0" />
                <input
                  type="email"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-sm font-bold text-primary"
                  placeholder="usuario@piedraazul.cl"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-secondary">Contraseña</label>
              <div className="flex items-center gap-3 bg-app px-4 py-3 rounded-2xl border-2 border-borderCustom focus-within:border-brand">
                <ShieldCheck className="w-5 h-5 text-secondary shrink-0" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-sm font-bold text-primary"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full py-4 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-black text-base shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              INGRESAR AL PANEL DE AULA
            </button>

          </form>

        </div>

      </div>
    </MainLayout>
  );
};