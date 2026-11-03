import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VistaPrincipal } from '@/features/inicio/VistaPrincipal';
import { ROUTES } from '@/app/routes';
import { useAuthStore } from '@/shared/store/useAuthStore';

// Sin base local: los datos del niño se simulan.
vi.mock('@/api', async (original) => ({
  ...(await original<typeof import('@/api')>()),
  useAlumno: () => ({ id: 'ana', nombre: 'Ana' }),
  useCuentos: () => [],
  useRegistrosDeAlumno: () => [],
  useProgresosDeAlumno: () => [],
}));

const renderInicio = () =>
  render(
    <MemoryRouter initialEntries={[ROUTES.menu]}>
      <Routes>
        <Route path={ROUTES.menu} element={<VistaPrincipal />} />
        <Route path={ROUTES.aprender} element={<p>Pantalla de niveles</p>} />
        <Route path={ROUTES.inicio} element={<p>Pantalla de ingreso</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe('VistaPrincipal', () => {
  beforeEach(() => {
    useAuthStore.setState({ activeStudentId: 'ana', role: 'estudiante', sessionType: 'casa', supervision: false });
  });

  it('saluda al niño por su nombre y ofrece leer, hablar y estrellas', () => {
    renderInicio();

    expect(screen.getByRole('heading', { name: 'Menú de Ana' })).toBeInTheDocument();
    expect(screen.getByText('¡Hola, Ana!')).toBeInTheDocument();
    for (const opcion of [/leer/i, /hablar/i, /estrellas/i]) {
      expect(screen.getAllByRole('button', { name: opcion }).length).toBeGreaterThan(0);
    }
  });

  it('salir cierra la sesión y vuelve al ingreso', async () => {
    renderInicio();

    await userEvent.click(screen.getByRole('button', { name: 'Salir' }));

    expect(screen.getByText('Pantalla de ingreso')).toBeInTheDocument();
    expect(useAuthStore.getState().activeStudentId).toBeNull();
  });
});
