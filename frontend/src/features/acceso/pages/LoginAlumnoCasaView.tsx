import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronDown, Clock, CreditCard, School, Star, Volume2 } from 'lucide-react';
import { obtenerAlumno } from '@/api';
import { ROUTES } from '@/app/routes';
import { AccionesDiscretas } from '@/features/acceso/components/AccionesDiscretas';
import { CasillasCodigo } from '@/features/acceso/components/CasillasCodigo';
import { TarjetaIlustrada } from '@/features/acceso/components/TarjetaIlustrada';
import { TecladoCodigo } from '@/features/acceso/components/TecladoCodigo';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { buscarTarjeta, LARGO_CODIGO, TARJETAS_DEMO } from '@/mocks/tarjetas';
import { OsoBurbuja } from '@/shared/components/OsoBurbuja';
import { useAplicarTema } from '@/shared/hooks/useAplicarTema';
import { useHablar } from '@/shared/hooks/useHablar';
import { Avatar, Button } from '@/shared/ui';
import type { Alumno } from '@/types';

const BASE = import.meta.env.BASE_URL || '/';
const PICTOGRAMAS_DECORATIVOS = ['mama', 'libro', 'feliz', 'jugar', 'colegio'];
const GIROS = ['-rotate-6', 'rotate-3', '-rotate-2', 'rotate-6', '-rotate-3'];

const ESTRELLAS = [
  { pos: 'top-28 left-10', tam: 'w-7 h-7' },
  { pos: 'top-40 right-12', tam: 'w-9 h-9' },
  { pos: 'bottom-52 left-8', tam: 'w-6 h-6' },
  { pos: 'bottom-60 right-10', tam: 'w-8 h-8' },
];

const MAX_INTENTOS = 5;
const SEGUNDOS_BLOQUEO = 30;

