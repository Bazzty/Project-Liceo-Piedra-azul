import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NivelesView } from '@/features/aprender/pages/NivelesView';
import { ROUTES } from '@/app/routes';
import { useAuthStore } from '@/shared/store/useAuthStore';

// Sin base local: cada nivel tiene un cuento publicado.
vi.mock('@/api', async (original) => ({
  ...(await original<typeof import('@/api')>()),
  useAlumno: () => ({ id: 'ana', nombre: 'Ana' }),
  useCuentosDeNivel: (nivelId: string) => [{ id: `cuento-${nivelId}`, nivelId, estado: 'publicado' }],
  useProgresosDeAlumno: () => [],
}));

const renderNiveles = () =>
  render(
    <MemoryRouter initialEntries={[ROUTES.aprender]}>
      <Routes>
        <Route path={ROUTES.aprender} element={<NivelesView />} />
        <Route path={`${ROUTES.aprender}/:nivelId`} element={<p>Catálogo del nivel</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe('NivelesView', () => {
  beforeEach(() => {
    useAuthStore.setState({ activeStudentId: 'ana', role: 'estudiante', sessionType: 'casa', supervision: false });
  });

  it('muestra sílabas como primer nivel y vocales como segundo', () => {
    renderNiveles();

    expect(screen.getByRole('button', { name: 'Nivel A: Sílabas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nivel B: Vocales' })).toBeInTheDocument();
  });

  it('antes de entrar muestra las instrucciones y entra al tocar Entendido', async () => {
    renderNiveles();

    await userEvent.click(screen.getByRole('button', { name: 'Nivel A: Sílabas' }));

    expect(screen.getByRole('dialog', { name: 'Nivel A: Sílabas' })).toBeInTheDocument();
    expect(screen.getByText(/Vamos a jugar con sílabas/)).toBeInTheDocument();
    expect(screen.queryByText('Catálogo del nivel')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Entendido' }));

    expect(screen.getByText('Catálogo del nivel')).toBeInTheDocument();
  });

  it('cerrar las instrucciones deja al niño en el camino de niveles', async () => {
    renderNiveles();

    await userEvent.click(screen.getByRole('button', { name: 'Nivel B: Vocales' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Catálogo del nivel')).not.toBeInTheDocument();
  });
});
