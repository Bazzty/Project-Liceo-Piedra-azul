import React, { useState } from 'react';
import { LogIn, Lock, User as UserIcon } from 'lucide-react';
import { AuthLayout } from '../layouts/AuthLayout';
import { Button } from '../components/common/Button';
import { useAuthStore } from '../store/useAuthStore';

interface LoginProps {
  onSuccessLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccessLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    // Autenticación simulación docente/apoderado
    login({
      id: 'docente-1',
      nombre: username === 'admin' ? 'Educadora D. PIE' : username,
      rol: username === 'admin' ? 'docente' : 'apoderado',
    });
    onSuccessLogin();
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-5">
        <h2 className="text-2xl font-black text-primary text-center">Ingreso Docente / Hogar</h2>
        
        {error && (
          <div className="bg-red-100 border-2 border-red-500 text-red-700 p-3 rounded-2xl text-sm font-bold text-center">
            {error}
          </div>
        )}

        {/* Campo Usuario */}
        <div>
          <label className="block text-sm font-bold text-primary mb-2">Usuario / Rut</label>
          <div className="relative">
            <UserIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: docente / apoderado"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-borderCustom bg-app text-primary font-bold focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>

        {/* Campo Contraseña */}
        <div>
          <label className="block text-sm font-bold text-primary mb-2">Contraseña</label>
          <div className="relative">
            <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-borderCustom bg-app text-primary font-bold focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>

        <Button variant="primary" type="submit" className="w-full py-4 text-xl font-black">
          <LogIn className="w-6 h-6 mr-2" />
          Ingresar al Sistema
        </Button>
      </form>
    </AuthLayout>
  );
};