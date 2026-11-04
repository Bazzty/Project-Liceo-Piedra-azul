import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '@/shared/ui';

describe('Button', () => {
  it('mientras carga conserva el foco y no repite la acción', async () => {
    const accion = vi.fn();
    const { rerender } = render(<Button onClick={accion}>Guardar</Button>);
    const boton = screen.getByRole('button', { name: 'Guardar' });
    await userEvent.click(boton);

    rerender(
      <Button onClick={accion} loading>
        Guardar
      </Button>,
    );

    expect(boton).toHaveFocus();
    expect(boton).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(boton);
    await userEvent.keyboard('{Enter}');
    expect(accion).toHaveBeenCalledTimes(1);
  });

  it('un botón con disabled sigue desactivado de verdad', () => {
    render(<Button disabled>Guardar</Button>);

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });
});
