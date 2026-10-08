import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  nombre: string;
  rol: 'docente' | 'apoderado' | 'estudiante';
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  activeStudentId: string | null;     // Alumno seleccionado en el mosaico
  sessionStartTimestamp: number | null;
  sessionDurationMinutes: number;     // Configurado en 90 min (1.5h)
  
  // Acciones
  login: (userData: User) => void;
  logout: () => void;
  selectStudent: (studentId: string) => void;
  startCourseSession: () => void;
  checkSessionTimeout: () => boolean; // Retorna true si expiró la 1.5 hora
}

export const useAuthStore = create