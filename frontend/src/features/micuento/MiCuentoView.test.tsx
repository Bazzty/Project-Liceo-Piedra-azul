import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '@/app/routes';
import { MiCuentoView } from '@/features/micuento/MiCuentoView';
import { MiCuentoGuardadoView, MisCuentosView } from '@/features/micuento/MisCuentosView';
import { useAjustesStore } from '@/shared/store/useAjustesStore';
import { useAuthStore } from '@/shared/store/useAuthStore';

const { crearMiCuento, crearRegistro, guardados, dichas } = vi.hoisted(() => ({
  crearMiCuento: vi.fn(),
  crearRegistro: vi.fn(),
  guardados: { lista: [] as unknown[] },
  dichas: [] as string[],
}));

// Sin base local ni audio: los datos del niño se simulan y la voz se da por dicha de inmediato.
vi.mock('@/api', async (original) => ({
  ...(await original<typeof import('@/api')>()),
  useAlumno: () => ({ id: 'ana', nombre: 'Ana' }),
  useMisCuentos: () => guardados.lista,
  useMiCuento: (alumnoId: string, id?: number) => (guardados.lista as { id: number; alumnoId: string }[]).find((c) => c.id === id && c.alumnoId === alumnoId) ?? null,
  crearMiCuento,
  crearRegistro,
}));
vi.mock('@/shared/audio/decirSecuencia', () => ({
  decirSecuencia: async (elementos: { texto: string }[]) => void dichas.push(...elementos.map((e) => e.texto)),
}));
vi.mock('@/shared/audio/sonidos', () => ({ sonarToque: vi.fn(), sonarAcierto: vi.fn() }));

const renderCuento = (ruta: string = ROUTES.miCuento) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path={ROUTES.menu} element={<p>Pantalla de inicio</p>} />
        <Route path={ROUTES.miCuento} element={<MiCuentoView />} />
        <Route path={ROUTES.misCuentos} element={<MisCuentosView />} />
        <Route path={ROUTES.miCuentoGuardado(':cuentoId')} element={<MiCuentoGuardadoView />} />
      </Routes>
    </MemoryRouter>,
  );

const elegir = (nombre: string) => userEvent.click(screen.getByRole('radio', { name: nombre }));

const armarCuento = async () => {
  await elegir('Había una vez un gato.');
  await elegir('Estaba en la sala.');
  await elegir('Allí saltó muy alto.');
};

