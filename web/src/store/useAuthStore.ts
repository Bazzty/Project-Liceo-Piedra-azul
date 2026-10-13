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
 isSessionExpiredModalOpen: boolean;
 login: (userData: User) => void;
 logout: () => void;
 selectStudent: (studentId: string) => void;
 startCourseSession: () => void;
 checkSessionTimeout: () => boolean;
 closeSessionExpiredModal: () => void;
}

export const useAuthStore = create<AuthState>()(
 persist(
 (set, get) => ({
 user: null,
 isAuthenticated: false,
 activeStudentId: null,
 sessionStartTimestamp: null,
 sessionDurationMinutes: 90, // 1.5 horas
 isSessionExpiredModalOpen: false,
 login: (userData) =>
 set({
 user: userData,
 isAuthenticated: true,
 activeStudentId: userData.rol === 'estudiante' ? userData.id : null,
 sessionStartTimestamp: null,
 isSessionExpiredModalOpen: false,
 }),
 logout: () =>
 set({
 user: null,
 isAuthenticated: false,
 activeStudentId: null,
 sessionStartTimestamp: null,
 isSessionExpiredModalOpen: false,
 }),
 selectStudent: (studentId) =>
 set({
 activeStudentId: studentId,
 isSessionExpiredModalOpen: false,
 }),
 startCourseSession: () =>
 set({
 sessionStartTimestamp: Date.now(),
 isSessionExpiredModalOpen: false,
 }),
 checkSessionTimeout: () => {
 const { sessionStartTimestamp, sessionDurationMinutes, activeStudentId } = get();
 // Expira únicamente si hay un estudiante activo y timestamp
 if (!activeStudentId || !sessionStartTimestamp) return false;
 const elapsedMs = Date.now() - sessionStartTimestamp;
 const elapsedMinutes = elapsedMs / (1000 * 60);
 if (elapsedMinutes >= sessionDurationMinutes) {
 // Expiración exclusiva del estudiante. El docente permanece autenticado.
 set({
 activeStudentId: null,
 sessionStartTimestamp: null,
 isSessionExpiredModalOpen: true,
 });
 return true;
 }
 return false;
 },
 closeSessionExpiredModal: () =>
 set({
 isSessionExpiredModalOpen: false,
 }),
 }),
 {
 name: 'auth-storage',
 }
 )
);