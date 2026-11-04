import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TarjetaRevision } from '@/features/docente/components/GestionCuentos';
import type { Cuento } from '@/types';

const { actualizarCuento } = vi.hoisted(() => ({ actualizarCuento: vi.fn() }));

vi.mock('@/api', () => ({
  actualizarCuento,
  eliminarCuento: vi.fn(),
  useCuentos: () => [],
  useNiveles: () => [],
}));

const cuento: Cuento = {
  id: 'cuento-1',
  nivelId: 'nivel-b',
  titulo: 'El oso',
  descripcion: '',
  estado: 'en_revision',
  fechaCreacion: '2026-11-03T00:00:00.000Z',
  paginas: [
    {
      numeroPagina: 1,
      textoCompleto: 'El oso lee',
      audioPaginaUrl: '/audio/uno.mp3',
      palabras: [{ texto: 'El' }, { texto: 'oso', pictogramaUrl: '/p/oso.png' }, { texto: 'lee' }],
    },
    { numeroPagina: 2, textoCompleto: 'Mamá sonríe', palabras: [{ texto: 'Mamá' }, { texto: 'sonríe' }] },
  ],
};

const renderTarjeta = (puedeRevisar = true) =>
  render(<TarjetaRevision cuento={cuento} puedeRevisar={puedeRevisar} abierta onAbrir={vi.fn()} />);

const marcarLista = async () => {
  for (const caja of screen.getAllByRole('checkbox')) await userEvent.click(caja);
};

describe('TarjetaRevision', () => {
  beforeEach(() => actualizarCuento.mockReset());

  it('muestra todas las páginas con pictogramas y audio por página', () => {
    const { container } = renderTarjeta();

    expect(screen.getByText('Página 1')).toBeInTheDocument();
    expect(screen.getByText('Página 2')).toBeInTheDocument();
    expect(screen.getByAltText('oso')).toHaveAttribute('src', '/p/oso.png');
    expect(screen.getByText('Mamá sonríe')).toBeInTheDocument();
    expect(container.querySelector('audio')).toHaveAttribute('src', '/audio/uno.mp3');
    expect(screen.getByLabelText('Audio de la página 1')).toBeInTheDocument();
    expect(screen.getByText(/Esta página no tiene audio/)).toBeInTheDocument();
  });

  it('no deja aprobar hasta marcar toda la lista, pero sí devolver', async () => {
    actualizarCuento.mockResolvedValue(undefined);
    renderTarjeta();

    const aprobar = screen.getByRole('button', { name: 'Aprobar' });
    expect(aprobar).toBeDisabled();
    expect(aprobar).toHaveAccessibleDescription(/marca los tres puntos/);
    const cajas = screen.getAllByRole('checkbox');
    await userEvent.click(cajas[0]);
    await userEvent.click(cajas[1]);
    expect(aprobar).toBeDisabled();
    await userEvent.click(cajas[2]);
    expect(aprobar).toBeEnabled();

    await userEvent.click(aprobar);
    await waitFor(() => expect(actualizarCuento).toHaveBeenCalledWith('cuento-1', expect.objectContaining({ estado: 'publicado' })));
  });

  it('devolver no exige la lista y guarda el comentario', async () => {
    actualizarCuento.mockResolvedValue(undefined);
    renderTarjeta();

    await userEvent.type(screen.getByLabelText(/Comentario para la docente/), 'Falta un pictograma');
    await userEvent.click(screen.getByRole('button', { name: 'Devolver' }));

    await waitFor(() =>
      expect(actualizarCuento).toHaveBeenCalledWith('cuento-1', expect.objectContaining({ estado: 'borrador', comentarioRevision: 'Falta un pictograma' })),
    );
  });

  it('si falla muestra el error y deja reintentar; un doble clic solo envía una vez', async () => {
    let fallar!: (e: Error) => void;
    actualizarCuento.mockReturnValueOnce(new Promise((_ok, rechazar) => (fallar = rechazar)));
    renderTarjeta();
    await marcarLista();

    await userEvent.dblClick(screen.getByRole('button', { name: 'Aprobar' }));
    expect(actualizarCuento).toHaveBeenCalledTimes(1);
    fallar(new Error('sin base'));

    expect(await screen.findByText('No se pudo aprobar el cuento. Intenta de nuevo.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo aprobar');
    expect(screen.getByRole('button', { name: 'Aprobar' })).toBeEnabled();
  });

  it('quien no es revisor no ve botones de resolver', () => {
    renderTarjeta(false);

    expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument();
    expect(screen.getByText(/Solo el revisor puede aprobar/)).toBeInTheDocument();
  });
});
