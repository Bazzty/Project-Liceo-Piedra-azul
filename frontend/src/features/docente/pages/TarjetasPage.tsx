import React, { useEffect } from 'react';
import { Info, Printer } from 'lucide-react';
import { useAlumnos } from '@/api';
import { useTarjetasStore } from '@/features/acceso/useTarjetasStore';
import { AdminLayout } from '@/features/docente/AdminLayout';
import { EncabezadoPagina, Hoja } from '@/features/docente/components/Hoja';
import { Button } from '@/shared/ui';
import type { Alumno } from '@/types';

/** Una tarjeta lista para recortar: solo nombre de pila y código (sin apellido ni foto, por privacidad). */
const TarjetaImprimible: React.FC<{ alumno: Alumno; codigo: string }> = ({ alumno, codigo }) => (
  <div className="border-[1.5px] border-dashed border-borderStrong rounded-md p-1.5 flex break-inside-avoid">
    <div className="flex-1 border border-borderCustom rounded-[0.3rem] overflow-hidden flex flex-col bg-surface">
      <div className="bg-brand text-onBrand px-3 py-1.5 text-[0.7rem] font-bold">Leer para Todos · Liceo Piedra Azul</div>
      <div className="flex-1 flex items-center gap-3 px-3 py-3">
        <span
          className="w-11 h-11 shrink-0 rounded-full bg-brand/15 border-2 border-brand text-brand font-display text-xl font-semibold flex items-center justify-center"
          aria-hidden
        >
          {alumno.nombre.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="font-display text-xl font-semibold text-primary truncate">{alumno.nombre}</p>
          <div className="mt-1.5 flex gap-1" aria-label={`Código: ${codigo.split('').join(' ')}`}>
            {codigo.split('').map((d, i) => (
              <span
                key={i}
                aria-hidden
                className="w-6 h-[1.9rem] rounded-[5px] border-[1.5px] border-brand text-primary text-lg font-bold flex items-center justify-center"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

/** Tarjetas de acceso: vista previa de la hoja (2 × 3 por hoja carta), impresión y códigos regenerables. */
export const TarjetasPage: React.FC = () => {
  const alumnos = useAlumnos();
  const { tarjetas, asegurar, regenerar } = useTarjetasStore();

  useEffect(() => {
    if (alumnos) asegurar(alumnos.map((a) => a.id!).filter(Boolean));
  }, [alumnos, asegurar]);

  const lista = (alumnos ?? [])
    .map((alumno) => ({ alumno, codigo: tarjetas.find((t) => t.alumnoId === alumno.id)?.codigo }))
    .filter((f): f is { alumno: Alumno; codigo: string } => Boolean(f.codigo))
    .sort((a, b) => a.alumno.nombre.localeCompare(b.alumno.nombre, 'es'));

  const regenerarCodigo = (alumno: Alumno) => {
    if (alumno.id && window.confirm(`Se creará un código nuevo para ${alumno.nombre}. El anterior dejará de funcionar. ¿Continuar?`)) {
      regenerar(alumno.id);
    }
  };

  return (
    <AdminLayout activeSection="tarjetas">
      <div className="print:hidden flex flex-col gap-5">
        <EncabezadoPagina
          etiqueta="Acceso de los estudiantes"
          titulo="Tarjetas de acceso"
          descripcion="Cada niño entra con el código de su tarjeta. Imprímelas, recórtalas y entrégalas."
          acciones={
            <Button size="lg" onClick={() => window.print()}>
              <Printer className="w-5 h-5" aria-hidden /> Imprimir o guardar PDF
            </Button>
          }
        />

        <div className="flex items-start gap-3 rounded-control border border-statusInfo bg-statusInfo-bg px-4 py-3 text-statusInfo">
          <Info className="w-5 h-5 mt-0.5 shrink-0" aria-hidden />
          <p className="text-sm leading-relaxed">
            Por privacidad, la tarjeta lleva solo el <strong>nombre de pila</strong> y el código: sin apellido, foto ni otros datos. Si un niño
            pierde su tarjeta, regenera su código y el anterior deja de funcionar.
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] print:block">
        <section aria-label="Vista previa de la hoja" className="bg-borderCustom rounded-card p-4 flex justify-center print:bg-transparent print:p-0">
          <div className="w-full max-w-[40rem] bg-surface shadow-card p-6 grid grid-cols-2 gap-3.5 content-start print:shadow-none print:max-w-none print:p-0">
            {lista.map(({ alumno, codigo }) => (
              <TarjetaImprimible key={alumno.id} alumno={alumno} codigo={codigo} />
            ))}
          </div>
        </section>

        <Hoja aria-label="Códigos del curso" className="print:hidden self-start">
          <h2 className="font-display text-2xl font-semibold text-primary">Códigos del curso</h2>
          <p className="text-xs text-secondary">{lista.length} estudiantes · todas las tarjetas activas</p>
          <ul className="mt-2">
            {lista.map(({ alumno, codigo }) => (
              <li key={alumno.id} className="flex items-center gap-3 py-2.5 border-t border-borderCustom">
                <span className="flex-1 font-display text-lg font-semibold text-primary">{alumno.nombre}</span>
                <span className="text-sm tracking-[0.14em] text-secondary">{codigo}</span>
                <span className="px-2 py-0.5 rounded-sm bg-statusOk-bg text-statusOk text-xs font-semibold">✓ Activa</span>
                <button
                  type="button"
                  onClick={() => regenerarCodigo(alumno)}
                  className="min-h-10 px-3 rounded-control border border-borderStrong text-xs font-semibold text-primary cursor-pointer hover:border-brand"
                >
                  Regenerar
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-secondary">Línea punteada = recortar. Se imprimen 6 tarjetas por hoja carta (2 × 3).</p>
        </Hoja>
      </div>
    </AdminLayout>
  );
};
