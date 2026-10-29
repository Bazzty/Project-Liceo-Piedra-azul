import { useEffect } from 'react';
import type { Alumno } from '@/types';
import { useAjustesStore } from '@/shared/store/useAjustesStore';

// Último niño al que se le aplicaron los apoyos. Vive fuera del componente para no repetirlo en cada pantalla
// (si no, se pisarían los cambios que el niño hace él mismo en sus ajustes).
let aplicadoA: string | null = null;

/** Al entrar un niño, sus ajustes parten de los apoyos que dejó la docente del PIE. */
export const useAplicarApoyos = (alumno: Alumno | undefined) => {
  useEffect(() => {
    if (!alumno?.id || aplicadoA === alumno.id) return;
    aplicadoA = alumno.id;
    const apoyos = alumno.apoyos ?? {};
    const ajustes = useAjustesStore.getState();
    ajustes.setVozLenta(!!apoyos.vozLenta?.activo);
    ajustes.setMovimiento(!apoyos.sinMovimiento?.activo);
    ajustes.setBarrido(!!apoyos.barrido?.activo);
    ajustes.setPocasOpciones(!!apoyos.pocasOpciones?.activo);
  }, [alumno]);
};
