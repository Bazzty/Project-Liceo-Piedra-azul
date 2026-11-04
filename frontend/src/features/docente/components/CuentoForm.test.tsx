import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CuentoForm } from '@/features/docente/components/CuentoForm';
import { ErrorDeServidor } from '@/api/servidor';
import { useAuthStore } from '@/shared/store/useAuthStore';
import type { Cuento } from '@/types';

const { actualizarCuento, generarAudio, generarCuentoConIa, listarPictogramas } = vi.hoisted(() => ({
  generarCuentoConIa: vi.fn(),
  actualizarCuento: vi.fn(),
  generarAudio: vi.fn(),
  listarPictogramas: vi.fn(async () => []),
}));

vi.mock('@/api', () => ({
  useNiveles: () => [{ id: 'nivel-b', codigo: 'D', nombre: 'Cuentos' }],
  listarPictogramas,
  crearCuento: vi.fn(),
  actualizarCuento,
}));
vi.mock('@/features/tablero/arasaac', async (original) => ({
  ...(await original<typeof import('@/features/tablero/arasaac')>()),
  fetchArasaacPictogramId: async () => null,
}));
vi.mock('@/api/servidor', async (original) => ({ ...(await original<typeof import('@/api/servidor')>()), generarAudio, generarCuentoConIa }));

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

    await screen.findByText(/Audio listo con la voz del proyecto/);
    expect(screen.getAllByText('· con audio')).toHaveLength(2);

    await userEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }));

    const guardado = actualizarCuento.mock.calls[0][1] as Pick<Cuento, 'paginas'>;
    expect(guardado.paginas.map((p) => p.audioPaginaUrl)).toEqual(['/audio-generado/10.mp3', '/audio-generado/11.mp3']);
  });

  it('avisa cuando se usó la voz de respaldo', async () => {
    generarAudio.mockResolvedValue({ url: '/audio-generado/x.mp3', voz: 'piper', enCache: false, respaldo: true });
    renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Generar audio' }));

    await screen.findByText(/voz de respaldo/);
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

  it('mientras se genera el audio no se puede guardar ni sugerir pictogramas', async () => {
    let terminar!: (audio: unknown) => void;
    generarAudio.mockReturnValueOnce(new Promise((resolver) => (terminar = resolver)));
    renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Generar audio' }));

    expect(screen.getByRole('button', { name: /Generando audio/ })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Guardar borrador' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Enviar a revisión' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Sugerir pictogramas' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled();

    terminar({ url: '/audio-generado/x.mp3', voz: 'elevenlabs', enCache: false, respaldo: false });
    await screen.findByText(/Audio listo/);
    expect(screen.getByRole('button', { name: 'Guardar borrador' })).toBeEnabled();
  });

  it('mientras se sugieren pictogramas no se puede generar audio', async () => {
    let terminar!: (lista: []) => void;
    listarPictogramas.mockReturnValueOnce(new Promise((resolver) => (terminar = resolver)));
    render(<CuentoForm cuento={cuento} onGuardado={vi.fn()} onCancelar={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Sugerir pictogramas' }));

    expect(screen.getByRole('button', { name: 'Generar audio' })).toBeDisabled();

    terminar([]);
    await screen.findByText(/palabra\(s\) sin pictograma|Pictogramas sugeridos/);
    expect(screen.getByRole('button', { name: 'Generar audio' })).toBeEnabled();
  });

  it('al salir del formulario deja de pedir audios', async () => {
    let terminar!: (audio: unknown) => void;
    generarAudio.mockReturnValueOnce(new Promise((resolver) => (terminar = resolver)));
    const { unmount } = renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Generar audio' }));
    unmount();
    terminar({ url: '/audio-generado/x.mp3', voz: 'elevenlabs', enCache: false, respaldo: false });
    await new Promise((resolver) => setTimeout(resolver));

    expect(generarAudio).toHaveBeenCalledTimes(1);
  });

  it('las regiones que anuncian el resultado existen antes de que haya algo que anunciar', async () => {
    generarAudio.mockRejectedValue(new ErrorDeServidor('No hay conexión con el servidor.', 0));
    renderForm();
    const aviso = screen.getByRole('alert');
    const estado = screen.getByRole('status');
    expect(aviso).toBeEmptyDOMElement();
    expect(estado).toBeEmptyDOMElement();

    await userEvent.click(screen.getByRole('button', { name: 'Generar audio' }));

    await screen.findByText('No hay conexión con el servidor.');
    expect(screen.getByRole('alert')).toBe(aviso);
    expect(aviso).toHaveTextContent('No hay conexión con el servidor.');
  });

  it('anuncia el avance de la generación', async () => {
    let terminar!: (audio: unknown) => void;
    generarAudio.mockReturnValueOnce(new Promise((resolver) => (terminar = resolver)));
    renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Generar audio' }));

    expect(screen.getByRole('status')).toHaveTextContent('Generando audio 1 de 2…');

    terminar({ url: '/audio-generado/x.mp3', voz: 'elevenlabs', enCache: false, respaldo: false });
    await screen.findByText(/Audio listo/);
  });

  it('el revisor no ve el botón de generar audio', () => {
    useAuthStore.setState({ user: { id: 'rev-1', nombre: 'Revisor PIE', email: 'revisor@piedraazul.cl', role: 'revisor' } });

    render(<CuentoForm cuento={cuento} onGuardado={vi.fn()} onCancelar={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Generar audio' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Probar voz' })).toBeInTheDocument();
  });
});

describe('CuentoForm: crear con IA', () => {
  const borrador = {
    titulo: 'El osito y el dentista',
    descripcion: 'Un osito pierde el miedo.',
    frases: ['El osito va al dentista', 'Abre la boca grande'],
  };
  const renderNuevo = () => render(<CuentoForm onGuardado={vi.fn()} onCancelar={vi.fn()} />);

  beforeEach(() => {
    useAuthStore.setState({ user: { id: 'prof-1', nombre: 'Profesora PIE', email: 'profesora@piedraazul.cl', role: 'docente' } });
    generarCuentoConIa.mockReset();
    generarCuentoConIa.mockResolvedValue(borrador);
  });

  it('llena título, descripción y páginas con el borrador y deja el cuento editable', async () => {
    renderNuevo();

    const crear = screen.getByRole('button', { name: /Crear borrador/ });
    expect(crear).toBeDisabled();
    await userEvent.type(screen.getByLabelText('¿De qué trata el cuento?'), 'El osito va al dentista');
    await userEvent.click(screen.getByRole('button', { name: /Crear borrador/ }));

    await screen.findByText(/Borrador creado con IA/);
    expect(generarCuentoConIa).toHaveBeenCalledWith({ tema: 'El osito va al dentista', nivel: 'B', paginas: 5 });
    expect(screen.getByLabelText('Título del cuento')).toHaveValue('El osito y el dentista');
    expect(screen.getByLabelText('Descripción (opcional)')).toHaveValue('Un osito pierde el miedo.');
    expect(screen.getByLabelText('Texto: una frase por página')).toHaveValue('El osito va al dentista\nAbre la boca grande');
    expect(screen.getByText('Página 2')).toBeInTheDocument();
  });

  it('muestra el motivo si la IA no responde y no toca lo escrito', async () => {
    generarCuentoConIa.mockRejectedValueOnce(new ErrorDeServidor('La IA de cuentos aún no está activada en este servidor.', 503));
    renderNuevo();
    await userEvent.type(screen.getByLabelText('Título del cuento'), 'Mi cuento');
    await userEvent.type(screen.getByLabelText('¿De qué trata el cuento?'), 'un gato');

    await userEvent.click(screen.getByRole('button', { name: /Crear borrador/ }));

    expect(await screen.findByText('La IA de cuentos aún no está activada en este servidor.')).toBeInTheDocument();
    expect(screen.getByLabelText('Título del cuento')).toHaveValue('Mi cuento');
  });

  it('pide confirmación antes de reemplazar un texto que ya existe', async () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<CuentoForm cuento={cuento} onGuardado={vi.fn()} onCancelar={vi.fn()} />);
    await userEvent.type(screen.getByLabelText('¿De qué trata el cuento?'), 'un gato');

    await userEvent.click(screen.getByRole('button', { name: /Crear borrador/ }));

    expect(confirmar).toHaveBeenCalled();
    expect(generarCuentoConIa).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Título del cuento')).toHaveValue('El oso');
    confirmar.mockRestore();
  });

  it('no se ofrece al revisor, que solo valida cuentos', () => {
    useAuthStore.setState({ user: { id: 'rev-1', nombre: 'Revisora', email: 'rev@piedraazul.cl', role: 'revisor' } });
    renderNuevo();

    expect(screen.queryByRole('button', { name: /Crear borrador/ })).not.toBeInTheDocument();
  });
});
