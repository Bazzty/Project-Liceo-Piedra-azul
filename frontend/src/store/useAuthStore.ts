import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'docente' | 'estudiante' | 'apoderado' | null;
export type SessionType = 'aula' | 'casa' | null;

export interface User {
  id: string;
  nombre: string;
  email: string;
  role: UserRole;
}

export interface AuthState {
  modoInicio: 'selector' | 'inicio-1' | 'inicio-2';
  vistaInicio1:
    | 'portal'
    | 'profesor-login'
    | 'control-aula'
    | 'panel-docente'
    | 'aula-espera'
    | 'aula-mosaico'
    | 'alumno-casa'
    | 'menu'
    | 'aprender';
  activeStudentId: string | null;
  role: UserRole;
  sessionType: SessionType;
  user: User | null;
  isClassroomSessionActive: boolean;
  classroomSessionExpiry: string | null;
  isSessionExpiredModalOpen: boolean;
  setModoInicio: (modo: 'selector' | 'inicio-1' | 'inicio-2') => void;
  setVistaInicio1: (
    vista:
      | 'portal'
      | 'profesor-login'
      | 'control-aula'
      | 'panel-docente'
      | 'aula-espera'
      | 'aula-mosaico'
      | 'alumno-casa'
      | 'menu'
      | 'aprender'
  ) => void;
  setActiveStudentId: (studentId: string | null) => void;
  setRole: (role: UserRole) => void;
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
  const active = localStorage.getItem('isClassroomSessionActive') === 'true';
  const expiry = localStorage.getItem('classroomSessionExpiry');
  if (!active || !expiry) return false;
  const expiryTime = new Date(expiry).getTime();
  if (isNaN(expiryTime)) return false;
  return Date.now() < expiryTime;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      modoInicio: 'selector',
      vistaInicio1: 'portal',
      activeStudentId: null,
      role: null,
      sessionType: null,
      user: { id: 'prof-1', nombre: 'Profesora PIE', email: 'profesora@piedraazul.cl', role: 'docente' },
      isClassroomSessionActive: getStoredSessionStatus(),
      classroomSessionExpiry: localStorage.getItem('classroomSessionExpiry'),
      isSessionExpiredModalOpen: false,
      setModoInicio: (modo) => set({ modoInicio: modo }),
      setVistaInicio1: (vista) => {
        if (get().vistaInicio1 !== vista) {
          window.history.pushState({ vista }, '', `#${vista}`);
        }
        set({ vistaInicio1: vista });
      },
      setActiveStudentId: (studentId) => set({ activeStudentId: studentId }),
      setRole: (role) => set({ role }),
      setSessionType: (type) => set({ sessionType: type }),
      activarSesionAula: (horas) => {
        const numHoras = typeof horas === 'number' && !isNaN(horas) ? horas : 1.5;
        const expiryDate = new Date(Date.now() + numHoras * 60 * 60 * 1000);
        const expiry = expiryDate.toISOString();
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
        const active = getStoredSessionStatus();
        const expiry = localStorage.getItem('classroomSessionExpiry');
        set({
          isClassroomSessionActive: active,
          classroomSessionExpiry: expiry,
        });
      },
      checkSessionTimeout: () => {
        const { classroomSessionExpiry, isClassroomSessionActive, desactivarSesionAula } = get();
        if (isClassroomSessionActive && classroomSessionExpiry) {
          const expiryTime = new Date(classroomSessionExpiry).getTime();
          if (isNaN(expiryTime) || Date.now() > expiryTime) {
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
          user: null,
          role: null,
          activeStudentId: null,
          sessionType: null,
        });
      },
      openSessionExpiredModal: () => set({ isSessionExpiredModalOpen: true }),
      closeSessionExpiredModal: () => set({ isSessionExpiredModalOpen: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);