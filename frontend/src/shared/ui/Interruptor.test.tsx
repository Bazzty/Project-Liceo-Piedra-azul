import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Interruptor } from '@/shared/ui/Interruptor';

describe('Interruptor', () => {
  it('se anuncia como interruptor y avisa el cambio al tocarlo', async () => {
    const onChange = vi.fn();
    render(<Interruptor activo={false} onChange={onChange} icono={null} etiqueta="Música" />);

    const interruptor = screen.getByRole('switch', { name: /música/i });
    expect(interruptor).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(interruptor);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
