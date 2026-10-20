import React, { useState } from 'react';
import { Button } from '@/shared/ui';
import { ArrowLeft, KeyRound, UserCheck, ShieldCheck } from 'lucide-react';
import { MainLayout } from '@/shared/layouts/MainLayout';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes';

export const LoginProfesorView: React.FC = () => {
  const [usuario, setUsuario] = useState('profesora@piedraazul.cl');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const { setRole, login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (usuario && password) {
      login();
      setRole('docente');
      navigate(ROUTES.profesorAula);
    } else {
      setError('Por favor ingresa usuario y contraseña válidos.');
    }
  };

  return (
    <MainLayout allowScroll={true}>
      <div className="flex flex-col gap-6 w-full max-w-md mx-auto py-12 px-4 justify-center h-full">
        
        <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.portal)} className="self-start">
        	<ArrowLeft className="w-4 h-4" />
        	VOLVER AL PORTAL
        </Button>

        <div className="bg-surface rounded-3xl border-4 border-borderCustom p-8 shadow-2xl flex flex-col gap-6">
          
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-16 h-16 bg-statusInfo-bg text-statusInfo rounded-2xl flex items-center justify-center border-2 border-statusInfo">
              <UserCheck className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-primary">Acceso Docente PIE</h3>
            <p className="text-secondary text-sm font-medium">Ingresa tus credenciales para administrar la clase</p>
          </div>

          {error && (
            <div className="bg-statusDanger-bg border-2 border-statusDanger text-statusDanger px-4 py-3 rounded-2xl text-xs font-extrabold text-center">
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
              className="mt-2 w-full py-4 bg-statusInfo hover:opacity-90 text-onStatus rounded-2xl font-black text-base shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              INGRESAR AL PANEL DE AULA
            </button>

          </form>

        </div>

      </div>
    </MainLayout>
  );
};