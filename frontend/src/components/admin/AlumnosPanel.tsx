import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, Palette, Volume2, Search, GraduationCap } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type VozId } from '../../db/db';
import { THEMES_CONFIG } from '../../config/themes';
import { VOCES_CONFIG, VOZ_POR_DEFECTO } from '../../config/voces';
import { formatearFecha } from './format';
import { useListaAlumnos, useResumen } from './useResumen';
import { ProgresoPorCuento, RegistroLista, StatsGrid } from './widgets';

const Avatar: React.FC<{ nombre: string; url?: string; grande?: boolean }> = ({ nombre, url, grande }) => (
  <div
    className={`${
      grande ? 'w-14 h-14 text-lg' : 'w-9 h-9 text-xs'
    } rounded-full bg-admin-surface border border-admin-border flex items-center justify-center font-bold text-admin-text-main overflow-hidden shrink-0`}
  >
    {url ? <img src={url} alt={nombre} className="w-full h-full object-cover" /> : nombre.charAt(0).toUpperCase()}
  </div>
);

/** Detalle de un alumno con tarjetas limpias de avance y configuración de color/voz */
const DetalleAlumno: React.FC<{ alumnoId: string; onVolver: () => void }> = ({ alumnoId, onVolver }) => {
  const alumno = useLiveQuery(() => db.alumnos.get(alumnoId), [alumnoId]);
  const resumen = useResumen(alumnoId);

  if (!alumno || !resumen) return <div className="p-8 text-center text-xs text-admin-text-muted">Cargando expediente…</div>;

  const vozActual = alumno.vozId ?? VOZ_POR_DEFECTO;

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <div>
        <button
          onClick={onVolver}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-admin-text-secondary hover:text-admin-primary transition-colors cursor-pointer mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la lista de alumnos
        </button>

        {/* Cabecera del Expediente */}
        <div className="bg-admin-surface border border-admin-border rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar nombre={alumno.nombre} url={alumno.avatarUrl} grande />
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-admin-text-main">
                Expediente: {alumno.nombre} {alumno.apellido}
              </h2>
              <span className="inline-flex items-center gap-1 text-xs text-admin-text-secondary mt-0.5">
                <GraduationCap className="w-3.5 h-3.5" /> Estudiante PIE • Kínder
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:items-end text-xs text-admin-text-secondary">
            <span>Última actividad:</span>
            <span className="font-semibold text-admin-text-main">
              {resumen.ultimaActividad ? formatearFecha(resumen.ultimaActividad) : 'Sin registros'}
            </span>
          </div>
        </div>
      </div>

      {/* KPIs del Alumno */}
      <StatsGrid resumen={resumen} />

      {/* Paneles Inferiores: Progreso y Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgresoPorCuento resumen={resumen} />
        <RegistroLista resumen={resumen} />
      </div>

      {/* Ajustes de Accesibilidad del Alumno */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tema Visual */}
        <div className="bg-admin-surface border border-admin-border rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-admin-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-admin-text-main">Tema Visual Preferido</h3>
          </div>
          <p className="text-xs text-admin-text-secondary">
            Selecciona el tema de color personalizado con el que trabaja el estudiante.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {THEMES_CONFIG.map((t) => (
              <button
                key={t.id}
                onClick={() => db.alumnos.update(alumnoId, { temaId: t.id })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
                  alumno.temaId === t.id
                    ? 'border-admin-primary bg-admin-primary-light text-admin-primary font-bold shadow-xs'
                    : 'border-admin-border bg-admin-bg text-admin-text-main hover:bg-admin-surface-hover'
                }`}
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.colorPreviewHex }} />
                <span className="truncate">{t.nombre}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sintetizador de Voz */}
        <div className="bg-admin-surface border border-admin-border rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-admin-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-admin-text-main">Sintetizador de Voz</h3>
          </div>
          <p className="text-xs text-admin-text-secondary">
            Elige la voz del lector de pantalla predeterminada para este alumno.
          </p>
          <div className="flex flex-col gap-2">
            {VOCES_CONFIG.map((v) => (
              <button
                key={v.id}
                onClick={() => db.alumnos.update(alumnoId, { vozId: v.id as VozId })}
                className={`w-full text-left px-3.5 py-3 rounded-md border text-xs transition-colors cursor-pointer ${
                  vozActual === v.id
                    ? 'border-admin-primary bg-admin-primary-light text-admin-text-main font-bold shadow-xs'
                    : 'border-admin-border bg-admin-bg hover:bg-admin-surface-hover text-admin-text-secondary'
                }`}
              >
                <div className="font-semibold text-admin-text-main">{v.nombre}</div>
                <div className="text-[11px] text-admin-text-secondary mt-0.5">{v.descripcion}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/** Lista de alumnos presentada en Data Table sobria de alta densidad */
export const AlumnosPanel: React.FC = () => {
  const filas = useListaAlumnos();
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  if (seleccionado) {
    return <DetalleAlumno alumnoId={seleccionado} onVolver={() => setSeleccionado(null)} />;
  }

  if (!filas) {
    return <div className="p-8 text-center text-xs text-admin-text-muted">Cargando nómina de alumnos…</div>;
  }

  const filtrados = filas.filter(({ alumno }) =>
    `${alumno.nombre} ${alumno.apellido}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-admin-text-main">Nómina de Estudiantes</h2>
          <p className="text-xs text-admin-text-secondary mt-0.5">
            Gestión individual de avance, voz y temas para estudiantes de Kínder
          </p>
        </div>

        {/* Buscador de Alumno */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-text-muted" />
          <input
            type="text"
            placeholder="Buscar estudiante..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-admin-surface border border-admin-border rounded-md pl-9 pr-3 py-1.5 text-xs text-admin-text-main placeholder-admin-text-muted focus:outline-none focus:border-admin-primary"
          />
        </div>
      </div>

      {/* Data Table de Alumnos */}
      <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-admin-border bg-admin-surface-hover text-[11px] font-bold text-admin-text-secondary uppercase tracking-wider">
                <th className="py-3 px-4">Estudiante</th>
                <th className="py-3 px-4">Cuentos Completados</th>
                <th className="py-3 px-4">Porcentaje Avance</th>
                <th className="py-3 px-4">Última Actividad</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border text-xs">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-admin-text-muted">
                    No se encontraron estudiantes con ese nombre.
                  </td>
                </tr>
              ) : (
                filtrados.map(({ alumno, terminados, posibles, ultimaActividad }, idx) => {
                  const pct = posibles ? Math.round((terminados / posibles) * 100) : 0;
                  return (
                    <tr
                      key={alumno.id}
                      onClick={() => alumno.id && setSeleccionado(alumno.id)}
                      className={`hover:bg-admin-surface-hover transition-colors cursor-pointer ${
                        idx % 2 === 1 ? 'bg-admin-table-row-even' : ''
                      }`}
                    >
                      <td className="py-3 px-4 flex items-center gap-3">
                        <Avatar nombre={alumno.nombre} url={alumno.avatarUrl} />
                        <div className="flex flex-col">
                          <span className="font-bold text-admin-text-main">
                            {alumno.nombre} {alumno.apellido}
                          </span>
                          <span className="text-[10px] text-admin-text-secondary">Kínder A</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-admin-text-secondary font-medium">
                        {terminados} de {posibles}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-admin-border h-2 rounded-full overflow-hidden">
                            <div className="bg-admin-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="font-bold text-admin-text-main">{pct}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-admin-text-secondary">
                        {ultimaActividad ? formatearFecha(ultimaActividad) : 'Sin registros'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-admin-primary font-bold hover:underline">
                          Ver expediente <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};