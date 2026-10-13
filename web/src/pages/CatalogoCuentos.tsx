import React from 'react';
import { ArrowLeft, BookOpen, Sparkles, Star } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { MainLayout } from '../layouts/MainLayout';
import { CharacterGuide } from '../components/common/CharacterGuide';
import { useAuthStore } from '../store/useAuthStore';
import { db, type Cuento, type Progreso } from '../db/db';

export interface CatalogoCuentosProps {
  nivelId: string;
  onSelectCuento: (cuentoId: string) => void;
  onBack: () => void;
  onSessionTimeoutRedirect?: () => void;
}

export const CatalogoCuentos: React.FC<CatalogoCuentosProps> = ({
  nivelId,
  onSelectCuento,
  onBack,
  onSessionTimeoutRedirect,
}) => {
  const { activeStudentId } = useAuthStore();
  const nivel = useLiveQuery(() => db.niveles.get(nivelId), [nivelId]);
  
  const cuentos = useLiveQuery(
    () => db.cuentos.where('nivelId').equals(nivelId).toArray(),
    [nivelId]
  );

  // Consulta corregida con retorno explícito de Progreso[]
  const progresos = useLiveQuery(
    async () => {
      if (!activeStudentId) return [];
      return await db.progresos.where('alumnoId').equals(activeStudentId).toArray();
    },
    [activeStudentId]
  );

  const cuentoEstaCompletado = (cuentoId?: string) => {
    if (!cuentoId || !progresos) return false;
    return progresos.some((p: Progreso) => p.cuentoId === cuentoId && p.completado);
  };

  return (
    <MainLayout onSessionTimeoutRedirect={onSessionTimeoutRedirect} allowScroll={true}>
      <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-8">
        
        {/* Encabezado Fijo */}
        <div className="flex items-center justify-between bg-surface/90 backdrop-blur-md p-4 rounded-3xl shadow-md border-2 border-borderCustom sticky top-0 z-20">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-app hover:bg-borderCustom/40 text-primary font-bold rounded-2xl border-2 border-borderCustom transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>VOLVER</span>
          </button>
          
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              {nivel ? `NIVEL ${nivel.codigo}` : 'NIVEL DE LECTURA'}
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-primary">
              {nivel ? nivel.nombre : 'Catálogo de Cuentos'}
            </h2>
          </div>

          <div className="w-24" />
        </div>

        {/* Guía en modo compacto */}
        <div className="w-full bg-surface/90 backdrop-blur-md rounded-3xl p-4 sm:p-6 shadow-xl border-2 border-borderCustom">
          <CharacterGuide 
            mensaje="¡Elige un cuento para comenzar tu práctica de lectura!"
            variant="compact"
          />
        </div>

        {/* Grilla de Cuentos */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-extrabold text-primary px-2">
            Cuentos Disponibles
          </h3>

          {!cuentos || cuentos.length === 0 ? (
            <div className="bg-surface border-2 border-borderCustom rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <BookOpen className="w-12 h-12 text-secondary animate-pulse" />
              <p className="text-lg font-bold text-primary">
                Aún no hay cuentos cargados para este nivel.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cuentos.map((cuento: Cuento) => {
                const completado = cuentoEstaCompletado(cuento.id);
                return (
                  <div
                    key={cuento.id}
                    onClick={() => cuento.id && onSelectCuento(cuento.id)}
                    className="bg-surface rounded-3xl border-4 border-borderCustom p-4 shadow-xl hover:border-brand transition-all active:scale-98 cursor-pointer flex flex-col justify-between gap-3 group relative overflow-hidden"
                  >
                    {/* Indicador ⭐ COMPLETADO */}
                    {completado && (
                      <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 shadow-md z-10">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>COMPLETADO</span>
                      </div>
                    )}

                    {/* Portada Resiliente */}
                    <div className="w-full h-40 bg-brand/10 rounded-2xl overflow-hidden relative flex items-center justify-center border-2 border-borderCustom group-hover:bg-brand/20 transition-colors">
                      {cuento.portadaUrl ? (
                        <img 
                          src={cuento.portadaUrl} 
                          alt={cuento.titulo} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 text-brand">
                          <Sparkles className="w-8 h-8 animate-pulse" />
                          <span className="text-sm font-bold">Lectura Dual</span>
                        </div>
                      )}
                    </div>

                    {/* Título y Descripción */}
                    <div className="flex flex-col gap-1.5 flex-1">
                      <h4 className="text-xl font-extrabold text-primary group-hover:text-brand transition-colors">
                        {cuento.titulo}
                      </h4>
                      <p className="text-sm text-secondary line-clamp-2">
                        {cuento.descripcion}
                      </p>
                    </div>

                    {/* Pie de Tarjeta */}
                    <div className="flex items-center justify-between pt-2 border-t-2 border-borderCustom">
                      <span className="text-xs font-bold text-secondary bg-app px-3 py-1.5 rounded-xl border border-borderCustom">
                        {cuento.paginas?.length || 1} {cuento.paginas?.length === 1 ? 'Página' : 'Páginas'}
                      </span>
                      
                      <span className={`px-4 py-2 font-bold text-sm rounded-xl shadow-md transition-opacity ${
                        completado ? 'bg-emerald-600 text-white' : 'bg-brand text-white'
                      } group-hover:opacity-90`}>
                        {completado ? 'RELEER' : 'LEER'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </MainLayout>
  );
};