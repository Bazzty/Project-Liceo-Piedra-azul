import React, { useState } from 'react';
import { Sparkles, Trash2, Volume2, Save, X, Info } from 'lucide-react';
import { db, type Cuento, type CuentoPagina, type CuentoPalabra } from '../../db/db';
import { getArasaacImageUrl, fetchArasaacPictogramId, searchArasaacPictograms, type ArasaacOpcion } from '../../services/arasaac';
import { normalizar } from './format';
import { PictoImg } from './widgets';

const SIN_PICTOGRAMA = ['un', 'una', 'el', 'la', 'los', 'las', 'me', 'mi', 'te', 'tu', 'de', 'y', 'en', 'a'];
const limpiar = (palabra: string) => palabra.replace(/[.,;:!?¡¿«»"()]/g, '');
const textoDePagina = (p: CuentoPagina) => p.palabras.map((w) => w.texto).join(' ');

const construirPaginas = (texto: string, previas: CuentoPagina[]): CuentoPagina[] => {
  const memoria = new Map<string, CuentoPalabra>();
  previas.forEach((pg) => pg.palabras.forEach((w) => memoria.set(normalizar(w.texto), w)));
  return texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((linea, i) => {
      const original = previas[i];
      const palabras = linea
        .split(/\s+/)
        .map(limpiar)
        .filter(Boolean)
        .map((t) => {
          const previa = memoria.get(normalizar(t));
          return { texto: t, pictogramaUrl: previa?.pictogramaUrl, audioUrl: previa?.audioUrl };
        });
      if (original && linea === textoDePagina(original)) {
        return { ...original, numeroPagina: i + 1, palabras };
      }
      return { numeroPagina: i + 1, textoCompleto: linea, palabras };
    });
};

interface CuentoFormProps {
  nivelId: string;
  cuento?: Cuento;
  onGuardado: () => void;
  onCancelar: () => void;
}

// Estilo adaptable para cajas de texto: Blanco en Día / Gris oscuro en Noche con letra blanca accesible
const inputClase =
  'w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors';

export const CuentoForm: React.FC<CuentoFormProps> = ({ nivelId, cuento, onGuardado, onCancelar }) => {
  const [titulo, setTitulo] = useState(cuento?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(cuento?.descripcion ?? '');
  const [texto, setTexto] = useState(cuento ? cuento.paginas.map(textoDePagina).join('\n') : '');
  const [paginas, setPaginas] = useState<CuentoPagina[]>(cuento?.paginas ?? []);
  const [sugiriendo, setSugiriendo] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [editando, setEditando] = useState<{ p: number; w: number } | null>(null);
  const [opciones, setOpciones] = useState<ArasaacOpcion[] | null>(null);
  const [buscando, setBuscando] = useState(false);

  const cambiarTexto = (nuevo: string) => {
    setTexto(nuevo);
    setPaginas((prev) => construirPaginas(nuevo, prev));
    setEditando(null);
  };

  const asignarPictograma = (p: number, w: number, url: string | undefined) => {
    setPaginas((prev) =>
      prev.map((pg, i) =>
        i !== p ? pg : { ...pg, palabras: pg.palabras.map((pw, j) => (j === w ? { ...pw, pictogramaUrl: url } : pw)) },
      ),
    );
  };

  const sugerirPictogramas = async () => {
    setSugiriendo(true);
    setMensaje('');
    const locales = await db.pictogramas.toArray();
    const catalogo = new Map(locales.map((p) => [normalizar(p.palabra), p.imagenUrl]));
    const cache = new Map<string, string | undefined>();
    let sinInternet = 0;

    const buscar = async (palabra: string) => {
      const clave = normalizar(palabra);
      if (cache.has(clave)) return cache.get(clave);
      let url = catalogo.get(clave);
      if (!url) {
        const id = await fetchArasaacPictogramId(palabra);
        if (id) url = getArasaacImageUrl(id);
        else sinInternet += 1;
      }
      cache.set(clave, url);
      return url;
    };

    const nuevas: CuentoPagina[] = [];
    for (const pg of paginas) {
      const palabras: CuentoPalabra[] = [];
      for (const w of pg.palabras) {
        if (w.pictogramaUrl || SIN_PICTOGRAMA.includes(normalizar(w.texto))) palabras.push(w);
        else palabras.push({ ...w, pictogramaUrl: await buscar(w.texto) });
      }
      nuevas.push({ ...pg, palabras });
    }
    setPaginas(nuevas);
    setSugiriendo(false);
    setMensaje(
      sinInternet > 0
        ? `${sinInternet} palabra(s) sin pictograma (sin coincidencia u offline). Puedes asignarlas manualmente.`
        : 'Pictogramas asignados automáticamente.',
    );
  };

  const abrirEditor = async (p: number, w: number) => {
    setEditando({ p, w });
    setOpciones(null);
    setBuscando(true);
    setOpciones(await searchArasaacPictograms(paginas[p].palabras[w].texto));
    setBuscando(false);
  };

  const probarVoz = () => {
    if (!('speechSynthesis' in window) || !texto.trim()) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(paginas.map((p) => p.textoCompleto || textoDePagina(p)).join('. '));
    u.lang = 'es-CL';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  const guardar = async (estado: 'borrador' | 'publicado') => {
    setError('');
    if (!titulo.trim()) return setError('El cuento necesita un título.');
    if (paginas.length === 0) return setError('Escribe al menos una frase para el cuento.');

    const datos = {
      nivelId,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      paginas,
      estado,
    };

    if (cuento?.id) {
      await db.cuentos.update(cuento.id, datos);
    } else {
      await db.cuentos.add({
        ...datos,
        id: `cuento-${crypto.randomUUID()}`,
        fechaCreacion: new Date().toISOString(),
      });
    }
    onGuardado();
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {cuento ? 'Editar Cuento' : 'Crear Cuento Nuevo'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Editor adaptado para vista docente en pantalla completa</p>
        </div>
        <button
          onClick={onCancelar}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <p className="bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-md px-4 py-2 text-xs font-medium">
          {error}
        </p>
      )}

      {/* Grid a 2 columnas para Monitores / Laptops */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Formulario (5 columnas de 12) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-900 dark:text-white">Título del Cuento</span>
            <input
              className={inputClase}
              placeholder="Ej: El Auto de Ana"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-900 dark:text-white">Descripción Pedagógica</span>
            <input
              className={inputClase}
              placeholder="Ej: Práctica de vocales y consonante M"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-900 dark:text-white">Texto del Cuento (Una frase por página)</span>
            <textarea
              className={`${inputClase} min-h-[160px] resize-y font-mono text-xs`}
              placeholder={'Ana ve un auto\nEl auto es azul\nAna está feliz'}
              value={texto}
              onChange={(e) => cambiarTexto(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={sugerirPictogramas}
              disabled={sugiriendo || paginas.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-brand text-brand hover:bg-brand/10 text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" /> {sugiriendo ? 'Buscando...' : 'Autoasignar Pictogramas'}
            </button>
            <button
              onClick={probarVoz}
              disabled={paginas.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
            >
              <Volume2 className="w-3.5 h-3.5" /> Probar Voz
            </button>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
            <span>Al presionar "Auto-asignar", el sistema cruzará cada palabra con el catálogo local e imágenes de ARASAAC.</span>
          </div>
          {mensaje && <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{mensaje}</p>}
        </div>

        {/* Columna Derecha: Vista previa de páginas y pictogramas (7 columnas de 12) */}
        <div className="lg:col-span-7 flex flex-col gap-3 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-6 max-h-[600px] overflow-y-auto">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Revisión de Páginas y Pictogramas ({paginas.length})
          </h4>
          {paginas.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-md">
              Escribe oraciones en el editor para generar las páginas interactivas.
            </div>
          ) : (
            paginas.map((pg, p) => (
              <div key={p} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md p-3.5 flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-brand">Página {pg.numeroPagina}</span>
                <div className="flex flex-wrap gap-2">
                  {pg.palabras.map((w, i) => (
                    <button
                      key={i}
                      onClick={() => abrirEditor(p, i)}
                      aria-label={`Cambiar pictograma de ${w.texto}`}
                      className={`flex flex-col items-center gap-1 p-2 rounded-md border cursor-pointer transition-colors bg-white dark:bg-slate-800 ${
                        editando?.p === p && editando.w === i
                          ? 'border-brand ring-1 ring-brand shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:border-brand'
                      }`}
                    >
                      {w.pictogramaUrl ? (
                        <PictoImg src={w.pictogramaUrl} alt={w.texto} className="w-12 h-12" />
                      ) : (
                        <div className="w-12 h-12 rounded-md border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm font-semibold">
                          +
                        </div>
                      )}
                      <span className="text-[11px] font-medium text-slate-900 dark:text-white">{w.texto}</span>
                    </button>
                  ))}
                </div>

                {/* Selector de Pictogramas ARASAAC */}
                {editando?.p === p && editando.w < paginas[p].palabras.length && (
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-3 mt-2 flex flex-col gap-2 shadow-xs">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      Seleccionar imagen para «{paginas[p].palabras[editando.w].texto}»
                    </span>
                    {buscando && <span className="text-xs text-slate-400 dark:text-slate-500">Consultando biblioteca ARASAAC...</span>}
                    {!buscando && opciones && opciones.length === 0 && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">Sin coincidencias encontradas.</span>
                    )}
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                      {opciones?.map((o) => (
                        <button
                          key={o.id}
                          onClick={() => {
                            asignarPictograma(p, editando.w, o.url);
                            setEditando(null);
                          }}
                          className="cursor-pointer rounded-md hover:ring-2 hover:ring-brand transition-all p-0.5 bg-white border border-slate-200 dark:border-slate-700"
                        >
                          <PictoImg src={o.url} alt={`pictograma ${o.id}`} className="w-12 h-12" />
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        asignarPictograma(p, editando.w, undefined);
                        setEditando(null);
                      }}
                      className="self-start inline-flex items-center gap-1 text-[11px] text-rose-500 hover:underline cursor-pointer mt-1 font-medium"
                    >
                      <Trash2 className="w-3 h-3" /> Quitar pictograma
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Botones Inferiores de Guardado */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={onCancelar}
          className="px-4 py-2 rounded-md text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          onClick={() => guardar('borrador')}
          className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium transition-colors cursor-pointer shadow-xs"
        >
          Guardar borrador
        </button>
        <button
          onClick={() => guardar('publicado')}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md bg-brand text-white hover:bg-brand-hover text-xs font-medium transition-colors cursor-pointer shadow-xs"
        >
          <Save className="w-4 h-4" /> Publicar Cuento
        </button>
      </div>
    </div>
  );
};