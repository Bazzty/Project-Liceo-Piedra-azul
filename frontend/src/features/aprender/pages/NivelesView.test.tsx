import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NivelesView } from '@/features/aprender/pages/NivelesView';
import { ROUTES } from '@/app/routes';
import { useAjustesStore } from '@/shared/store/useAjustesStore';
import { useAuthStore } from '@/shared/store/useAuthStore';

const { hablar, callar } = vi.hoisted(() => ({ hablar: vi.fn(), callar: vi.fn() }));

vi.mock('@/shared/hooks/useHablar', () => ({ useHablar: () => hablar, callar }));

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
    hablar.mockClear();
    callar.mockClear();
    useAjustesStore.setState({ sonido: true });
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

  it('el osito dice las instrucciones con su grabación al abrir y deja la acción principal enfocada', async () => {
    renderNiveles();

    await userEvent.click(screen.getByRole('button', { name: 'Nivel A: Sílabas' }));

    expect(hablar).toHaveBeenCalledWith(expect.stringContaining('Vamos a jugar con sílabas'), 'instrucciones_silabas');
    expect(screen.getByRole('button', { name: 'Entendido' })).toHaveFocus();
  });

  it.each(['Cerrar', 'Entendido'])('al tocar %s el osito se calla', async (boton) => {
    renderNiveles();

    await userEvent.click(screen.getByRole('button', { name: 'Nivel B: Vocales' }));
    expect(callar).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: boton }));

    expect(callar).toHaveBeenCalled();
  });

  it('sin sonido entra directo al nivel, porque las instrucciones serían solo texto', async () => {
    useAjustesStore.setState({ sonido: false });
    renderNiveles();

    await userEvent.click(screen.getByRole('button', { name: 'Nivel A: Sílabas' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Catálogo del nivel')).toBeInTheDocument();
  });
});
