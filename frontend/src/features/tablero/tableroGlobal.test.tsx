import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '@/app/routes';
import { BotonHablar } from '@/shared/components/BotonHablar';
import { TableroGlobal } from '@/features/tablero/components/TableroGlobal';
import { tableroDisponible } from '@/shared/config/tableroDisponible';
import { useTableroStore } from '@/shared/store/useTableroStore';
import { useAuthStore } from '@/shared/store/useAuthStore';
import type { Pictograma } from '@/types';

// El tablero real lee la base local; aquí solo importa que se monte y se cierre.
vi.mock('@/features/tablero/components/TableroSAAC', () => ({
  TableroSAAC: ({ onCerrar }: { onCerrar: () => void }) => (
    <div role="dialog" aria-label="Hablar">
      <button type="button" onClick={onCerrar}>
        Volver
      </button>
    </div>
  ),
}));
vi.mock('@/shared/audio/sonidos', () => ({ sonarToque: vi.fn() }));

const pic = (palabra: string): Pictograma => ({ id: `pic-${palabra}`, palabra, categoria: 'basicas', imagenUrl: '', esFotoReal: false });

/** Botones para cambiar de vista desde la prueba. */
const Navegador = () => {
  const navigate = useNavigate();
  return (
    <>
      {[ROUTES.menu, ROUTES.aprender, ROUTES.inicio].map((ruta) => (
        <button key={ruta} type="button" onClick={() => navigate(ruta)}>
          ir a {ruta}
        </button>
      ))}
    </>
  );
};
const irA = (ruta: string) => userEvent.click(screen.getByRole('button', { name: `ir a ${ruta}` }));

const montar = (ruta: string) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Navegador />
      <BotonHablar />
      <TableroGlobal />
    </MemoryRouter>,
  );

beforeEach(() => {
  useAuthStore.setState({ activeStudentId: null, role: null });
  useTableroStore.setState({ abierto: false, frase: [] });
});

describe('tableroDisponible', () => {
  it.each([ROUTES.menu, ROUTES.aprender, ROUTES.catalogo('nivel-a'), ROUTES.profesorPanel, ROUTES.profesorInforme('ana')])('está en %s', (ruta) => {
    expect(tableroDisponible(ruta)).toBe(true);
  });

  it.each([ROUTES.inicio, ROUTES.profesorLogin, ROUTES.aulaEspera, ROUTES.aulaAlumnos, ROUTES.muestra])('no está en %s', (ruta) => {
    expect(tableroDisponible(ruta)).toBe(false);
  });
});

describe('botón Hablar del encabezado', () => {
  it('aparece en las vistas del niño y del docente, y abre el tablero', async () => {
    montar(ROUTES.menu);
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Hablar' }));
    expect(screen.getByRole('dialog', { name: 'Hablar' })).toBeInTheDocument();
  });

  it('no aparece en el acceso', () => {
    montar(ROUTES.inicio);
    expect(screen.queryByRole('button', { name: 'Hablar' })).toBeNull();
  });

  it('el tablero sigue abierto al cambiar de vista disponible', async () => {
    montar(ROUTES.menu);
    await userEvent.click(screen.getByRole('button', { name: 'Hablar' }));
    await irA(ROUTES.aprender);
    expect(screen.getByRole('dialog', { name: 'Hablar' })).toBeInTheDocument();
  });

  it('se cierra al salir a una vista sin tablero y no reaparece al volver', async () => {
    montar(ROUTES.menu);
    act(() => useTableroStore.getState().abrir());
    await irA(ROUTES.inicio);
    expect(screen.queryByRole('dialog')).toBeNull();
    await irA(ROUTES.menu);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Volver lo cierra', async () => {
    montar(ROUTES.menu);
    act(() => useTableroStore.getState().abrir());
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('estado del tablero', () => {
  it('la frase se conserva al cerrar y volver a abrir', () => {
    useTableroStore.getState().setFrase([pic('yo'), pic('quiero')]);
    useTableroStore.getState().abrir();
    useTableroStore.getState().cerrar();
    expect(useTableroStore.getState().frase.map((p) => p.palabra)).toEqual(['yo', 'quiero']);
  });

  it('setFrase acepta una función con la frase anterior', () => {
    useTableroStore.getState().setFrase([pic('yo')]);
    useTableroStore.getState().setFrase((f) => [...f, pic('más')]);
    expect(useTableroStore.getState().frase).toHaveLength(2);
  });

  it('la frase y el tablero abierto no pasan a otro niño', () => {
    useAuthStore.setState({ activeStudentId: 'ana' });
    useTableroStore.setState({ abierto: true, frase: [pic('yo')] });
    useAuthStore.setState({ activeStudentId: 'luis' });
    expect(useTableroStore.getState()).toMatchObject({ abierto: false, frase: [] });
  });

  it('al cerrar la sesión se borra la frase', () => {
    useAuthStore.setState({ role: 'docente' });
    useTableroStore.setState({ frase: [pic('yo')] });
    useAuthStore.setState({ role: null });
    expect(useTableroStore.getState().frase).toEqual([]);
  });
});
