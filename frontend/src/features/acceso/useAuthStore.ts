import { create } from 'zustand';

export type Role = 'docente' | 'estudiante' | null;
export type SessionType = 'aula' | 'casa' | null;

export interface User {
  id: string;
  nombre: string;
  email: string;
  role: string;
}

export interface AuthState {
  activeStudentId: string | null;
  role: Role;
  sessionType: SessionType;
  user: User | null;
  isClassroomSessionActive: boolean;
  classroomSessionExpiry: string | null;
  isSessionExpiredModalOpen: boolean;
  setActiveStudentId: (studentId: string | null) => void;
  setRole: (role: Role) => void;
  setSessionType: (type: SessionType) => void;
  activarSesionAula: (horas?: number) => void;
  desactivarSesionAula: () => void;
  checkClassroomStatus: () => void;
  checkSessionTimeout: () => void;
  login: (userData?: User) => void;
  logout: () => void;
  openSessionExpiredModal: () => void;
  closeSessionExpiredModal: () => void;
}

const getStoredSessionStatus = (): boolean => {
  return localStorage.getItem('isClassroomSessionActive') === 'true';
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  activeStudentId: null,
  role: null,
  sessionType: null,
  user: { id: 'prof-1', nombre: 'Profesora PIE', email: 'profesora@piedraazul.cl', role: 'docente' },
  isClassroomSessionActive: getStoredSessionStatus(),
  classroomSessionExpiry: null,
  isSessionExpiredModalOpen: false,
  setActiveStudentId: (studentId) => set({ activeStudentId: studentId }),
  setRole: (role) => set({ role }),
  setSessionType: (type) => set({ sessionType: type }),
  activarSesionAula: (horas = 1.5) => {
    const expiry = new Date(Date.now() + horas * 60 * 60 * 1000).toISOString();
    localStorage.setItem('isClassroomSessionActive', 'true');
    localStorage.setItem('classroomSessionExpiry', expiry);
    window.dispatchEvent(new Event('storage'));
    set({
      isClassroomSessionActive: true,
      classroomSessionExpiry: expiry,
    });
  },
  desactivarSesionAula: () => {
    localStorage.setItem('isClassroomSessionActive', 'false');
    localStorage.removeItem('classroomSessionExpiry');
    window.dispatchEvent(new Event('storage'));
    set({
      isClassroomSessionActive: false,
      classroomSessionExpiry: null,
    });
  },
  checkClassroomStatus: () => {
    set({ isClassroomSessionActive: getStoredSessionStatus() });
  },
  checkSessionTimeout: () => {
    const { classroomSessionExpiry, isClassroomSessionActive, desactivarSesionAula } = get();
    if (isClassroomSessionActive && classroomSessionExpiry) {
      if (new Date().toISOString() > classroomSessionExpiry) {
        desactivarSesionAula();
      }
    }
  },
  login: (userData) => {
    set({
      user: userData || { id: 'prof-1', nombre: 'Profesora PIE', email: 'profesora@piedraazul.cl', role: 'docente' },
      role: 'docente',
    });
  },
  logout: () => {
    set({
      activeStudentId: null,
      role: null,
      sessionType: null,
      user: null,
    });
  },
  openSessionExpiredModal: () => set({ isSessionExpiredModalOpen: true }),
  closeSessionExpiredModal: () => set({ isSessionExpiredModalOpen: false }),
}));