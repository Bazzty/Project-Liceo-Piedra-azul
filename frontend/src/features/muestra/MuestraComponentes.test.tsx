import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MuestraComponentes } from '@/features/muestra/MuestraComponentes';
import { useThemeStore } from '@/shared/store/useThemeStore';

vi.mock('@/api', async (original) => ({ ...(await original<typeof import('@/api')>()), useAlumno: () => undefined }));

describe('MuestraComponentes', () => {
  beforeEach(() => useThemeStore.setState({ currentTheme: 'suave' }));

  it('la paleta elegida se marca y se aplica a toda la página', async () => {
    render(<MemoryRouter><MuestraComponentes /></MemoryRouter>);

    const grupo = screen.getByRole('radiogroup', { name: 'Paleta de colores' });
    expect(screen.getByRole('radio', { name: 'Suave' })).toHaveAttribute('aria-checked', 'true');
    expect(grupo.querySelectorAll('[role="radio"][aria-checked="true"]')).toHaveLength(1);

    await userEvent.click(screen.getByRole('radio', { name: 'Alto contraste' }));

    expect(screen.getByRole('radio', { name: 'Alto contraste' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Suave' })).toHaveAttribute('aria-checked', 'false');
    expect(document.documentElement).toHaveAttribute('data-theme', 'alto-contraste');
  });
});
