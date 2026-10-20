import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { SelectorInicioView } from './pages/SelectorInicioView';
import { PortalInicioView } from './pages/PortalInicioView';
import { LoginProfesorView } from './pages/LoginProfesorView';
import { ControlAulaView } from './pages/ControlAulaView';
import { EsperaAulaView } from './pages/EsperaAulaView';
import { LoginAlumnoCasaView } from './pages/LoginAlumnoCasaView';
import { MosaicoAlumnos } from './pages/MosaicoAlumnos';
import { VistaPrincipal } from './pages/VistaPrincipal';
import { NivelesView } from './pages/NivelesView';
import { CatalogoCuentos } from './pages/CatalogoCuentos';
import { LecturaView } from './pages/LecturaView';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { db } from './db/db';
import { useThemeStore, type ThemeId } from './store/useThemeStore';
import { usePlayerStore } from './store/usePlayerStore';
import { THEMES_CONFIG } from './config/themes';

export const App: React.FC = () => {
  const { modoInicio, vistaInicio1, setVistaInicio1, isClassroomSessionActive, sessionType, setActiveStudentId } = useAuthStore();
  const [currentScreen, setCurrentScreen] = useState<'niveles' | 'catalogo' | 'lectura'>('niveles');

  // CORRECCIÓN LÍNEAS 24-25: Tipo explícito para evitar "SetStateAction"
  const [selectedNivelId, setSelectedNivelId] = useState<string | null>(null);
  const [selectedCuentoId, setSelectedCuentoId] = useState<string | null>(null);

  // Manejo del historial del navegador (Fase 6: Captura del evento "Atrás")
  useEffect(() => {
    if (!window.history.state?.vista) {
      window.history.replaceState({ vista: useAuthStore.getState().vistaInicio1 }, '');
    }
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.vista) {
        useAuthStore.setState({ vistaInicio1: event.state.vista });
      } else {
        useAuthStore.setState({ vistaInicio1: 'portal' });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 1. Selector Inicial de Modo Demo
  if (modoInicio === 'selector') {
    return <SelectorInicioView />;
  }

  // 2. Modo Inicio 2 (Demostración Directa)
  if (modoInicio === 'inicio-2') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
          <h1 className="text-2xl font-black text-gray-800">Inicio 2 (Modo Directo)</h1>
          <p className="text-gray-600">Este modo de inicio está siendo integrado por el segundo equipo de desarrollo.</p>
          <button
            onClick={() => useAuthStore.getState().setModoInicio('selector')}
            className="px-6 py-3 rounded-2xl bg-brand text-white font-black shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            VOLVER AL SELECTOR
          </button>
        </div>
      </div>
    );
  }

  // 3. Sub-rutas de Inicio 1
  if (vistaInicio1 === 'portal') return <PortalInicioView />;
  if (vistaInicio1 === 'profesor-login') return <LoginProfesorView />;
  if (vistaInicio1 === 'control-aula') return <ControlAulaView />;
  if (vistaInicio1 === 'panel-docente') return <AdminDashboard />;
  if (vistaInicio1 === 'aula-espera') return <EsperaAulaView />;
  if (vistaInicio1 === 'alumno-casa') return <LoginAlumnoCasaView />;

  // 4. Mosaico de Alumnos
  if (vistaInicio1 === 'aula-mosaico') {
    if (!isClassroomSessionActive && sessionType !== 'casa') {
      return <PortalInicioView />;
    }
    return (
      <MosaicoAlumnos
        onSelectStudent={async (studentId) => {
          setActiveStudentId(studentId);
          setVistaInicio1('menu');
          // Aplica el color y la voz que el docente asignó a este alumno
          const alumno = await db.alumnos.get(studentId);
          if (alumno && THEMES_CONFIG.some((t) => t.id === alumno.temaId)) {
            useThemeStore.getState().setTheme(alumno.temaId as ThemeId);
          }
          if (alumno?.vozId) usePlayerStore.getState().setSelectedVoice(alumno.vozId);
        }}
      />
    );
  }

  // 5. Menú Principal del Estudiante (VistaPrincipal)
  if (vistaInicio1 === 'menu') {
    return (
      <VistaPrincipal
        onNavigateToAprender={() => {
          setSelectedNivelId(null);
          setCurrentScreen('niveles');
          setVistaInicio1('aprender');
        }}
        onSessionTimeoutRedirect={() => setVistaInicio1('portal')}
      />
    );
  }

  // 6. Navegación en el Módulo Aprender (Lectura)
  if (vistaInicio1 === 'aprender') {
    if (currentScreen === 'lectura' && selectedCuentoId) {
      return (
        <LecturaView
          cuentoId={selectedCuentoId}
          onBack={() => setCurrentScreen('catalogo')}
        />
      );
    }
    if (currentScreen === 'catalogo' && selectedNivelId) {
      return (
        <CatalogoCuentos
          nivelId={selectedNivelId}
          onSelectCuento={(cuentoId) => {
            setSelectedCuentoId(cuentoId);
            setCurrentScreen('lectura');
          }}
          onBack={() => {
            setSelectedNivelId(null);
            setCurrentScreen('niveles');
          }}
        />
      );
    }
    return (
      <NivelesView
        onSelectNivel={(nivelId) => {
          setSelectedNivelId(nivelId);
          setCurrentScreen('catalogo');
        }}
        onBack={() => setVistaInicio1('menu')}
      />
    );
  }

  return <PortalInicioView />;
};

export default App;