/** Muestra el nombre y la foto de cada tarjeta de ejemplo, para presentar el prototipo. */
const TarjetasDeEjemplo: React.FC<{ onElegir: (codigo: string) => void; nombres: Record<string, string> }> = ({
  onElegir,
  nombres,
}) => {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="flex flex-col items-center gap-3">
      <Button variant="ghost" size="sm" onClick={() => setAbierto(!abierto)} aria-expanded={abierto}>
        <CreditCard className="w-4 h-4" aria-hidden />
        Probar con una tarjeta de ejemplo
        <ChevronDown className={`w-4 h-4 transition-transform ${abierto ? 'rotate-180' : ''}`} aria-hidden />
      </Button>
      {abierto && (
        <ul className="grid grid-cols-2 gap-2 w-full">
          {TARJETAS_DEMO.map((t) => (
            <li key={t.codigo}>
              <button
                type="button"
                onClick={() => onElegir(t.codigo)}
                className="w-full min-h-12 flex items-center gap-3 px-3 py-2 rounded-control border-2 border-borderStrong bg-surface text-left cursor-pointer hover:border-brand"
              >
                <Avatar nombre={nombres[t.alumnoId] ?? '?'} />
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-extrabold text-primary">{nombres[t.alumnoId] ?? '…'}</span>
                  <span className="text-xs font-bold text-secondary tracking-widest">{t.codigo}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const LoginAlumnoCasaView: React.FC = () => {
  useAplicarTema();
  const navigate = useNavigate();
  const hablar = useHablar();
  const { setActiveStudentId, setRole, setSessionType } = useAuthStore();

  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState(false);
  const [intentos, setIntentos] = useState(0);
  const [bloqueadoHasta, setBloqueadoHasta] = useState<number | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [nombres, setNombres] = useState<Record<string, string>>({});

  const segundosRestantes = bloqueadoHasta ? Math.max(0, Math.ceil((bloqueadoHasta - ahora) / 1000)) : 0;
  const bloqueado = segundosRestantes > 0;

  // Cuenta regresiva del bloqueo temporal
  useEffect(() => {
    if (!bloqueadoHasta) return;
    const id = setInterval(() => {
      const t = Date.now();
      setAhora(t);
      if (t >= bloqueadoHasta) {
        setBloqueadoHasta(null);
        setIntentos(0);
        setError(false);
      }
    }, 500);
    return () => clearInterval(id);
  }, [bloqueadoHasta]);

  // Nombres de las tarjetas de ejemplo
  useEffect(() => {
    let activo = true;
    Promise.all(TARJETAS_DEMO.map((t) => obtenerAlumno(t.alumnoId))).then((lista) => {
      if (!activo) return;
      setNombres(Object.fromEntries(TARJETAS_DEMO.map((t, i) => [t.alumnoId, lista[i]?.nombre ?? ''])));
    });
    return () => {
      activo = false;
    };
  }, []);

  const escribir = useCallback(
    (d: string) => {
      if (bloqueado || alumno) return;
      setError(false);
      setCodigo((c) => (c.length < LARGO_CODIGO ? c + d : c));
    },
    [bloqueado, alumno],
  );

  const borrar = useCallback(() => {
    if (bloqueado || alumno) return;
    setError(false);
    setCodigo((c) => c.slice(0, -1));
  }, [bloqueado, alumno]);

  const entrar = useCallback(async () => {
    if (bloqueado || alumno || codigo.length < LARGO_CODIGO) return;
    const tarjeta = buscarTarjeta(codigo);
    if (tarjeta) {
      const a = await obtenerAlumno(tarjeta.alumnoId);
      setAlumno(a ?? { id: tarjeta.alumnoId, nombre: 'amigo', apellido: '', temaId: 'suave', fechaCreacion: '' });
      return;
    }
    const total = intentos + 1;
    setIntentos(total);
    setError(true);
    setCodigo('');
    if (total >= MAX_INTENTOS) {
      const hasta = Date.now() + SEGUNDOS_BLOQUEO * 1000;
      setAhora(Date.now());
      setBloqueadoHasta(hasta);
    }
  }, [alumno, bloqueado, codigo, intentos]);

  // Teclado físico: números, borrar y Enter
  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) escribir(e.key);
      else if (e.key === 'Backspace') borrar();
      else if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') entrar();
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [escribir, borrar, entrar]);

  const empezar = () => {
    if (!alumno?.id) return;
    setActiveStudentId(alumno.id);
    setRole('estudiante');
    setSessionType('casa');
    navigate(ROUTES.aprender);
  };

  const mensajeOso = alumno
    ? `¡Qué bueno verte, ${alumno.nombre}!`
    : bloqueado
      ? 'Descansemos un momento.'
      : error
        ? 'Intentemos otra vez.'
        : 'Toca los números de tu tarjeta.';

  return (
    <div className="min-h-screen bg-app text-primary lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Panel de marca */}
      <aside className="relative overflow-hidden bg-brand text-onBrand px-6 py-5 lg:py-10 lg:px-12 flex flex-col items-center justify-between gap-4 lg:gap-6 lg:sticky lg:top-0 lg:h-screen">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-onBrand/10" aria-hidden />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-onBrand/10" aria-hidden />
        {ESTRELLAS.map((e, i) => (
          <Star
            key={i}
            className={`absolute ${e.pos} ${e.tam} text-accent fill-accent animate-flotar`}
            style={{ animationDelay: `${i * 0.8}s` }}
            aria-hidden
          />
        ))}

        <div className="relative self-start flex items-center gap-3">
          <span className="w-12 h-12 rounded-control bg-onBrand/15 border-2 border-onBrand/40 flex items-center justify-center" aria-hidden>
            <BookOpen className="w-7 h-7" />
          </span>
          <div className="leading-tight">
            <p className="text-xl font-black">Leer para Todos</p>
            <p className="text-sm font-bold">Liceo Piedra Azul · Puerto Montt</p>
          </div>
        </div>

        <div className="relative flex flex-col items-center gap-5">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-center">¡Vamos a leer!</h2>
          <OsoBurbuja mensaje={mensajeOso} size="lg" />
        </div>

        <ul className="relative flex justify-center gap-2 sm:gap-3" aria-hidden>
          {PICTOGRAMAS_DECORATIVOS.map((nombre, i) => (
            <li key={nombre} className={`w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-white rounded-control p-1.5 shadow-card ${GIROS[i]}`}>
              <img src={`${BASE}pictogramas/arasaac/${nombre}.png`.replace(/\/\//g, '/')} alt="" className="w-full h-full object-contain" />
            </li>
          ))}
        </ul>
      </aside>

      {/* Panel de ingreso */}
      <main className="relative overflow-hidden flex flex-col items-center px-4 py-5 lg:py-6 [background-image:radial-gradient(var(--border-color)_1.5px,transparent_1.5px)] [background-size:26px_26px]">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-brand/10" aria-hidden />
        <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-accent/30" aria-hidden />

        <div className="relative w-full max-w-lg flex justify-end">
          <AccionesDiscretas />
        </div>

        <div className="relative flex-1 w-full max-w-lg flex flex-col justify-center gap-4 py-3">
          <div className="bg-surface rounded-card border-2 border-borderCustom shadow-card p-6 sm:p-8 [@media(max-height:820px)]:py-4 flex flex-col gap-5 [@media(max-height:820px)]:gap-3">
            {alumno ? (
              <div className="flex flex-col items-center gap-5 text-center py-6">
                {alumno.avatarUrl ? (
                  <img
                    src={alumno.avatarUrl}
                    alt={`Foto de ${alumno.nombre}`}
                    className="w-36 h-36 rounded-full object-cover border-4 border-brand shadow-card"
                  />
                ) : (
                  <span className="w-36 h-36 rounded-full bg-surface border-4 border-brand shadow-card flex items-center justify-center text-6xl font-black text-brand" aria-hidden>
                    {alumno.nombre.charAt(0).toUpperCase()}
                  </span>
                )}
                <div>
                  <h1 className="text-4xl font-black text-primary">¡Hola, {alumno.nombre}!</h1>
                  <p className="text-lg font-bold text-secondary mt-1">Vamos a leer.</p>
                </div>
                <Button size="xl" fullWidth onClick={empezar}>
                  Empezar
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 sm:gap-4">
                  <TarjetaIlustrada className="w-20 sm:w-28 shrink-0" />
                  <div className="flex flex-col gap-1 flex-1">
                    <h1 className="text-2xl sm:text-4xl font-black text-primary">Tu tarjeta</h1>
                    <p className="text-base sm:text-lg font-bold text-secondary">Toca los números.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => hablar('Toca los números de tu tarjeta. Después toca la palomita.')}
                    aria-label="Escuchar las instrucciones"
                    className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full bg-accent text-onAccent border-2 border-borderStrong flex items-center justify-center cursor-pointer hover:bg-accent-hover transition-colors"
                  >
                    <Volume2 className="w-7 h-7" aria-hidden />
                  </button>
                </div>

                <CasillasCodigo valor={codigo} largo={LARGO_CODIGO} error={error || bloqueado} />

                <div className="min-h-12" role="alert">
                  {bloqueado ? (
                    <p className="flex items-center justify-center gap-2 text-center text-base font-extrabold text-statusWarn bg-statusWarn-bg border-2 border-statusWarn rounded-control px-4 py-2">
                      <Clock className="w-5 h-5 shrink-0" aria-hidden />
                      Descansemos un momento. Podrás intentar de nuevo en {segundosRestantes} segundos.
                    </p>
                  ) : error ? (
                    <p className="text-center text-base font-extrabold text-statusDanger bg-statusDanger-bg border-2 border-statusDanger rounded-control px-4 py-2">
                      Ese número no está. Intentemos otra vez.
                    </p>
                  ) : null}
                </div>

                <TecladoCodigo
                  onDigito={escribir}
                  onBorrar={borrar}
                  onEntrar={entrar}
                  puedeEntrar={codigo.length === LARGO_CODIGO}
                  disabled={bloqueado}
                />

                <div className="flex flex-col items-center gap-1 border-t-2 border-borderCustom pt-3">
                  <TarjetasDeEjemplo onElegir={(c) => { setError(false); setCodigo(c); }} nombres={nombres} />
                  <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.aulaEspera)}>
                    <School className="w-4 h-4" aria-hidden />
                    Estoy en el laboratorio
                  </Button>
                </div>
              </>
            )}
          </div>
          <p className="text-center text-sm font-semibold text-secondary">Prototipo de demostración · Datos ficticios</p>
        </div>
      </main>
    </div>
  );
};
