import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LecturaView } from '@/features/aprender/pages/LecturaView';
import { useAuthStore } from '@/shared/store/useAuthStore';

const { registrarProgreso } = vi.hoisted(() => ({ registrarProgreso: vi.fn() }));

// Sin base local: un cuento de dos páginas.
vi.mock('@/api', async (original) => ({
  ...(await original<typeof import('@/api')>()),
  useAlumno: () => ({ id: 'ana', nombre: 'Ana' }),
  useCuento: () => ({
    id: 'cuento-1',
    titulo: 'El sol',
    paginas: [{ palabras: [{ texto: 'sol', clave: 'sol' }] }, { palabras: [{ texto: 'luna', clave: 'luna' }] }],
  }),
  usePictogramaPorPalabra: () => undefined,
  registrarProgreso,
  crearRegistro: vi.fn(),
}));
vi.mock('@/features/estrellas/useColeccion', () => ({ useColeccion: () => ({ progresos: [], siguiente: null }) }));
vi.mock('@/shared/audio/sonidos', () => ({ sonarToque: vi.fn(), sonarAcierto: vi.fn() }));

const renderLectura = () =>
  render(
    <MemoryRouter initialEntries={['/leer/nivel-a/cuento-1']}>
      <Routes>
        <Route path="/leer/:nivelId/:cuentoId" element={<LecturaView />} />
      </Routes>
    </MemoryRouter>,
  );

describe('LecturaView', () => {
  beforeEach(() => {
    registrarProgreso.mockClear();
    useAuthStore.setState({ activeStudentId: 'ana', role: 'estudiante', sessionType: 'casa', supervision: false });
  });

  it('en la primera página no se puede retroceder y la flecha avanza', async () => {
    renderLectura();

    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    expect(screen.getByText('sol')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));

    expect(screen.getByText('luna')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeEnabled();
  });

  it('en la última página la flecha termina el cuento y guarda el avance', async () => {
    renderLectura();

    await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    await userEvent.click(screen.getByRole('button', { name: 'Terminar' }));

    expect(await screen.findByText('¡Muy bien!')).toBeInTheDocument();
    expect(registrarProgreso).toHaveBeenCalledWith(expect.objectContaining({ alumnoId: 'ana', cuentoId: 'cuento-1', completado: true }));
  });
});
