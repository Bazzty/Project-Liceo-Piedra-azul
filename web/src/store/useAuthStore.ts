import { create } from 'zustand';

export type ModoInicio = 'selector' | 'inicio-1' | 'inicio-2';
export type VistaInicio1 =
  | 'portal'
  | 'profesor-login'
  | 'control-aula'
  | 'aula-mosaico'
  | 'aula-espera'
  | 'alumno-casa'
  | 'aprender';
export type Role = 'docente' | 'estudiante' | null;
export type SessionType = 'aula' | 'casa' | null;

export interface AuthState {
  modoInicio: ModoInicio;
  vistaInicio1: VistaInicio1;
  activeStudentId: string | null;
  role: Role;
  sessionType: SessionType;
  isClassroomSessionActive: boolean;
  classroomSessionExpiry: string | null;
  setModoInicio: (modo: ModoInicio) => void;
  setVistaInicio1: (vista: VistaInicio1) => void;
  setActiveStudentId: (studentId: string | null) => void;
  setRole: (role: Role) => void;
  setSessionType: (type: SessionType) => void;
  activarSesionAula: (horas?: number) => void;
  desactivarSesionAula: () => void;
  checkClassroomStatus: () => void;
  checkSessionTimeout: () => void;
  logout: () => void;
}

const getStoredSessionStatus = (): boolean => {
  return localStorage.getItem('isClassroomSessionActive') === 'true';
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  modoInicio: 'selector',
  vistaInicio1: 'portal',
  activeStudentId: null,
  role: null,
  sessionType: null,
  isClassroomSessionActive: getStoredSessionStatus(),
  classroomSessionExpiry: null,
  setModoInicio: (modo) => set({ modoInicio: modo }),
  setVistaInicio1: (vista) => set({ vistaInicio1: vista }),
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
  logout: () => {
    set({
      activeStudentId: null,
      role: null,
      sessionType: null,
    });
  },
}));