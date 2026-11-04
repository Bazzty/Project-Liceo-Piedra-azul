import { StrictMode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CuentoForm } from '@/features/docente/components/CuentoForm';
import { ErrorDeServidor } from '@/api/servidor';
import { useAuthStore } from '@/shared/store/useAuthStore';
import type { Cuento } from '@/types';

const { actualizarCuento, calentarIaDeCuentos, crearCuento, generarAudio, generarCuentoConIa, listarPictogramas } = vi.hoisted(() => ({
  generarCuentoConIa: vi.fn(),
  calentarIaDeCuentos: vi.fn(),
  crearCuento: vi.fn(),
  actualizarCuento: vi.fn(),
  generarAudio: vi.fn(),
  listarPictogramas: vi.fn(async () => []),
}));

vi.mock('@/api', () => ({
  useNiveles: () => [
    { id: 'nivel-b', codigo: 'D', nombre: 'Cuentos' },
    { id: 'nivel-c', codigo: 'C', nombre: 'Palabras' },
  ],
  listarPictogramas,
  crearCuento,
  actualizarCuento,
}));
vi.mock('@/features/tablero/arasaac', async (original) => ({
  ...(await original<typeof import('@/features/tablero/arasaac')>()),
  fetchArasaacPictogramId: async () => null,
}));
vi.mock('@/api/servidor', async (original) => ({ ...(await original<typeof import('@/api/servidor')>()), generarAudio, generarCuentoConIa, calentarIaDeCuentos }));

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
    listarPictogramas.mockReset();
    listarPictogramas.mockImplementation(async () => []);
  });

  it('al abrir un cuento nuevo carga el modelo de la IA una sola vez, aunque StrictMode monte dos veces', () => {
    calentarIaDeCuentos.mockClear();
    render(
      <StrictMode>
        <CuentoForm onGuardado={vi.fn()} onCancelar={vi.fn()} />
      </StrictMode>,
    );

    expect(calentarIaDeCuentos).toHaveBeenCalledTimes(1);
    expect(calentarIaDeCuentos).toHaveBeenCalledWith();
  });

  it('al editar un cuento existente no carga el modelo', () => {
    calentarIaDeCuentos.mockClear();
    renderForm();

    expect(calentarIaDeCuentos).not.toHaveBeenCalled();
  });

  const pedirBorrador = async () => {
    await userEvent.type(screen.getByLabelText('¿De qué trata el cuento?'), 'un gato');
    await userEvent.click(screen.getByRole('button', { name: /Crear borrador/ }));
  };

  it('llena título, descripción y páginas con el borrador y deja el cuento editable', async () => {
    renderNuevo();

    const crear = screen.getByRole('button', { name: /Crear borrador/ });
    expect(crear).toBeDisabled();
    await userEvent.type(screen.getByLabelText('¿De qué trata el cuento?'), 'El osito va al dentista');
    await userEvent.click(screen.getByRole('button', { name: /Crear borrador/ }));

    await screen.findByText(/Borrador creado con IA/);
    expect(generarCuentoConIa).toHaveBeenCalledWith({ tema: 'El osito va al dentista', nivel: 'B', paginas: 5 }, expect.any(AbortSignal));
    expect(screen.getByLabelText('Título del cuento')).toHaveValue('El osito y el dentista');
    expect(screen.getByLabelText('Descripción (opcional)')).toHaveValue('Un osito pierde el miedo.');
    expect(screen.getByLabelText('Texto: una frase por página')).toHaveValue('El osito va al dentista\nAbre la boca grande');
    expect(screen.getByText('Página 2')).toBeInTheDocument();
  });

  it('muestra el motivo si la IA no responde y no toca lo escrito', async () => {
    generarCuentoConIa.mockRejectedValueOnce(new ErrorDeServidor('La IA de cuentos aún no está activada en este servidor.', 503));
    renderNuevo();
    await userEvent.type(screen.getByLabelText('Título del cuento'), 'Mi cuento');

    await pedirBorrador();

    expect(await screen.findByText('La IA de cuentos aún no está activada en este servidor.')).toBeInTheDocument();
    expect(screen.getByLabelText('Título del cuento')).toHaveValue('Mi cuento');
    expect(screen.queryByRole('button', { name: 'Recuperar versión anterior' })).not.toBeInTheDocument();
  });

  it('no pide confirmación: guarda lo escrito y permite recuperarlo, aunque solo hubiera título', async () => {
    const confirmar = vi.spyOn(window, 'confirm');
    renderNuevo();
    await userEvent.type(screen.getByLabelText('Título del cuento'), 'Mi cuento');

    await pedirBorrador();
    await screen.findByText(/Borrador creado con IA/);
    expect(screen.getByLabelText('Título del cuento')).toHaveValue('El osito y el dentista');
    await userEvent.click(screen.getByRole('button', { name: 'Recuperar versión anterior' }));

    expect(confirmar).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Título del cuento')).toHaveValue('Mi cuento');
    expect(screen.getByLabelText('Texto: una frase por página')).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Recuperar versión anterior' })).not.toBeInTheDocument();
    confirmar.mockRestore();
  });

  it('recuperar la versión anterior devuelve título, descripción, texto y páginas', async () => {
    render(<CuentoForm cuento={cuento} onGuardado={vi.fn()} onCancelar={vi.fn()} />);

    await pedirBorrador();
    await screen.findByText(/Borrador creado con IA/);
    expect(screen.getByLabelText('Título del cuento')).toHaveValue('El osito y el dentista');
    await userEvent.click(screen.getByRole('button', { name: 'Recuperar versión anterior' }));

    expect(screen.getByLabelText('Título del cuento')).toHaveValue('El oso');
    expect(screen.getByLabelText('Texto: una frase por página')).toHaveValue('El oso lee\nMamá sonríe');
    expect(screen.getAllByText(/^Página \d$/)).toHaveLength(2);
  });

  it('avisa que no se escriban nombres de estudiantes', () => {
    renderNuevo();

    expect(screen.getByLabelText('¿De qué trata el cuento?')).toHaveAccessibleDescription(/No escribas nombres de estudiantes/);
  });

  it('mientras redacta avisa que suele tardar menos de un minuto y permite cancelar sin error', async () => {
    let cancelada = false;
    generarCuentoConIa.mockImplementationOnce(
      (_pedido: unknown, senal: AbortSignal) =>
        new Promise((_ok, fallar) =>
          senal.addEventListener('abort', () => {
            cancelada = true;
            fallar(new DOMException('Cancelado', 'AbortError'));
          }),
        ),
    );
    renderNuevo();
    await userEvent.type(screen.getByLabelText('Título del cuento'), 'Mi cuento');

    await pedirBorrador();
    expect(screen.getByText('Suele tardar menos de un minuto.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Suele tardar menos de un minuto');
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar redacción' }));

    await waitFor(() => expect(screen.getByRole('button', { name: /Crear borrador/ })).toBeEnabled());
    expect(cancelada).toBe(true);
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
    expect(screen.getByLabelText('Título del cuento')).toHaveValue('Mi cuento');
    expect(screen.queryByRole('button', { name: 'Recuperar versión anterior' })).not.toBeInTheDocument();
  });

  it('en los niveles sin oraciones pide las frases mínimas', async () => {
    renderNuevo();
    await userEvent.selectOptions(screen.getByLabelText('Nivel'), 'nivel-c');

    await pedirBorrador();

    await screen.findByText(/Borrador creado con IA/);
    expect(generarCuentoConIa).toHaveBeenCalledWith({ tema: 'un gato', nivel: 'A', paginas: 5 }, expect.any(AbortSignal));
  });

  it('mientras la IA redacta no se puede editar, sugerir, generar audio ni guardar', async () => {
    let terminar!: (b: typeof borrador) => void;
    generarCuentoConIa.mockReturnValueOnce(new Promise((resolver) => (terminar = resolver)));
    renderNuevo();

    await pedirBorrador();

    expect(screen.getByRole('button', { name: /Escribiendo el cuento/ })).toHaveFocus();
    expect(screen.getByLabelText('Título del cuento')).toBeDisabled();
    expect(screen.getByLabelText('Texto: una frase por página')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Guardar borrador' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled();

    terminar(borrador);
    await screen.findByText(/Borrador creado con IA/);
    expect(screen.getByLabelText('Título del cuento')).toBeEnabled();
  });

  it('corregir el borrador mientras se buscan los pictogramas no se pierde', async () => {
    let terminar!: (lista: []) => void;
    listarPictogramas.mockReturnValueOnce(new Promise((resolver) => (terminar = resolver)));
    const onGuardado = vi.fn();
    actualizarCuento.mockReset();
    render(<CuentoForm cuento={{ ...cuento, paginas: [] }} onGuardado={onGuardado} onCancelar={vi.fn()} />);

    await pedirBorrador();
    const textoForm = await screen.findByDisplayValue(/El osito va al dentista/);
    await userEvent.clear(textoForm);
    await userEvent.type(textoForm, 'Otra frase');
    terminar([]);
    await screen.findByText(/Borrador creado con IA/);

    await userEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }));

    const guardado = actualizarCuento.mock.calls[0][1] as Pick<Cuento, 'paginas'>;
    expect(guardado.paginas.map((p) => p.textoCompleto)).toEqual(['Otra frase']);
  });

  it('avisa si la IA escribió menos páginas de las pedidas', async () => {
    renderNuevo();

    await pedirBorrador();

    expect(await screen.findByText(/Pediste 5 páginas y la IA escribió 2: completa las que falten/)).toBeInTheDocument();
  });

  it('no avisa de páginas faltantes si llegaron todas', async () => {
    generarCuentoConIa.mockResolvedValueOnce({ ...borrador, frases: ['Uno a', 'Dos b', 'Tres c', 'Cuatro d', 'Cinco e'] });
    renderNuevo();

    await pedirBorrador();

    await screen.findByText(/Borrador creado con IA/);
    expect(screen.queryByText(/Pediste/)).not.toBeInTheDocument();
  });

  it('avisa las palabras sin pictograma junto con el borrador', async () => {
    renderNuevo();

    await pedirBorrador();

    expect(await screen.findByText(/Borrador creado con IA.*palabra\(s\) sin pictograma/)).toBeInTheDocument();
  });

  it('si fallan los pictogramas el borrador queda y los botones se liberan', async () => {
    listarPictogramas.mockRejectedValueOnce(new Error('sin base local'));
    renderNuevo();

    await pedirBorrador();

    expect(await screen.findByText(/No se pudieron buscar los pictogramas/)).toBeInTheDocument();
    expect(screen.getByLabelText('Título del cuento')).toHaveValue('El osito y el dentista');
    expect(screen.getByRole('button', { name: 'Sugerir pictogramas' })).toBeEnabled();
  });

  it('al salir del formulario no busca pictogramas para un borrador que ya nadie ve', async () => {
    let terminar!: (b: typeof borrador) => void;
    generarCuentoConIa.mockReturnValueOnce(new Promise((resolver) => (terminar = resolver)));
    const { unmount } = renderNuevo();

    await pedirBorrador();
    unmount();
    terminar(borrador);
    await new Promise((resolver) => setTimeout(resolver));

    expect(listarPictogramas).not.toHaveBeenCalled();
  });

  it('manda las palabras para practicar y dice cuáles aparecieron y cuáles no', async () => {
    generarCuentoConIa.mockResolvedValueOnce({ titulo: 'La casa', descripcion: '', frases: ['Mamá abre la casa', 'El gato duerme'] });
    renderNuevo();
    await userEvent.type(screen.getByLabelText('Palabras para practicar (opcional)'), 'casa, mamá, perro');

    await pedirBorrador();

    await screen.findByText(/Borrador creado con IA/);
    expect(generarCuentoConIa).toHaveBeenCalledWith(
      { tema: 'un gato', nivel: 'B', paginas: 5, palabras: ['casa', 'mamá', 'perro'] },
      expect.any(AbortSignal),
    );
    const cobertura = screen.getByTestId('cobertura-palabras');
    expect(cobertura).toHaveTextContent('✓ casa: aparece en el cuento');
    expect(cobertura).toHaveTextContent('✓ mamá: aparece en el cuento');
    expect(cobertura).toHaveTextContent('✗ perro: no aparece en el cuento');
    expect(cobertura).toHaveTextContent('El modelo omitió alguna');
  });

  it('si la docente agrega la palabra omitida al texto, pasa a aparecer', async () => {
    generarCuentoConIa.mockResolvedValueOnce({ titulo: 'La casa', descripcion: '', frases: ['Mamá abre la casa'] });
    renderNuevo();
    await userEvent.type(screen.getByLabelText('Palabras para practicar (opcional)'), 'perro');
    await pedirBorrador();
    await screen.findByText(/Borrador creado con IA/);
    expect(screen.getByTestId('cobertura-palabras')).toHaveTextContent('✗ perro');

    await userEvent.type(screen.getByLabelText('Texto: una frase por página'), '{Enter}El perro ladra');

    expect(screen.getByTestId('cobertura-palabras')).toHaveTextContent('✓ perro');
  });

  it('sin palabras no manda el campo ni muestra la lista', async () => {
    renderNuevo();

    await pedirBorrador();

    await screen.findByText(/Borrador creado con IA/);
    expect(generarCuentoConIa.mock.calls[0][0]).not.toHaveProperty('palabras');
    expect(screen.queryByTestId('cobertura-palabras')).not.toBeInTheDocument();
  });

  it('carga las palabras iniciales y no deja pedir palabras que el servidor rechazaría', async () => {
    render(<CuentoForm palabrasIniciales={['casa', 'perro']} onGuardado={vi.fn()} onCancelar={vi.fn()} />);
    const campoPalabras = screen.getByLabelText('Palabras para practicar (opcional)');
    expect(campoPalabras).toHaveValue('casa, perro');
    await userEvent.type(screen.getByLabelText('¿De qué trata el cuento?'), 'un gato');
    expect(screen.getByRole('button', { name: /Crear borrador/ })).toBeEnabled();

    await userEvent.type(campoPalabras, ', ca5a');

    expect(campoPalabras).toBeInvalid();
    expect(campoPalabras).toHaveAccessibleDescription(/«ca5a» no sirve/);
    expect(screen.getByRole('button', { name: /Crear borrador/ })).toBeDisabled();
  });

  it('no se ofrece al revisor, que solo valida cuentos', () => {
    useAuthStore.setState({ user: { id: 'rev-1', nombre: 'Revisora', email: 'rev@piedraazul.cl', role: 'revisor' } });
    renderNuevo();

    expect(screen.queryByRole('button', { name: /Crear borrador/ })).not.toBeInTheDocument();
  });
});

