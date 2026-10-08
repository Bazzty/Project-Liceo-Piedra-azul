import React from 'react';
import { MainLayout } from './layouts/MainLayout';
import { Button } from './components/common/Button';
import { AudioButton } from './components/common/AudioButton';

export function App() {
  return (
    <MainLayout>
      <div className="bg-surface p-6 md:p-8 rounded-3xl border-4 border-borderCustom shadow-lg space-y-6">
        <h1 className="text-3xl font-extrabold text-primary">
          PRUEBA FASE 2: Shell Visual y Componentes Base
        </h1>
        <p className="text-secondary text-lg">
          Esta es la tarjeta central neutra donde se cargará el catálogo de cuentos y actividades.
        </p>

        {/* Sección de Botones */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-primary">Botones Accesibles:</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Botón Principal</Button>
            <Button variant="secondary">Botón Secundario</Button>
            <Button variant="accent">Botón Destacado</Button>
            <AudioButton label="Audio de Ejemplo" />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default App;