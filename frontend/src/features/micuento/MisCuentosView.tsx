import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Home, Library, Plus, Volume2 } from 'lucide-react';
import { useMiCuento, useMisCuentos } from '@/api';
import { ROUTES } from '@/app/routes';
import { opcionDe, partesDelCuento, PASOS, urlPictograma, type Eleccion } from '@/features/micuento/frases';
import { PaginaDelCuento } from '@/features/micuento/PaginaDelCuento';
import { sonarToque } from '@/shared/audio/sonidos';
import { LayoutEstudiante } from '@/shared/components/LayoutEstudiante';
import { OsoBurbuja } from '@/shared/components/OsoBurbuja';
import { useAuthStore } from '@/shared/store/useAuthStore';
import { Button } from '@/shared/ui';
import type { MiCuento } from '@/types';

const eleccionDe = (c: MiCuento): Eleccion => ({ quien: c.quien, donde: c.donde, accion: c.accion });

/** Repisa: los cuentos que el niño armó, para volver a escucharlos. Cada uno se reconoce por sus tres pictogramas. */
export const MisCuentosView: React.FC = () => {
  const navigate = useNavigate();
  const activeStudentId = useAuthStore((s) => s.activeStudentId);
  const cuentos = useMisCuentos(activeStudentId);

  return (
    <LayoutEstudiante onVolver={() => navigate(ROUTES.menu)}>
      <main data-barrido-esperar className="relative flex-1 w-full max-w-5xl mx-auto px-4 py-4 sm:py-6 flex flex-col items-center gap-4 sm:gap-6">
        <h1 className="sr-only">Mis cuentos</h1>
        <OsoBurbuja mensaje="Mis cuentos" clave="mis_cuentos" hablarAlAparecer size="md" />

        {cuentos && cuentos.length > 0 ? (
          <ul className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {cuentos.map((c) => {
              const nombre = PASOS.map((p) => opcionDe(p, c[p])?.alt).filter(Boolean).join(', ');
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-label={`Cuento: ${nombre}`}
                    onClick={() => {
                      sonarToque();
                      navigate(ROUTES.miCuentoGuardado(c.id ?? ''));
                    }}
                    className="w-full flex items-center justify-center gap-3 rounded-card border-4 border-borderStrong bg-surface p-3 sm:p-4 shadow-card cursor-pointer hover:border-brand active:scale-95 transition-all min-h-32"
                  >
                    {PASOS.map((p) => {
                      const opcion = opcionDe(p, c[p]);
                      return opcion ? <img key={p} src={urlPictograma(opcion)} alt={opcion.alt} className="w-20 h-20 sm:w-28 sm:h-28 object-contain" /> : null;
                    })}
                    <Volume2 className="w-9 h-9 shrink-0 text-brand" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-full bg-surface/90 px-6 py-2 text-xl font-black text-secondary">Aquí irán tus cuentos</p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button variant="accent" size="xl" data-clave-voz="mi_cuento" onClick={() => navigate(ROUTES.miCuento)}>
            <Plus className="w-8 h-8" aria-hidden />
            Mi cuento
          </Button>
          <Button variant="secondary" size="xl" onClick={() => navigate(ROUTES.menu)}>
            <Home className="w-8 h-8" aria-hidden />
            Inicio
          </Button>
        </div>
      </main>
    </LayoutEstudiante>
  );
};

/** Un cuento guardado: el osito lo lee otra vez. */
export const MiCuentoGuardadoView: React.FC = () => {
  const { cuentoId } = useParams();
  const navigate = useNavigate();
  const activeStudentId = useAuthStore((s) => s.activeStudentId);
  const cuento = useMiCuento(activeStudentId, cuentoId === undefined ? undefined : Number(cuentoId));
  const [lecturas, setLecturas] = useState(0);
  const partes = useMemo(() => (cuento ? partesDelCuento(eleccionDe(cuento)) : null), [cuento]);

  const volver = () => navigate(ROUTES.misCuentos);

  return (
    <LayoutEstudiante onVolver={volver}>
      <main data-barrido-esperar className="relative flex-1 w-full max-w-5xl mx-auto px-4 py-4 sm:py-6 flex flex-col items-center gap-4 sm:gap-6">
        <h1 className="sr-only">Mi cuento guardado</h1>
        {partes ? (
          <>
            <PaginaDelCuento partes={partes} lecturas={lecturas} />
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button variant="accent" size="xl" data-clave-voz="escuchar_otra_vez" onClick={() => setLecturas((n) => n + 1)}>
                <Volume2 className="w-8 h-8" aria-hidden />
                Escuchar otra vez
              </Button>
              <Button variant="secondary" size="xl" data-clave-voz="mis_cuentos" onClick={volver}>
                <Library className="w-8 h-8" aria-hidden />
                Mis cuentos
              </Button>
            </div>
          </>
        ) : cuento === null ? (
          // Un cuento que no existe (o es de otro niño): sin mensajes de error, de vuelta a la repisa
          <Button variant="secondary" size="xl" onClick={volver}>
            <Library className="w-8 h-8" aria-hidden />
            Mis cuentos
          </Button>
        ) : null}
      </main>
    </LayoutEstudiante>
  );
};
