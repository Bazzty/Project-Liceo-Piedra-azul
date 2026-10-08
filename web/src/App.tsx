import React, { useState, useEffect } from 'react';
import { Login } from './pages/Login';
import { MosaicoAlumnos } from './pages/MosaicoAlumnos';
import { VistaPrincipal } from './pages/VistaPrincipal';
import { useAuthStore } from './store/useAuthStore';

export function App() {
  const {
    isAuthenticated,
    activeStudentId,
    checkSessionTimeout,
  } = useAuthStore();

  const [currentScreen, setCurrentScreen] = useState<
    'login' | 'mosaico' | 'home'
  >('login');

  useEffect(() => {
    if (checkSessionTimeout()) {
      setCurrentScreen('mosaico');
    } else if (isAuthenticated && !activeStudentId) {
      setCurrentScreen('mosaico');
    } else if (isAuthenticated && activeStudentId) {
      setCurrentScreen('home');
    }
  }, [isAuthenticated, activeStudentId, checkSessionTimeout]);

  if (currentScreen === 'login') {
    return (
      <Login
        onSuccessLogin={() => setCurrentScreen('mosaico')}
      />
    );
  }

  if (currentScreen === 'mosaico') {
    return (
      <MosaicoAlumnos
        onSelectStudent={() => setCurrentScreen('home')}
      />
    );
  }

  return (
    <VistaPrincipal
      onNavigateToAprender={() =>
        alert(
          '📚 ¡En la próxima sesión construiremos el catálogo de Niveles y Cuentos!'
        )
      }
      onOpenHablar={() =>
        alert(
          '💬 ¡El tablero SAAC lo conectaremos en la Fase 5!'
        )
      }
    />
  );
}

export default App;