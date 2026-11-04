import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginProfesorView } from '@/features/acceso/pages/LoginProfesorView';
import { ROUTES } from '@/app/routes';

const { iniciarSesionEnServidor } = vi.hoisted(() => ({ iniciarSesionEnServidor: vi.fn() }));
vi.mock('@/api/servidor', () => ({ iniciarSesionEnServidor, olvidarSesionDelServidor: vi.fn() }));

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={[ROUTES.profesorLogin]}>
      <Routes>
        <Route path={ROUTES.profesorLogin} element={<LoginProfesorView />} />
        <Route path={ROUTES.profesorPanel} element={<p>Panel docente</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe('LoginProfesorView y el servidor', () => {
  beforeEach(() => iniciarSesionEnServidor.mockReset().mockResolvedValue(true));
  afterEach(() => vi.unstubAllEnvs());

  it('al ingresar con correo y contraseña abre también sesión en el servidor y entra al panel', async () => {
    renderLogin();

    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'profe@liceo.cl');
    await userEvent.type(screen.getByLabelText(/Contraseña/), 'mi-clave');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(iniciarSesionEnServidor).toHaveBeenCalledWith('profe@liceo.cl', 'mi-clave');
    expect(screen.getByText('Panel docente')).toBeInTheDocument();
  });

  it('si el servidor no responde, igual entra al panel (la app funciona sin él)', async () => {
    iniciarSesionEnServidor.mockResolvedValue(false);
    renderLogin();

    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'profe@liceo.cl');
    await userEvent.type(screen.getByLabelText(/Contraseña/), 'mi-clave');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(screen.getByText('Panel docente')).toBeInTheDocument();
  });

  it('la cuenta de demostración usa las credenciales de desarrollo si están definidas', async () => {
    vi.stubEnv('VITE_DEMO_CORREO', 'profesora@piedraazul.cl');
    vi.stubEnv('VITE_DEMO_CLAVE', 'clave-demo');
    renderLogin();

    await userEvent.click(screen.getByRole('button', { name: 'Usar cuenta de demostración' }));

    expect(iniciarSesionEnServidor).toHaveBeenCalledWith('profesora@piedraazul.cl', 'clave-demo');
    expect(screen.getByText('Panel docente')).toBeInTheDocument();
  });

  it('sin esas credenciales la cuenta de demostración entra al panel sin llamar al servidor', async () => {
    vi.stubEnv('VITE_DEMO_CORREO', '');
    vi.stubEnv('VITE_DEMO_CLAVE', '');
    renderLogin();

    await userEvent.click(screen.getByRole('button', { name: 'Usar cuenta de demostración' }));

    expect(iniciarSesionEnServidor).not.toHaveBeenCalled();
    expect(screen.getByText('Panel docente')).toBeInTheDocument();
  });
});
