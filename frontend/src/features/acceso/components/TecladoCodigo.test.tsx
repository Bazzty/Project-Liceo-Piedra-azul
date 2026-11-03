import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TecladoCodigo } from '@/features/acceso/components/TecladoCodigo';

const props = () => ({ onDigito: vi.fn(), onBorrar: vi.fn(), onEntrar: vi.fn(), puedeEntrar: false });

describe('TecladoCodigo', () => {
  it('escribe los números y borra con botones grandes y con nombre', async () => {
    const p = props();
    render(<TecladoCodigo {...p} />);

    await userEvent.click(screen.getByRole('button', { name: '7' }));
    await userEvent.click(screen.getByRole('button', { name: '0' }));
    await userEvent.click(screen.getByRole('button', { name: 'Borrar el último número' }));

    expect(p.onDigito.mock.calls).toEqual([['7'], ['0']]);
    expect(p.onBorrar).toHaveBeenCalledOnce();
  });

  it('no deja entrar hasta que el código está completo', async () => {
    const p = props();
    const { rerender } = render(<TecladoCodigo {...p} />);
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeDisabled();

    rerender(<TecladoCodigo {...p} puedeEntrar />);
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(p.onEntrar).toHaveBeenCalledOnce();
  });

  it('se puede usar solo con teclado', async () => {
    const p = props();
    render(<TecladoCodigo {...p} />);

    await userEvent.tab();
    expect(screen.getByRole('button', { name: '1' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(p.onDigito).toHaveBeenCalledWith('1');
  });
});
