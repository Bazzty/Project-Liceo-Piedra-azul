import React, { useState } from 'react';
import { ArrowLeft, KeyRound, User, Home } from 'lucide-react';
import { MainLayout } from '@/layouts/MainLayout';
import { useAuthStore } from '@/store/useAuthStore';

export const LoginAlumnoCasaView: React.FC = () => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setVistaInicio1, setActiveStudentId, setRole, setSessionType } = useAuthStore();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (usuario && password) {
      setActiveStudentId('estudiante-mateo');
      setRole('estudiante');
      setSessionType('casa');
      setVistaInicio1('aprender');
    } else {
      setError('Ingresa usuario y contraseña.');
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
          <span>VOLVER</span>
        </button>

        <div className="bg-surface rounded-3xl border-4 border-borderCustom p-8 shadow-2xl flex flex-col gap-6">
          
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-16 h-16 bg-statusOk-bg text-statusOk rounded-2xl flex items-center justify-center border-2 border-statusOk">
              <Home className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-primary">Mi Tarea en Casa</h3>
            <p className="text-secondary text-sm font-medium">Ingresa los datos del estudiante</p>
          </div>

          {error && (
            <div className="bg-statusDanger-bg border-2 border-statusDanger text-statusDanger px-4 py-3 rounded-2xl text-xs font-extrabold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-secondary">Usuario</label>
              <div className="flex items-center gap-3 bg-app px-4 py-3 rounded-2xl border-2 border-borderCustom focus-within:border-brand">
                <User className="w-5 h-5 text-secondary shrink-0" />
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-sm font-bold text-primary"
                  placeholder="mateo.alumno"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-secondary">Contraseña</label>
              <div className="flex items-center gap-3 bg-app px-4 py-3 rounded-2xl border-2 border-borderCustom focus-within:border-brand">
                <KeyRound className="w-5 h-5 text-secondary shrink-0" />
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
              style={{
                backgroundColor: 'var(--btn-aprender-bg)',
                color: 'var(--btn-aprender-text)',
                borderColor: 'var(--btn-aprender-border)',
              }}
              className="mt-2 w-full py-4 rounded-2xl border-4 font-black text-base shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              ENTRAR A LEER
            </button>

          </form>

        </div>

      </div>
    </MainLayout>
  );
};