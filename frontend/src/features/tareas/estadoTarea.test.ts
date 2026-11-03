import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { destinatarios, estadoTarea, formatearLimite } from '@/features/tareas/estadoTarea';
import type { Asignacion } from '@/features/tareas/useAsignacionesStore';
import type { Registro } from '@/types';

const tarea: Asignacion = { id: 't1', cuentoId: 'sapo', alumnos: ['ana'], creada: '2026-11-01T10:00:00.000Z', limite: '2026-11-05' };
const juego = (fecha: string, cuentoId = 'sapo'): Registro => ({ alumnoId: 'ana', tipo: 'actividad', cuentoId, detalle: '', lugar: 'casa', fecha });

describe('estadoTarea', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 3, 12, 0));
  });
  afterEach(() => vi.useRealTimers());

  it('está hecha solo si jugó ese cuento después de asignarla', () => {
    expect(estadoTarea(tarea, 'ana', [juego('2026-11-02T09:00:00.000Z')])).toBe('hecha');
    expect(estadoTarea(tarea, 'ana', [juego('2026-10-30T09:00:00.000Z')])).toBe('pendiente');
    expect(estadoTarea(tarea, 'ana', [juego('2026-11-02T09:00:00.000Z', 'otro')])).toBe('pendiente');
  });

  it('vence pasado el límite', () => {
    vi.setSystemTime(new Date(2026, 10, 6, 9, 0));
    expect(estadoTarea(tarea, 'ana', [])).toBe('vencida');
  });

  it('"todos" incluye a todo el curso', () => {
    expect(destinatarios({ ...tarea, alumnos: 'todos' }, ['ana', 'beto'])).toEqual(['ana', 'beto']);
    expect(formatearLimite('2026-11-05')).toBe('05/11');
  });
});
