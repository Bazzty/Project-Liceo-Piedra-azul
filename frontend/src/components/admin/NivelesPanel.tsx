import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Cuento, type Nivel } from '../../db/db';
import { CuentoForm } from './CuentoForm';
import { PictoImg } from './widgets';

const campo =
  'w-full bg-surface border-2 border-borderCustom rounded-2xl px-4 py-2.5 text-sm font-bold text-primary outline-none focus:border-brand';

const BotonAccion: React.FC<{
  onClick: () => void;
  icono: React.ReactNode;
  texto: string;
  peligro?: boolean;
}> = ({ onClick, icono, texto, peligro }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-black cursor-pointer transition-all ${
      peligro
        ? 'border-borderCustom text-statusDanger hover:border-statusDanger'
        : 'border-borderCustom text-primary hover:border-brand'
    }`}
  >
    {icono}
    {texto}
  </button>
);

/** Formulario simple para crear o renombrar un nivel (categoría). */
const NivelForm: React.FC<{ nivel?: Nivel; niveles: Nivel[]; onListo: () => void }> = ({ nivel, niveles, onListo }) => {
  const [codigo, setCodigo] = useState(nivel?.codigo ?? '');
  const [nombre, setNombre] = useState(nivel?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(nivel?.descripcion ?? '');
  const [error, setError] = useState('');

  const guardar = async () => {
    const cod = codigo.trim().toUpperCase();
    if (!cod || !nombre.trim()) return setError('El código y el nombre son obligatorios.');
    if (niveles.some((n) => n.codigo === cod && n.id !== nivel?.id)) return setError(`Ya existe el nivel ${cod}.`);

    if (nivel) {
      await db.niveles.update(nivel.id, { codigo: cod, nombre: nombre.trim(), descripcion: descripcion.trim() });
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
    <div className="bg-app border-2 border-borderCustom rounded-2xl p-4 flex flex-col gap-3">
      <h3 className="text-base font-black text-primary">{nivel ? 'Editar nivel' : 'Nuevo nivel'}</h3>
      {error && <p className="text-sm font-bold text-statusDanger">{error}</p>}
      <div className="grid grid-cols-[5rem_1fr] gap-3">
        <input className={campo} placeholder="Código" maxLength={2} value={codigo} onChange={(e) => setCodigo(e.target.value)} aria-label="Código del nivel" />
        <input className={campo} placeholder="Nombre del nivel" value={nombre} onChange={(e) => setNombre(e.target.value)} aria-label="Nombre del nivel" />
      </div>
      <input className={campo} placeholder="Descripción (opcional)" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} aria-label="Descripción del nivel" />
      <div className="flex gap-3">
        <button onClick={guardar} className="px-5 py-2.5 rounded-2xl bg-brand text-white font-black text-sm cursor-pointer hover:bg-brand-hover">
          Guardar
        </button>
        <button onClick={onListo} className="px-5 py-2.5 rounded-2xl text-secondary font-black text-sm cursor-pointer hover:text-primary">
          Cancelar
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
    if (!c.id || !window.confirm(`¿Eliminar «${c.titulo}»? También se borrará el avance de los alumnos en este cuento.`)) return;
    await db.transaction('rw', db.cuentos, db.progresos, async () => {
      await db.cuentos.delete(c.id as string);
      await db.progresos.where('cuentoId').equals(c.id as string).delete();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <button onClick={onVolver} className="self-start inline-flex items-center gap-2 text-sm font-bold text-secondary hover:text-brand cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Volver a los niveles
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-primary">Nivel {nivel.codigo} · Cuentos</h2>
          <p className="text-sm font-semibold text-secondary">{nivel.nombre}</p>
        </div>
        {modo === 'lista' && (
          <button
            onClick={() => setModo('nuevo')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand text-white font-black text-sm cursor-pointer hover:bg-brand-hover"
          >
            <Upload className="w-4 h-4" /> Subir cuento
          </button>
        )}
      </div>

      {modo === 'nuevo' && (
        <CuentoForm nivelId={nivel.id} onGuardado={() => setModo('lista')} onCancelar={() => setModo('lista')} />
      )}
      {typeof modo === 'object' && (
        <CuentoForm
          key={modo.editar.id}
          nivelId={nivel.id}
          cuento={modo.editar}
          onGuardado={() => setModo('lista')}
          onCancelar={() => setModo('lista')}
        />
      )}

      {modo === 'lista' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-black text-secondary border-b-2 border-borderCustom">
                <th className="py-2 pr-3">Cuento</th>
                <th className="py-2 pr-3">Páginas</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cuentos?.map((c) => (
                <tr key={c.id} className="border-b border-borderCustom">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      <PictoImg src={c.portadaUrl} alt={c.titulo} />
                      <span className="font-black text-primary">{c.titulo}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-3 font-bold text-primary">{c.paginas.length}</td>
                  <td className="py-3 pr-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black ${
                        c.estado === 'publicado' ? 'bg-statusOk-bg text-statusOk' : 'bg-statusWarn-bg text-statusWarn'
                      }`}
                    >
                      {c.estado === 'publicado' ? 'Publicado' : 'Borrador'}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex justify-end gap-2">
                      <BotonAccion onClick={() => setModo({ editar: c })} icono={<Pencil className="w-3.5 h-3.5" />} texto="Editar" />
                      <BotonAccion onClick={() => eliminar(c)} icono={<Trash2 className="w-3.5 h-3.5" />} texto="Eliminar" peligro />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {cuentos && cuentos.length === 0 && (
            <p className="py-6 text-sm font-semibold text-secondary">Este nivel aún no tiene cuentos.</p>
          )}
        </div>
      )}
    </div>
  );
};

