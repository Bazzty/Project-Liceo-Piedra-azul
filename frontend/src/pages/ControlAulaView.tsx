import React from 'react';
import { ArrowLeft, Play, Square, Users, CheckCircle, ShieldCheck } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { MainLayout } from '@/layouts/MainLayout';
import { useAuthStore } from '@/store/useAuthStore';
import { db } from '@/db/db';
import type { Alumno } from '@/types';

export const ControlAulaView: React.FC = () => {
  const { setVistaInicio1, isClassroomSessionActive, activarSesionAula, desactivarSesionAula } = useAuthStore();
  const alumnos = useLiveQuery(() => db.alumnos.toArray(), []);

  return (
    <MainLayout allowScroll={true}>
      <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto py-6 px-4 pb-12">
        
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-surface/90 backdrop-blur-md p-4 sm:p-6 rounded-3xl shadow-md border-2 border-borderCustom gap-4">
          <button
            onClick={() => setVistaInicio1('portal')}
            className="flex items-center gap-2 bg-app px-4 py-2.5 rounded-2xl border-2 border-borderCustom font-black text-primary hover:border-brand transition-all active:scale-95 cursor-pointer text-sm shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>VOLVER AL PORTAL</span>
          </button>
          
          <div className="text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-statusInfo">PANEL DOCENTE DE AULA</span>
            <h2 className="text-lg sm:text-xl font-extrabold text-primary">Control del Laboratorio PIE</h2>
          </div>
        </div>

        {/* Banner Estado de Aula */}
        <div className="bg-surface border-4 border-borderCustom rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 ${
              isClassroomSessionActive ? 'bg-statusOk-bg text-statusOk border-statusOk' : 'bg-statusWarn-bg text-statusWarn border-statusWarn'
            }`}>
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">
                ESTADO DE HABILITACIÓN DE COMPUTADORES
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-primary">
                Sesión de Clases:{' '}
                <span className={isClassroomSessionActive ? 'text-statusOk' : 'text-statusWarn'}>
                  {isClassroomSessionActive ? 'ACTIVA (1.5 HRS)' : 'INACTIVA'}
                </span>
              </h3>
            </div>
          </div>

          {/* Botones de Activación Masiva */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {!isClassroomSessionActive ? (
              <button
                onClick={() => activarSesionAula()}
                style={{
                  backgroundColor: 'var(--btn-logros-bg)',
                  color: 'var(--btn-logros-text)',
                  borderColor: 'var(--btn-logros-border)',
                }}
                className="flex-1 md:flex-none py-4 px-6 rounded-2xl border-4 font-black text-base shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>ACTIVAR CLASE (1.5 HRS)</span>
              </button>
            ) : (
              <button
                onClick={desactivarSesionAula}
                className="flex-1 md:flex-none py-4 px-6 rounded-2xl border-4 border-statusDanger bg-statusDanger-bg text-statusDanger font-black text-base shadow-lg hover:opacity-80 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Square className="w-5 h-5 fill-current" />
                <span>FINALIZAR CLASE AHORA</span>
              </button>
            )}
          </div>
        </div>

        {/* Lista de Alumnos Habilitados */}
        <div className="flex flex-col gap-4 bg-surface border-4 border-borderCustom rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between border-b-2 border-borderCustom pb-4">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-brand" />
              <h4 className="text-lg font-black text-primary">Estudiantes del Kinder (Nómina Activa)</h4>
            </div>
            <span className="text-xs font-extrabold text-brand bg-brand/10 px-3 py-1.5 rounded-xl border border-brand/30">
              {alumnos?.length || 0} Registrados
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            {alumnos?.map((a: Alumno) => (
              <div 
                key={a.id}
                className="flex items-center gap-3 p-3.5 bg-app rounded-2xl border-2 border-borderCustom shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-brand/10 text-brand font-black flex items-center justify-center border border-brand/30 shrink-0">
                  {a.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-extrabold text-primary text-sm truncate">{a.nombre}</span>
                  <span className="text-xs text-statusOk font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Habilitado
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ir al Panel Docente (progreso, alumnos y cuentos) */}
        <button
          onClick={() => setVistaInicio1('panel-docente')}
          style={{
            backgroundColor: 'var(--btn-hablar-bg)',
            color: 'var(--btn-hablar-text)',
            borderColor: 'var(--btn-hablar-border)',
          }}
          className="w-full py-4 rounded-2xl border-4 font-black text-base shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>PANEL DOCENTE: PROGRESO, ALUMNOS Y CUENTOS</span>
        </button>

        {/* Ir al Mosaico */}
        <button
          onClick={() => setVistaInicio1('aula-mosaico')}
          style={{
            backgroundColor: 'var(--btn-aprender-bg)',
            color: 'var(--btn-aprender-text)',
            borderColor: 'var(--btn-aprender-border)',
          }}
          className="w-full py-4 rounded-2xl border-4 font-black text-base shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>VER MOSAICO DE ALUMNOS EN TIEMPO REAL</span>
        </button>

      </div>
    </MainLayout>
  );
};