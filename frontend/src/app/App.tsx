import React, { useState } from 'react';
import { useAuthStore } from '@/features/acceso/useAuthStore';
import { SelectorInicioView } from '@/features/acceso/pages/SelectorInicioView';
import { PortalInicioView } from '@/features/acceso/pages/PortalInicioView';
import { LoginProfesorView } from '@/features/acceso/pages/LoginProfesorView';
import { ControlAulaView } from '@/features/docente/pages/ControlAulaView';
import { EsperaAulaView } from '@/features/acceso/pages/EsperaAulaView';
import { LoginAlumnoCasaView } from '@/features/acceso/pages/LoginAlumnoCasaView';
import { MosaicoAlumnos } from '@/features/acceso/pages/MosaicoAlumnos';
import { VistaPrincipal } from '@/features/inicio/VistaPrincipal';
import { NivelesView } from '@/features/aprender/pages/NivelesView';
import { CatalogoCuentos } from '@/features/aprender/pages/CatalogoCuentos';
import { LecturaView } from '@/features/aprender/pages/LecturaView';
import { AdminDashboard } from '@/features/docente/pages/AdminDashboard';
import { db } from '@/db/db';
import { useThemeStore, type ThemeId } from '@/shared/store/useThemeStore';
import { usePlayerStore } from '@/shared/store/usePlayerStore';
import { THEMES_CONFIG } from '@/shared/config/themes';

export const App: React.FC = () => {
  const { modoInicio, vistaInicio1, setVistaInicio1, isClassroomSessionActive, sessionType, setActiveStudentId } = useAuthStore();

  const [currentScreen, setCurrentScreen] = useState<'niveles' | 'catalogo' | 'lectura'>('niveles');
  const [selectedNivelId, setSelectedNivelId] = useState<string | null>(null);
  const [selectedCuentoId, setSelectedCuentoId] = useState<string | null>(null);

  // 1. Selector Inicial de Modo Demo
  if (modoInicio === 'selector') {
    return <SelectorInicioView />;
  }

  // 2. Modo Inicio 2 (Demostración Directa)
  if (modoInicio === 'inicio-2') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-app p-6 text-center gap-4">
        <div className="bg-surface border-4 border-borderCustom rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center gap-4">
          <h2 className="text-2xl font-black text-primary">Inicio 2 (Modo Directo)</h2>
          <p className="text-secondary text-sm">
            Este modo de inicio está siendo integrado por el segundo equipo de desarrollo.
          </p>
          <button
            onClick={() => useAuthStore.getState().setModoInicio('selector')}
            className="px-6 py-3 rounded-2xl bg-brand text-onBrand font-black shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
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
      return <EsperaAulaView />;
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