import React, { useState } from 'react';
import { Lock, User as UserIcon, Sparkles } from 'lucide-react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/shared/ui';
import { useAuthStore } from '@/store/useAuthStore';

export interface LoginProps {
  onSuccessLogin?: () => void;
  onLoginSuccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccessLogin, onLoginSuccess }) => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuthStore();

  const handleCallback = () => {
    if (onSuccessLogin) onSuccessLogin();
    if (onLoginSuccess) onLoginSuccess();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!usuario.trim() || !password.trim()) {
      setError('Por favor ingresa tu usuario y contraseña');
      return;
    }

    // Autenticación de demostración local
    login({
      id: 'docente-1',
      nombre: usuario || 'Educadora PIE',
      email: "a",
      role: 'docente',
    });

    handleCallback();
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md bg-surface p-8 rounded-3xl shadow-2xl border-2 border-borderCustom flex flex-col gap-6">
        
        {/* Cabecera del Formulario */}
        <div className="text-center flex flex-col items-center gap-2">
          <div className="w-14 h-14 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-1">
            <Sparkles className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand px-3 py-1 bg-brand/10 rounded-full">
            Liceo Piedra Azul
          </span>
          <h2 className="text-2xl font-extrabold text-primary">
            Iniciar Sesión
          </h2>
          <p className="text-sm text-secondary">
            Acceso exclusivo para Educadoras y Apoderados
          </p>
        </div>

        {error && (
          <div className="bg-statusDanger-bg border-2 border-statusDanger text-statusDanger text-sm font-semibold p-3 rounded-2xl text-center">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-primary">Usuario</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-3.5 w-5 h-5 text-secondary" />
              <input 
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Ej. educadora_pie"
                className="w-full pl-11 pr-4 py-3 bg-app border-2 border-borderCustom rounded-2xl font-bold text-primary focus:border-brand focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-primary">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-secondary" />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-app border-2 border-borderCustom rounded-2xl font-bold text-primary focus:border-brand focus:outline-none transition-colors"
              />
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full mt-2 py-3.5 bg-brand hover:opacity-90 text-onBrand font-bold rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            Entrar al Panel
          </Button>

        </form>
      </div>
    </AuthLayout>
  );
};