describe('Mi cuento', () => {
  beforeEach(() => {
    crearMiCuento.mockReset().mockResolvedValue(1);
    crearRegistro.mockReset().mockResolvedValue(1);
    guardados.lista = [];
    dichas.length = 0;
    useAjustesStore.setState({ sonido: true, movimiento: true, pocasOpciones: false, barrido: false });
    useAuthStore.setState({ activeStudentId: 'ana', role: 'estudiante', sessionType: 'casa', supervision: false });
  });

  it('muestra una decisión por pantalla con cuatro pictogramas con texto alternativo y salida siempre visible', async () => {
    renderCuento();

    expect(screen.getByRole('radiogroup', { name: '¿Quién?' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    for (const nombre of ['Una niña', 'Un gato', 'Un sapo', 'Un elefante']) expect(screen.getByAltText(nombre)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inicio' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument();

    await elegir('Había una vez un gato.');

    expect(await screen.findByRole('radiogroup', { name: '¿Dónde?' })).toBeInTheDocument();
    // El osito dijo lo que el niño eligió
    expect(dichas).toContain('Había una vez un gato.');
  });

  it('con «pocas opciones» ofrece solo dos por paso', async () => {
    useAjustesStore.setState({ pocasOpciones: true });
    renderCuento();

    expect(screen.getAllByRole('radio')).toHaveLength(2);
    await elegir('Había una vez una niña.');
    expect(await screen.findByRole('radiogroup', { name: '¿Dónde?' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('al terminar los tres pasos el osito lee las cuatro frases en orden, con su pictograma', async () => {
    renderCuento();

    await armarCuento();

    expect(await screen.findByRole('button', { name: /escuchar otra vez/i })).toBeInTheDocument();
    for (const alt of ['Un gato', 'La sala', 'Saltar', 'Un día muy feliz']) expect(screen.getByAltText(alt)).toBeInTheDocument();
    await waitFor(() =>
      expect(dichas.slice(-4)).toEqual(['Había una vez un gato.', 'Estaba en la sala.', 'Allí saltó muy alto.', 'Y fue un día muy feliz. Fin.']),
    );
  });

  it('guardar con doble clic crea un solo cuento y un solo registro para la docente', async () => {
    renderCuento();
    await armarCuento();

    const guardar = await screen.findByRole('button', { name: /guardar en mis cuentos/i });
    await userEvent.dblClick(guardar);

    expect(await screen.findByRole('button', { name: 'Mis cuentos' })).toBeInTheDocument();
    expect(crearMiCuento).toHaveBeenCalledTimes(1);
    expect(crearMiCuento).toHaveBeenCalledWith(expect.objectContaining({ alumnoId: 'ana', quien: 'gato', donde: 'sala', accion: 'saltar' }));
    expect(crearRegistro).toHaveBeenCalledTimes(1);
    expect(crearRegistro).toHaveBeenCalledWith(expect.objectContaining({ alumnoId: 'ana', tipo: 'mi_cuento', detalle: 'Creó su cuento: Un gato · La sala · Saltar', lugar: 'casa' }));
  });

  it('en supervisión no se guarda nada a nombre del niño', async () => {
    useAuthStore.setState({ supervision: true });
    renderCuento();
    await armarCuento();

    await userEvent.click(await screen.findByRole('button', { name: /guardar en mis cuentos/i }));

    expect(await screen.findByRole('button', { name: 'Mis cuentos' })).toBeInTheDocument();
    expect(crearMiCuento).not.toHaveBeenCalled();
    expect(crearRegistro).not.toHaveBeenCalled();
  });

  it('si guardar falla no hay mensaje de error para el niño y puede intentarlo otra vez', async () => {
    crearMiCuento.mockRejectedValueOnce(new Error('sin espacio'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderCuento();
    await armarCuento();

    await userEvent.click(await screen.findByRole('button', { name: /guardar en mis cuentos/i }));

    await waitFor(() => expect(crearMiCuento).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /guardar en mis cuentos/i }));
    expect(await screen.findByRole('button', { name: 'Guardado' })).toBeDisabled();
    expect(crearMiCuento).toHaveBeenCalledTimes(2);
  });

  it('«Crear otro» vuelve a la primera pregunta', async () => {
    renderCuento();
    await armarCuento();

    await userEvent.click(await screen.findByRole('button', { name: /crear otro/i }));

    expect(await screen.findByRole('radiogroup', { name: '¿Quién?' })).toBeInTheDocument();
  });

  it('la flecha de volver retrocede un paso y, en el primero, sale al inicio', async () => {
    renderCuento();
    await elegir('Había una vez un sapo.');
    await screen.findByRole('radiogroup', { name: '¿Dónde?' });

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(await screen.findByRole('radiogroup', { name: '¿Quién?' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.getByText('Pantalla de inicio')).toBeInTheDocument();
  });
});

describe('Mis cuentos', () => {
  beforeEach(() => {
    dichas.length = 0;
    useAjustesStore.setState({ sonido: true, movimiento: true, pocasOpciones: false, barrido: false });
    useAuthStore.setState({ activeStudentId: 'ana', role: 'estudiante', sessionType: 'casa', supervision: false });
    guardados.lista = [{ id: 7, alumnoId: 'ana', quien: 'sapo', donde: 'isla', accion: 'dormir', fecha: '2026-11-03T10:00:00.000Z' }];
  });

  it('la repisa muestra cada cuento con sus tres pictogramas y se puede volver a escuchar', async () => {
    renderCuento(ROUTES.misCuentos);

    await userEvent.click(screen.getByRole('button', { name: 'Cuento: Un sapo, Una isla, Dormir una siesta' }));

    expect(await screen.findByRole('button', { name: /escuchar otra vez/i })).toBeInTheDocument();
    await waitFor(() => expect(dichas.slice(-4)[0]).toBe('Había una vez un sapo.'));
    expect(dichas.slice(-4)[2]).toBe('Allí durmió una siesta.');
  });

  it('un cuento de otro niño no se abre: vuelve a la repisa sin mensajes de error', () => {
    useAuthStore.setState({ activeStudentId: 'beto' });
    renderCuento(ROUTES.miCuentoGuardado(7));

    expect(screen.queryByAltText('Un sapo')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mis cuentos' })).toBeInTheDocument();
  });
});
