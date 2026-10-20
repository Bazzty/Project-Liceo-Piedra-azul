import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export const useSessionTimeout = (_options?: any) => {
  const { checkSessionTimeout, checkClassroomStatus } = useAuthStore();

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof checkSessionTimeout === 'function') {
        checkSessionTimeout();
      }
      if (typeof checkClassroomStatus === 'function') {
        checkClassroomStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [checkSessionTimeout, checkClassroomStatus]);
};