describe('CuentoForm: guardar', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { id: 'prof-1', nombre: 'Profesora PIE', email: 'profesora@piedraazul.cl', role: 'docente' } });
    crearCuento.mockReset();
    actualizarCuento.mockReset();
  });

  const llenarNuevo = async () => {
    await userEvent.type(screen.getByLabelText('Título del cuento'), 'Mi cuento');
    await userEvent.type(screen.getByLabelText('Texto: una frase por página'), 'El oso lee');
  };

  it('un doble clic crea un solo cuento', async () => {
    let terminar!: () => void;
    crearCuento.mockReturnValueOnce(new Promise<void>((resolver) => (terminar = resolver)));
    const onGuardado = vi.fn();
    render(<CuentoForm onGuardado={onGuardado} onCancelar={vi.fn()} />);
    await llenarNuevo();

    const enviar = screen.getByRole('button', { name: 'Enviar a revisión' });
    await userEvent.dblClick(enviar);
    terminar();

    await waitFor(() => expect(onGuardado).toHaveBeenCalledTimes(1));
    expect(crearCuento).toHaveBeenCalledTimes(1);
  });

  it('si falla el guardado muestra el error, conserva el texto y deja volver a intentar', async () => {
    crearCuento.mockRejectedValueOnce(new Error('base llena'));
    const onGuardado = vi.fn();
    render(<CuentoForm onGuardado={onGuardado} onCancelar={vi.fn()} />);
    await llenarNuevo();

    await userEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }));

    expect(await screen.findByText(/No se pudo guardar el cuento/)).toBeInTheDocument();
    expect(onGuardado).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Título del cuento')).toHaveValue('Mi cuento');
    expect(screen.getByRole('button', { name: 'Guardar borrador' })).toBeEnabled();

    crearCuento.mockResolvedValueOnce(undefined);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }));
    await waitFor(() => expect(onGuardado).toHaveBeenCalledTimes(1));
  });

  it('avisa cuántas páginas no tienen audio, sin impedir el envío', async () => {
    crearCuento.mockResolvedValue(undefined);
    const onGuardado = vi.fn();
    const conUnAudio = { ...cuento, paginas: [{ ...cuento.paginas[0], audioPaginaUrl: '/audio/a.mp3' }, cuento.paginas[1]] };
    render(<CuentoForm cuento={conUnAudio} onGuardado={onGuardado} onCancelar={vi.fn()} />);

    expect(screen.getByText(/1 de 2 páginas no tienen audio/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Enviar a revisión' }));

    await waitFor(() => expect(onGuardado).toHaveBeenCalled());
  });

  it('no avisa de audios cuando todas las páginas lo tienen', () => {
    const conAudio = { ...cuento, paginas: cuento.paginas.map((p) => ({ ...p, audioPaginaUrl: '/audio/x.mp3' })) };
    render(<CuentoForm cuento={conAudio} onGuardado={vi.fn()} onCancelar={vi.fn()} />);

    expect(screen.queryByText(/no tienen audio/)).not.toBeInTheDocument();
  });
});
