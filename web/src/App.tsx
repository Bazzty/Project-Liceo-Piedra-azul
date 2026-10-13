import { useState, useEffect } from 'react';
import { Login } from './pages/Login';
import { MosaicoAlumnos } from './pages/MosaicoAlumnos';
import { VistaPrincipal } from './pages/VistaPrincipal';
import { NivelesView } from './pages/NivelesView';
import { CatalogoCuentos } from './pages/CatalogoCuentos';
import { LecturaView } from './pages/LecturaView';
import { useAuthStore } from './store/useAuthStore';
import { seedDatabase } from './db/seed';

export function App() {
  const { isAuthenticated, activeStudentId, checkSessionTimeout } = useAuthStore();
  const [currentScreen, setCurrentScreen] = useState<'login' | 'mosaico' | 'home' | 'niveles' | 'catalogo' | 'lectura'>('login');
  const [selectedNivelId, setSelectedNivelId] = useState('nivel-a');
  const [selectedCuentoId, setSelectedCuentoId] = useState('');

  // Poblamiento inicial de IndexedDB
  useEffect(() => {
    seedDatabase();
  }, []);

  useEffect(() => {
    if (checkSessionTimeout()) {
      setCurrentScreen('mosaico');
    } else if (isAuthenticated && !activeStudentId) {
      setCurrentScreen('mosaico');
    } else if (isAuthenticated && activeStudentId) {
      setCurrentScreen('home');
    }
  }, [isAuthenticated, activeStudentId, checkSessionTimeout]);

  const handleTimeoutRedirect = () => {
    setCurrentScreen('mosaico');
  };

  if (currentScreen === 'login') {
    return <Login onLoginSuccess={() => setCurrentScreen('mosaico')} />;
  }

  if (currentScreen === 'mosaico') {
    return <MosaicoAlumnos onSelectStudent={() => setCurrentScreen('home')} />;
  }

  if (currentScreen === 'niveles') {
    return (
      <NivelesView
        onSelectNivel={(nivelId) => {
          setSelectedNivelId(nivelId);
          setCurrentScreen('catalogo');
        }}
        onBack={() => setCurrentScreen('home')}
        onSessionTimeoutRedirect={handleTimeoutRedirect}
      />
    );
  }

  if (currentScreen === 'catalogo') {
    return (
      <CatalogoCuentos
        nivelId={selectedNivelId}
        onSelectCuento={(cuentoId) => {
          setSelectedCuentoId(cuentoId);
          setCurrentScreen('lectura');
        }}
        onBack={() => setCurrentScreen('niveles')}
        onSessionTimeoutRedirect={handleTimeoutRedirect}
      />
    );
  }

  if (currentScreen === 'lectura') {
    return (
      <LecturaView
        cuentoId={selectedCuentoId}
        onBack={() => setCurrentScreen('catalogo')}
        onSessionTimeoutRedirect={handleTimeoutRedirect}
      />
    );
  }

  return (
    <VistaPrincipal
      onNavigateToAprender={() => setCurrentScreen('niveles')}
      onOpenHablar={() => alert('💬 ¡El tablero SAAC se conectará en la Fase 5!')}
      onSessionTimeoutRedirect={handleTimeoutRedirect}
    />
  );
}

export default App;