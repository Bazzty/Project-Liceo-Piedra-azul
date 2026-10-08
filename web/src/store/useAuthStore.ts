import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  nombre: string;
  rol: 'docente' | 'apoderado' | 'estudiante';
  avatarUrl?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  activeStudentId: string | null;
  sessionStartTimestamp: number | null;
  sessionDurationMinutes: number;

  login: (userData: User) => void;
  logout: () => void;
  selectStudent: (studentId: string) => void;
  startCourseSession: () => void;
  checkSessionTimeout: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      activeStudentId: null,
      sessionStartTimestamp: null,
      sessionDurationMinutes: 90, // 1.5 horas configuradas por defecto

      login: (userData) =>
        set({
          user: userData,
          isAuthenticated: true,
          // Si el que inicia sesión es directamente un estudiante, lo dejamos activo
          activeStudentId: userData.rol === 'estudiante' ? userData.id : null,
        }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          activeStudentId: null,
          sessionStartTimestamp: null,
        }),

      selectStudent: (studentId) =>
        set({
          activeStudentId: studentId,
        }),

      startCourseSession: () =>
        set({
          sessionStartTimestamp: Date.now(),
        }),

      checkSessionTimeout: () => {
        const { sessionStartTimestamp, sessionDurationMinutes } = get();
        if (!sessionStartTimestamp) return false;

        const elapsedMs = Date.now() - sessionStartTimestamp;
        const elapsedMinutes = elapsedMs / (1000 * 60);

        // Retorna true si ya pasaron los 90 minutos de control en el laboratorio
        return elapsedMinutes >= sessionDurationMinutes;
      },
    }),
    {
      name: 'auth-storage', // Llave para persistencia en localStorage
    }
  )
);