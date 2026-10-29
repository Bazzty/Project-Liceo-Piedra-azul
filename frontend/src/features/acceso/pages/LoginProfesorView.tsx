import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, BookOpen, CreditCard, UserRound } from 'lucide-react';
import { ROUTES } from '@/app/routes';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { MarcaPiedra } from '@/features/docente/components/MarcaPiedra';
import { useThemeStore } from '@/shared/store/useThemeStore';

type Rol = 'docente' | 'revisor';

const CAMPO =
  'min-h-12 w-full rounded-control border border-borderStrong bg-surface px-4 text-base text-primary focus-visible:border-brand';

const BENEFICIOS = [
  { icono: BarChart3, texto: 'Mira el avance de cada niño y quién necesita apoyo.' },
  { icono: CreditCard, texto: 'Imprime las tarjetas de acceso con el código de cada niño.' },
  { icono: BookOpen, texto: 'Crea cuentos con pictogramas y envíalos a revisión.' },
];

/** Ingreso al panel docente: sobrio, con campos vacíos y una cuenta de demostración para presentar. */
export const LoginProfesorView: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [rol, setRol] = useState<Rol>('docente');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState('');

  // Paleta sobria del panel docente también en el ingreso
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'admin');
    return () => {
      document.documentElement.setAttribute('data-theme', useThemeStore.getState().currentTheme);
    };
  }, []);

  const entrar = (email: string) => {
    login({
      id: rol === 'docente' ? 'prof-1' : 'rev-1',
      nombre: rol === 'docente' ? 'Profesora PIE' : 'Revisor PIE',
      email,
      role: rol,
    });
    navigate(ROUTES.profesorPanel);
  };

  const alEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo.trim() || !clave) {
      setError('Escribe tu correo y tu contraseña.');
      return;
    }
    entrar(correo.trim());
  };

  return (
    <div className="min-h-screen bg-app text-primary lg:grid lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
      <aside className="bg-rail text-rail-text px-6 py-8 lg:px-14 lg:py-12 flex flex-col justify-between gap-10">
        <div className="flex items-center gap-3">
          <MarcaPiedra className="w-11 h-11" />
          <div className="leading-tight">
            <p className="font-display text-xl font-semibold text-primary">Leer para Todos</p>
            <p className="text-sm text-rail-muted">Liceo Piedra Azul · Puerto Montt</p>
          </div>
        </div>

        <div className="flex flex-col gap-7">
          <h1 className="font-display text-4xl lg:text-[2.5rem] font-semibold leading-[1.15] tracking-tight text-primary">
            Seguimiento del avance de lectura de tus estudiantes
          </h1>
          <ul className="flex flex-col gap-4">
            {BENEFICIOS.map(({ icono: Icono, texto }) => (
              <li key={texto} className="flex items-start gap-3.5">
                <Icono className="w-5 h-5 mt-0.5 shrink-0 text-rail-accent" aria-hidden />
                <span className="text-base leading-relaxed">{texto}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm leading-relaxed text-rail-muted">
          Los datos de los estudiantes son confidenciales. Acceso solo para personal autorizado del establecimiento.
        </p>
      </aside>

      <main className="flex items-center justify-center px-5 py-10">
        <form onSubmit={alEnviar} noValidate className="w-full max-w-md flex flex-col gap-5" aria-labelledby="titulo-ingreso">
          <div>
            <h2 id="titulo-ingreso" className="font-display text-3xl font-semibold tracking-tight">
              Ingresar
            </h2>
            <p className="mt-1 text-sm text-secondary">Usa tu cuenta del Liceo Piedra Azul.</p>
          </div>

          <fieldset className="border-0 p-0 m-0">
            <legend className="mb-2 text-sm font-semibold">Ingreso como</legend>
            <div role="radiogroup" aria-label="Rol" className="grid grid-cols-2 gap-3">
              {(['docente', 'revisor'] as Rol[]).map((r) => (
                <label
                  key={r}
                  className={`min-h-[3.25rem] flex items-center gap-3 px-4 rounded-control cursor-pointer text-sm font-semibold border ${
                    rol === r ? 'border-2 border-brand bg-brand/10' : 'border-borderStrong bg-surface'
                  }`}
                >
                  <input type="radio" name="rol" checked={rol === r} onChange={() => setRol(r)} className="w-[1.1rem] h-[1.1rem] accent-[var(--brand-primary)]" />
                  {r === 'docente' ? 'Docente' : 'Revisor'}
                </label>
              ))}
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="rounded-control border border-statusDanger bg-statusDanger-bg px-4 py-3 text-sm font-semibold text-statusDanger">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="correo" className="text-sm font-semibold">
              Correo electrónico
            </label>
            <input id="correo" type="email" autoComplete="username" value={correo} onChange={(e) => setCorreo(e.target.value)} className={CAMPO} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="clave" className="text-sm font-semibold">
              Contraseña
            </label>
            <div className="flex items-center rounded-control border border-borderStrong bg-surface pr-2 focus-within:border-brand">
              <input
                id="clave"
                type={verClave ? 'text' : 'password'}
                autoComplete="current-password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                className="min-h-12 flex-1 min-w-0 bg-transparent px-4 text-base text-primary outline-none"
              />
              <button
                type="button"
                onClick={() => setVerClave(!verClave)}
                aria-pressed={verClave}
                className="min-h-10 px-3 rounded-control text-sm font-semibold text-brand cursor-pointer hover:bg-app"
              >
                {verClave ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="min-h-[3.25rem] rounded-control bg-brand text-onBrand text-base font-bold cursor-pointer hover:bg-brand-hover transition-colors"
          >
            Ingresar
          </button>

          <div className="flex items-center gap-3 text-xs text-secondary" aria-hidden>
            <span className="flex-1 h-px bg-borderCustom" />o<span className="flex-1 h-px bg-borderCustom" />
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => entrar('profesora@piedraazul.cl')}
              className="min-h-12 inline-flex items-center justify-center gap-2 rounded-control border border-borderStrong bg-surface text-sm font-semibold text-primary cursor-pointer hover:border-brand"
            >
              <UserRound className="w-4 h-4" aria-hidden />
              Usar cuenta de demostración
            </button>
            <p className="text-center text-xs text-secondary">Solo para presentar el prototipo. Los datos son ficticios.</p>
          </div>

          <button
            type="button"
            onClick={() => navigate(ROUTES.inicio)}
            className="self-center min-h-12 text-sm font-semibold text-secondary underline underline-offset-4 cursor-pointer hover:text-brand"
          >
            Volver al ingreso de estudiantes
          </button>
        </form>
      </main>
    </div>
  );
};
