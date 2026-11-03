import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CuentoForm } from '@/features/docente/components/CuentoForm';
import { ErrorDeServidor } from '@/api/servidor';
import { useAuthStore } from '@/shared/store/useAuthStore';
import type { Cuento } from '@/types';

const { actualizarCuento, generarAudio } = vi.hoisted(() => ({ actualizarCuento: vi.fn(), generarAudio: vi.fn() }));

vi.mock('@/api', () => ({
  useNiveles: () => [{ id: 'nivel-b', codigo: 'D', nombre: 'Cuentos' }],
  listarPictogramas: async () => [],
  crearCuento: vi.fn(),
  actualizarCuento,
}));
vi.mock('@/api/servidor', async (original) => ({ ...(await original<typeof import('@/api/servidor')>()), generarAudio }));

const cuento: Cuento = {
  id: 'cuento-1',
  nivelId: 'nivel-b',
  titulo: 'El oso',
  descripcion: '',
  estado: 'borrador',
  fechaCreacion: '2026-11-03T00:00:00.000Z',
  paginas: [
    { numeroPagina: 1, textoCompleto: 'El oso lee', palabras: [{ texto: 'El' }, { texto: 'oso' }, { texto: 'lee' }] },
    { numeroPagina: 2, textoCompleto: 'Mamá sonríe', palabras: [{ texto: 'Mamá' }, { texto: 'sonríe' }] },
  ],
};

const renderForm = () => render(<CuentoForm cuento={cuento} onGuardado={vi.fn()} onCancelar={vi.fn()} />);

describe('CuentoForm: audio del cuento', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { id: 'prof-1', nombre: 'Profesora PIE', email: 'profesora@piedraazul.cl', role: 'docente' } });
    actualizarCuento.mockReset();
    generarAudio.mockReset();
    generarAudio.mockImplementation(async (texto: string) => ({ url: `/audio-generado/${texto.length}.mp3`, voz: 'elevenlabs', enCache: false, respaldo: false }));
  });

  it('genera el audio de cada página y lo guarda con el cuento', async () => {
    renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Generar audio' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Audio listo con la voz del proyecto');
    expect(screen.getAllByText('· con audio')).toHaveLength(2);

    await userEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }));

    const guardado = actualizarCuento.mock.calls[0][1] as Pick<Cuento, 'paginas'>;
    expect(guardado.paginas.map((p) => p.audioPaginaUrl)).toEqual(['/audio-generado/10.mp3', '/audio-generado/11.mp3']);
  });

  it('avisa cuando se usó la voz de respaldo', async () => {
    generarAudio.mockResolvedValue({ url: '/audio-generado/x.mp3', voz: 'piper', enCache: false, respaldo: true });
    renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Generar audio' }));

    expect(await screen.findByRole('status')).toHaveTextContent('voz de respaldo');
  });

  it('muestra el error del servidor y no marca ninguna página con audio', async () => {
    generarAudio.mockRejectedValue(new ErrorDeServidor('No hay conexión con el servidor.', 0));
    renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Generar audio' }));

    expect(await screen.findByText('No hay conexión con el servidor.')).toBeInTheDocument();
    expect(screen.queryByText('· con audio')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generar audio' })).toBeEnabled();
  });
});

describe('CuentoForm: casos de borde del audio', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { id: 'prof-1', nombre: 'Profesora PIE', email: 'profesora@piedraazul.cl', role: 'docente' } });
    generarAudio.mockReset();
    generarAudio.mockImplementation(async (texto: string) => ({ url: `/audio-generado/${texto.length}.mp3`, voz: 'elevenlabs', enCache: false, respaldo: false }));
  });

  it('corregir una página no borra el audio de las que no cambiaron, aunque tengan puntuación', async () => {
    render(<CuentoForm onGuardado={vi.fn()} onCancelar={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Texto: una frase por página'), 'El oso lee.{Enter}Mamá sonríe.');
    await userEvent.click(screen.getByRole('button', { name: 'Generar audio' }));
    await screen.findByText(/Audio listo/);
    expect(screen.getAllByText('· con audio')).toHaveLength(2);

    await userEvent.type(screen.getByLabelText('Texto: una frase por página'), ' mucho');

    // Solo la página editada pierde su audio (su texto ya es otro)
    expect(screen.getAllByText('· con audio')).toHaveLength(1);
  });

  it('si una página falla, las anteriores conservan su audio y se dice cuántas quedaron', async () => {
    generarAudio.mockResolvedValueOnce({ url: '/audio-generado/uno.mp3', voz: 'elevenlabs', enCache: false, respaldo: false });
    generarAudio.mockRejectedValueOnce(new ErrorDeServidor('Se pidieron muchos audios seguidos. Espera un minuto y vuelve a intentar.', 429));
    render(<CuentoForm cuento={cuento} onGuardado={vi.fn()} onCancelar={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Generar audio' }));

    expect(await screen.findByText(/Quedó 1 página con audio; vuelve a intentar para terminar/)).toBeInTheDocument();
    expect(screen.getAllByText('· con audio')).toHaveLength(1);
  });

  it('el revisor no ve el botón de generar audio', () => {
    useAuthStore.setState({ user: { id: 'rev-1', nombre: 'Revisor PIE', email: 'revisor@piedraazul.cl', role: 'revisor' } });

    render(<CuentoForm cuento={cuento} onGuardado={vi.fn()} onCancelar={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Generar audio' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Probar voz' })).toBeInTheDocument();
  });
});
