import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Cuento, type Nivel } from '../../db/db';
import { CuentoForm } from './CuentoForm';

const inputClase =
  'w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors';

const BotonAccion: React.FC<{
  onClick: () => void;
  icono: React.ReactNode;
  texto: string;
  peligro?: boolean;
}> = ({ onClick, icono, texto, peligro }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold cursor-pointer transition-colors shadow-xs ${
      peligro
        ? 'border-slate-300 dark:border-slate-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
        : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`}
  >
    {icono}
    {texto}
  </button>
);

/** Formulario compacto para crear o renombrar un nivel (categoría). */
const NivelForm: React.FC<{ nivel?: Nivel; niveles: Nivel[]; onListo: () => void }> = ({
  nivel,
  niveles,
  onListo,
}) => {
  const [codigo, setCodigo] = useState(nivel?.codigo ?? '');
  const [nombre, setNombre] = useState(nivel?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(nivel?.descripcion ?? '');
  const [error, setError] = useState('');

  const guardar = async () => {
    const cod = codigo.trim().toUpperCase();
    if (!cod || !nombre.trim()) return setError('El código y el nombre son obligatorios.');
    if (niveles.some((n) => n.codigo === cod && n.id !== nivel?.id))
      return setError(`Ya existe el nivel ${cod}.`);

    if (nivel) {
      await db.niveles.update(nivel.id, {
        codigo: cod,
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
      });
    } else {
      await db.niveles.add({
        id: `nivel-${cod.toLowerCase()}`,
        codigo: cod,
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        orden: Math.max(0, ...niveles.map((n) => n.orden)) + 1,
      });
    }
    onListo();
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
        {nivel ? 'Editar nivel' : 'Crear nuevo nivel'}
      </h3>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md text-xs text-red-600 dark:text-red-400 font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Código del Nivel (Ej: A, B, 1)</label>
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className={inputClase}
            aria-label="Código del nivel"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Nombre del Nivel</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={inputClase}
            aria-label="Nombre del nivel"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Descripción Pedagógica</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className={`${inputClase} h-20 resize-none`}
          aria-label="Descripción del nivel"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          onClick={onListo}
          className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={guardar}
          className="px-4 py-2 rounded-md bg-brand text-white text-xs font-medium hover:bg-brand-hover cursor-pointer transition-colors shadow-xs"
        >
          Guardar nivel
        </button>
      </div>
    </div>
  );
};

/** Cuentos de un nivel: listar, subir, editar y eliminar. */
const CuentosDeNivel: React.FC<{ nivel: Nivel; onVolver: () => void }> = ({ nivel, onVolver }) => {
  const cuentos = useLiveQuery(() => db.cuentos.where('nivelId').equals(nivel.id).toArray(), [nivel.id]);
  const [modo, setModo] = useState<'lista' | 'nuevo' | { editar: Cuento }>('lista');

  const eliminar = async (c: Cuento) => {
    if (!c.id || !window.confirm(`¿Eliminar «${c.titulo}»? También se borrará el avance de los alumnos en este cuento.`))
      return;
    await db.transaction('rw', db.cuentos, db.progresos, async () => {
      await db.cuentos.delete(c.id as string);
      await db.progresos.where('cuentoId').equals(c.id as string).delete();
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <div>
        <button
          onClick={onVolver}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand transition-colors cursor-pointer mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al catálogo de niveles
        </button>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-brand/10 text-brand font-bold text-xs">
                Nivel {nivel.codigo}
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{nivel.nombre}</h2>
            </div>
            {nivel.descripcion && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{nivel.descripcion}</p>
            )}
          </div>

          {modo === 'lista' && (
            <button
              onClick={() => setModo('nuevo')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand text-white text-xs font-medium hover:bg-brand-hover cursor-pointer transition-colors shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" /> Crear cuento
            </button>
          )}
        </div>
      </div>

      {modo === 'nuevo' && (
        <CuentoForm nivelId={nivel.id} onGuardado={() => setModo('lista')} onCancelar={() => setModo('lista')} />
      )}
      {typeof modo === 'object' && 'editar' in modo && (
        <CuentoForm cuento={modo.editar} nivelId={nivel.id} onGuardado={() => setModo('lista')} onCancelar={() => setModo('lista')} />
      )}

      {modo === 'lista' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Título del Cuento</th>
                  <th className="py-3 px-4">N° Páginas</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {cuentos?.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{c.titulo}</div>
                      {c.descripcion && <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-md">{c.descripcion}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">{c.paginas.length} páginas</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.estado === 'publicado'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}
                      >
                        {c.estado === 'publicado' ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <BotonAccion onClick={() => setModo({ editar: c })} icono={<Pencil className="w-3.5 h-3.5" />} texto="Editar" />
                        <BotonAccion onClick={() => eliminar(c)} icono={<Trash2 className="w-3.5 h-3.5" />} texto="Eliminar" peligro />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {cuentos && cuentos.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
              Este nivel aún no tiene cuentos registrados.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** Gestión de niveles (categorías) del programa de lectura */
export const NivelesPanel: React.FC = () => {
  const niveles = useLiveQuery(() => db.niveles.orderBy('orden').toArray(), []);
  const cuentos = useLiveQuery(() => db.cuentos.toArray(), []);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<'nuevo' | string | null>(null);

  if (!niveles || !cuentos) {
    return <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">Cargando niveles pedagógicos…</div>;
  }

  const nivelAbierto = niveles.find((n) => n.id === abierto);
  if (nivelAbierto) {
    return <CuentosDeNivel nivel={nivelAbierto} onVolver={() => setAbierto(null)} />;
  }

  const eliminarNivel = async (n: Nivel) => {
    const ids = cuentos.filter((c) => c.nivelId === n.id).map((c) => c.id as string);
    const aviso = ids.length
      ? `¿Eliminar el nivel ${n.codigo}? También se eliminarán sus ${ids.length} cuento(s) y el avance asociado.`
      : `¿Eliminar el nivel ${n.codigo}?`;
    if (!window.confirm(aviso)) return;

    await db.transaction('rw', db.niveles, db.cuentos, db.progresos, async () => {
      await db.progresos.where('cuentoId').anyOf(ids).delete();
      await db.cuentos.bulkDelete(ids);
      await db.niveles.delete(n.id);
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Niveles Pedagógicos y Lecturas</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Selecciona un nivel para administrar sus cuentos o crear nuevas unidades de lectura
          </p>
        </div>

        {formulario === null && (
          <button
            onClick={() => setFormulario('nuevo')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand text-white text-xs font-medium hover:bg-brand-hover cursor-pointer transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" /> Nuevo nivel
          </button>
        )}
      </div>

      {formulario === 'nuevo' && (
        <NivelForm niveles={niveles} onListo={() => setFormulario(null)} />
      )}

      <div className="flex flex-col gap-4">
        {niveles.map((n) =>
          formulario === n.id ? (
            <NivelForm key={n.id} nivel={n} niveles={niveles} onListo={() => setFormulario(null)} />
          ) : (
            <div
              key={n.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-brand/10 text-brand font-bold text-xs">
                    {n.codigo}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {cuentos.filter((c) => c.nivelId === n.id).length} cuento(s) publicados
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">{n.nombre}</h3>
                {n.descripcion && <p className="text-xs text-slate-500 dark:text-slate-400">{n.descripcion}</p>}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <BotonAccion onClick={() => setFormulario(n.id)} icono={<Pencil className="w-3.5 h-3.5" />} texto="Editar" />
                <BotonAccion onClick={() => eliminarNivel(n)} icono={<Trash2 className="w-3.5 h-3.5" />} texto="Eliminar" peligro />
                <button
                  onClick={() => setAbierto(n.id)}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md bg-brand text-white text-xs font-medium hover:bg-brand-hover transition-colors cursor-pointer shadow-xs ml-2"
                >
                  Ver cuentos <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};