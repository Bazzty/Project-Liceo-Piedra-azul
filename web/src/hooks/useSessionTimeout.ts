import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export const useSessionTimeout = (onTimeout: () => void) => {
  const { checkSessionTimeout, activeStudentId } = useAuthStore();

  useEffect(() => {
    if (!activeStudentId) return;

    // 1. Chequeo inmediato al montar
    if (checkSessionTimeout()) {
      onTimeout();
      return;
    }

    // 2. Monitoreo activo cada 1 minuto (60.000 ms)
    const interval = setInterval(() => {
      if (checkSessionTimeout()) {
        onTimeout();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [activeStudentId, checkSessionTimeout, onTimeout]);
};