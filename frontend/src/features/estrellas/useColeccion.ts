import { useMemo } from 'react';
import { contarCompletados, useProgresosDeAlumno, useRegistrosDeAlumno } from '@/api';
import { ordenDeStickers, STICKERS } from '@/features/estrellas/stickers';

/**
 * Stickers de un niño: uno por cada cuento terminado y otro por cada cuento cuyas actividades
 * completó por primera vez. Sale de su avance, así que siempre coincide con lo que hizo.
 */
export function useColeccion(alumnoId: string | null) {
  const progresos = useProgresosDeAlumno(alumnoId);
  const registros = useRegistrosDeAlumno(alumnoId);

  return useMemo(() => {
    const orden = alumnoId ? ordenDeStickers(alumnoId) : [];
    const cuentosConActividad = new Set((registros ?? []).filter((r) => r.tipo === 'actividad' && r.cuentoId).map((r) => r.cuentoId as string));
    const ganados = Math.min(contarCompletados(progresos) + cuentosConActividad.size, STICKERS.length);
    return {
      cargado: !!progresos && !!registros,
      /** Índices (en STICKERS) de los stickers ganados, del más viejo al más nuevo. */
      obtenidos: orden.slice(0, ganados),
      /** Índice del sticker que se gana con el próximo logro, o null si ya tiene todos. */
      siguiente: ganados < orden.length ? orden[ganados] : null,
      cuentosConActividad,
      progresos,
    };
  }, [alumnoId, progresos, registros]);
}
