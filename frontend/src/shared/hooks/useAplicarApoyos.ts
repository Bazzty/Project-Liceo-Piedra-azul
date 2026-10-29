import { useEffect } from 'react';
import type { Alumno } from '@/types';
import { useAjustesStore } from '@/shared/store/useAjustesStore';

// Último niño (y sus apoyos) aplicado. Vive fuera del componente para no repetirlo en cada pantalla
// (si no, se pisarían los cambios que el niño hace él mismo en sus ajustes). Si entra otro niño, o la docente
// cambia los apoyos, la marca cambia y se vuelven a aplicar.
let aplicado: string | null = null;

/** Al entrar un niño, sus ajustes parten de los apoyos que dejó la docente del PIE. */
export const useAplicarApoyos = (alumno: Alumno | undefined) => {
  useEffect(() => {
    if (!alumno?.id) return;
    const apoyos = alumno.apoyos ?? {};
    const marca = `${alumno.id}|${JSON.stringify(apoyos)}`;
    if (aplicado === marca) return;
    aplicado = marca;
    const ajustes = useAjustesStore.getState();
    ajustes.setVozLenta(!!apoyos.vozLenta?.activo);
    ajustes.setMovimiento(!apoyos.sinMovimiento?.activo);
    ajustes.setBarrido(!!apoyos.barrido?.activo);
    ajustes.setPocasOpciones(!!apoyos.pocasOpciones?.activo);
  }, [alumno]);
};
