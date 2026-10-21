import React from 'react';
import { MuestraComponentes } from '@/features/muestra/MuestraComponentes';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAlumno, RequireDocente, RequireSesionAula } from './guards';
import { ROUTES } from './routes';
import { LoginProfesorView } from '@/features/acceso/pages/LoginProfesorView';
import { LoginAlumnoCasaView } from '@/features/acceso/pages/LoginAlumnoCasaView';
import { EsperaAulaView } from '@/features/acceso/pages/EsperaAulaView';
import { MosaicoAlumnos } from '@/features/acceso/pages/MosaicoAlumnos';
import { VistaPrincipal } from '@/features/inicio/VistaPrincipal';
import { NivelesView } from '@/features/aprender/pages/NivelesView';
import { CatalogoCuentos } from '@/features/aprender/pages/CatalogoCuentos';
import { ActividadesView } from '@/features/aprender/actividades/ActividadesView';
import { ActividadesPage } from '@/features/docente/pages/ActividadesPage';
import { InformePage } from '@/features/docente/pages/InformePage';
import { LecturaView } from '@/features/aprender/pages/LecturaView';
import { ControlAulaView } from '@/features/docente/pages/ControlAulaView';
import { AdminDashboard } from '@/features/docente/pages/AdminDashboard';
import { CuentosPage } from '@/features/docente/pages/CuentosPage';
import { TarjetasPage } from '@/features/docente/pages/TarjetasPage';
import { EstudiantesPage } from '@/features/docente/pages/EstudiantesPage';

export const App: React.FC = () => (
  <Routes>
    {/* Acceso */}
    <Route path={ROUTES.inicio} element={<LoginAlumnoCasaView />} />
    <Route path={ROUTES.muestra} element={<MuestraComponentes />} />
    <Route path={ROUTES.profesorLogin} element={<LoginProfesorView />} />
    <Route path={ROUTES.aulaEspera} element={<EsperaAulaView />} />

    {/* Docente */}
    <Route element={<RequireDocente />}>
      <Route path={ROUTES.profesorAula} element={<ControlAulaView />} />
      <Route path={ROUTES.profesorPanel} element={<AdminDashboard />} />
      <Route path={ROUTES.profesorEstudiantes} element={<EstudiantesPage />} />
      <Route path={ROUTES.profesorActividades} element={<ActividadesPage />} />
      <Route path={ROUTES.profesorInforme(':alumnoId')} element={<InformePage />} />
      <Route path={ROUTES.profesorCuentos} element={<CuentosPage />} />
      <Route path={ROUTES.profesorTarjetas} element={<TarjetasPage />} />
    </Route>

    {/* Aula */}
    <Route element={<RequireSesionAula />}>
      <Route path={ROUTES.aulaAlumnos} element={<MosaicoAlumnos />} />
    </Route>

    {/* Alumno */}
    <Route element={<RequireAlumno />}>
      <Route path={ROUTES.menu} element={<VistaPrincipal />} />
      <Route path={ROUTES.aprender} element={<NivelesView />} />
      <Route path={`${ROUTES.aprender}/:nivelId`} element={<CatalogoCuentos />} />
      <Route path={`${ROUTES.aprender}/:nivelId/:cuentoId`} element={<LecturaView />} />
      <Route path={`${ROUTES.aprender}/:nivelId/:cuentoId/jugar`} element={<ActividadesView />} />
    </Route>

    <Route path="*" element={<Navigate to={ROUTES.inicio} replace />} />
  </Routes>
);

export default App;