/** 9d. Gestión de niveles (categorías) y, al entrar a cada una, de sus cuentos. */
export const NivelesPanel: React.FC = () => {
  const niveles = useLiveQuery(() => db.niveles.orderBy('orden').toArray(), []);
  const cuentos = useLiveQuery(() => db.cuentos.toArray(), []);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<'nuevo' | string | null>(null); // 'nuevo' o id del nivel a editar

  if (!niveles || !cuentos) return <p className="text-secondary font-semibold">Cargando niveles…</p>;

  const nivelAbierto = niveles.find((n) => n.id === abierto);
  if (nivelAbierto) return <CuentosDeNivel nivel={nivelAbierto} onVolver={() => setAbierto(null)} />;

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-primary">Niveles y cuentos</h2>
          <p className="text-sm font-semibold text-secondary">
            Entra a un nivel para editar sus cuentos, o cambia el nombre del nivel.
          </p>
        </div>
        {formulario === null && (
          <button
            onClick={() => setFormulario('nuevo')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand text-white font-black text-sm cursor-pointer hover:bg-brand-hover"
          >
            <Plus className="w-4 h-4" /> Nuevo nivel
          </button>
        )}
      </div>

      {formulario === 'nuevo' && <NivelForm niveles={niveles} onListo={() => setFormulario(null)} />}

      <ul className="flex flex-col gap-3">
        {niveles.map((n) =>
          formulario === n.id ? (
            <li key={n.id}>
              <NivelForm nivel={n} niveles={niveles} onListo={() => setFormulario(null)} />
            </li>
          ) : (
            <li key={n.id} className="flex flex-wrap items-center gap-3 bg-app border-2 border-borderCustom rounded-2xl p-3">
              <button
                onClick={() => setAbierto(n.id)}
                className="flex-1 min-w-0 flex items-center gap-4 text-left cursor-pointer group"
              >
                <span className="w-12 h-12 rounded-2xl bg-brand text-white flex items-center justify-center text-xl font-black shrink-0">
                  {n.codigo}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-black text-primary truncate group-hover:text-brand">{n.nombre}</span>
                  <span className="block text-xs font-semibold text-secondary">
                    {cuentos.filter((c) => c.nivelId === n.id).length} cuento(s)
                  </span>
                </span>
                <ChevronRight className="w-5 h-5 text-secondary shrink-0" />
              </button>
              <div className="flex gap-2">
                <BotonAccion onClick={() => setFormulario(n.id)} icono={<Pencil className="w-3.5 h-3.5" />} texto="Editar" />
                <BotonAccion onClick={() => eliminarNivel(n)} icono={<Trash2 className="w-3.5 h-3.5" />} texto="Eliminar" peligro />
              </div>
            </li>
          ),
        )}
      </ul>
    </div>
  );
};
