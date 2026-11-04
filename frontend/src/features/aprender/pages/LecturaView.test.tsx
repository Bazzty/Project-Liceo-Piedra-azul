import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LecturaView } from '@/features/aprender/pages/LecturaView';
import { useAuthStore } from '@/shared/store/useAuthStore';

const { registrarProgreso, crearRegistro, cuentoDePrueba } = vi.hoisted(() => ({
  registrarProgreso: vi.fn(),
  crearRegistro: vi.fn(),
  cuentoDePrueba: { paginas: [] as unknown[] },
}));

// Sin base local: un cuento de dos páginas.
vi.mock('@/api', async (original) => ({
  ...(await original<typeof import('@/api')>()),
  useAlumno: () => ({ id: 'ana', nombre: 'Ana' }),
  useCuento: () => ({ id: 'cuento-1', titulo: 'El sol', paginas: cuentoDePrueba.paginas }),
  usePictogramaPorPalabra: () => undefined,
  registrarProgreso,
  crearRegistro,
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
    crearRegistro.mockClear();
    cuentoDePrueba.paginas = [{ palabras: [{ texto: 'sol', clave: 'sol' }] }, { palabras: [{ texto: 'luna', clave: 'luna' }] }];
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

  it('el registro de lectura guarda el lugar real de la sesión', async () => {
    useAuthStore.setState({ sessionType: 'aula' });
    renderLectura();

    await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    await userEvent.click(screen.getByRole('button', { name: 'Terminar' }));

    await screen.findByText('¡Muy bien!');
    expect(crearRegistro).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'lectura', lugar: 'liceo' }));
  });

  it('si el MP3 de la página falla, lee la página con la voz de respaldo en vez de quedar en silencio', async () => {
    cuentoDePrueba.paginas = [{ audioPaginaUrl: '/audio-generado/no-existe.mp3', palabras: [{ texto: 'sol', clave: 'sol' }] }];
    const hablada: string[] = [];
    vi.stubGlobal('SpeechSynthesisUtterance', class { constructor(texto: string) { hablada.push(texto); } });
    vi.stubGlobal('speechSynthesis', { cancel: vi.fn(), speak: vi.fn() });
    // El archivo no se puede reproducir: el audio avisa del error
    vi.stubGlobal('Audio', class { onerror: (() => void) | null = null; play() { queueMicrotask(() => this.onerror?.()); return Promise.resolve(); } pause() {} });
    renderLectura();

    await userEvent.click(screen.getByRole('button', { name: /escuchar/i }));

    await vi.waitFor(() => expect(hablada).toContain('sol'));
    vi.unstubAllGlobals();
  });
});
