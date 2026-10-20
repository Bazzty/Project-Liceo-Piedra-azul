import React, { useState } from 'react';
import { Sparkles, Trash2, Volume2 } from 'lucide-react';
import type { Cuento, CuentoPagina, CuentoPalabra } from '@/types';
import { getArasaacImageUrl, fetchArasaacPictogramId, searchArasaacPictograms, type ArasaacOpcion } from '@/features/tablero/arasaac';
import { normalizar } from '@/features/docente/components/format';
import { PictoImg } from '@/features/docente/components/widgets';
import { Button } from '@/shared/ui';
import { actualizarCuento, crearCuento, listarPictogramas } from '@/api';

// Palabras funcionales que NO reciben pictograma sugerido (igual que en los cuentos del seed).
// El docente igualmente puede agregarles uno a mano.
const SIN_PICTOGRAMA = ['un', 'una', 'el', 'la', 'los', 'las', 'me', 'mi', 'te', 'tu', 'de', 'y', 'en', 'a'];

const limpiar = (palabra: string) => palabra.replace(/[.,;:!?¡¿«»"()]/g, '');

/** Texto editable de una página (una frase por línea). */
const textoDePagina = (p: CuentoPagina) => p.palabras.map((w) => w.texto).join(' ');

/**
 * Arma las páginas a partir del texto (una frase por línea).
 * Conserva pictogramas/audios ya asignados a las mismas palabras.
 */
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
      // Si la línea no cambió, se conserva la página original (texto completo y audio de la página)
      if (original && linea === textoDePagina(original)) {
        return { ...original, numeroPagina: i + 1, palabras };
      }
      return { numeroPagina: i + 1, textoCompleto: linea, palabras };
    });
};

interface CuentoFormProps {
  nivelId: string;
  cuento?: Cuento; // si viene, se edita; si no, se crea
  onGuardado: () => void;
  onCancelar: () => void;
}

/** 9e / 6.2 Subir o editar un cuento con pictogramas sugeridos (ARASAAC) y vista previa de voz. */
export const CuentoForm: React.FC<CuentoFormProps> = ({ nivelId, cuento, onGuardado, onCancelar }) => {
  const [titulo, setTitulo] = useState(cuento?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(cuento?.descripcion ?? '');
  const [texto, setTexto] = useState(cuento ? cuento.paginas.map(textoDePagina).join('\n') : '');
  const [paginas, setPaginas] = useState<CuentoPagina[]>(cuento?.paginas ?? []);
  const [sugiriendo, setSugiriendo] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  // Palabra que se está editando: "pagina-indice"
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

  /** Sugiere pictogramas: primero el catálogo local (funciona offline), luego ARASAAC (requiere internet). */
  const sugerirPictogramas = async () => {
    setSugiriendo(true);
    setMensaje('');
    const locales = await listarPictogramas();
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
        ? `${sinInternet} palabra(s) sin pictograma (sin coincidencia o sin internet). Puedes agregarlas a mano.`
        : 'Pictogramas sugeridos. Toca una palabra para cambiar su pictograma.',
    );
  };

  const abrirEditor = async (p: number, w: number) => {
    setEditando({ p, w });
    setOpciones(null);
    setBuscando(true);
    setOpciones(await searchArasaacPictograms(paginas[p].palabras[w].texto));
    setBuscando(false);
  };

  /** Vista previa con la voz del navegador. El audio .mp3 definitivo aún no se genera aquí. */
  const probarVoz = () => {
    if (!('speechSynthesis' in window) || !texto.trim()) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(paginas.map((p) => p.textoCompleto).join('. '));
    u.lang = 'es-CL';
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  };

  const guardar = async (estado: 'borrador' | 'publicado') => {
    setError('');
    if (!titulo.trim()) return setError('El cuento necesita un título.');
    if (paginas.length === 0) return setError('Escribe al menos una frase.');

    const datos = {
      nivelId,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      paginas,
      estado,
    };
    if (cuento?.id) {
      await actualizarCuento(cuento.id, datos);
    } else {
      await crearCuento({
        ...datos,
        id: `cuento-${crypto.randomUUID()}`,
        fechaCreacion: new Date().toISOString(),
      });
    }
    onGuardado();
  };

  const campo = 'w-full bg-app border-2 border-borderCustom rounded-2xl px-4 py-3 text-sm font-bold text-primary outline-none focus:border-brand';

  return (
    <div className="bg-app border-2 border-borderCustom rounded-2xl p-5 flex flex-col gap-4">
      <h3 className="text-lg font-black text-primary">{cuento ? 'Editar cuento' : 'Subir cuento nuevo'}</h3>

      {error && (
        <p className="bg-statusDanger-bg text-statusDanger border-2 border-statusDanger rounded-2xl px-4 py-2 text-sm font-bold">
          {error}
        </p>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-black text-primary">Título del cuento</span>
        <input className={campo} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-black text-primary">Descripción (opcional)</span>
        <input className={campo} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-black text-primary">Texto: una frase por página</span>
        <textarea className={`${campo} min-h-28`} value={texto} onChange={(e) => cambiarTexto(e.target.value)} />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          onClick={sugerirPictogramas}
          disabled={sugiriendo || paginas.length === 0}
        >
          <Sparkles className="w-4 h-4" /> {sugiriendo ? 'Buscando…' : 'Sugerir pictogramas'}
        </Button>
        <Button variant="secondary" onClick={probarVoz} disabled={paginas.length === 0}>
          <Volume2 className="w-4 h-4" /> Probar voz
        </Button>
      </div>
      <p className="text-xs font-semibold text-secondary">
        Cada palabra recibe un pictograma sugerido. Puedes cambiarlo antes de publicar. «Probar voz» usa la voz del
        navegador como vista previa; el audio definitivo del cuento se genera aparte.
      </p>
      {mensaje && <p className="text-sm font-bold text-statusOk">{mensaje}</p>}

      {/* Vista previa página por página: palabra + pictograma (tocar para cambiar) */}
      {paginas.map((pg, p) => (
        <div key={p} className="bg-surface border-2 border-borderCustom rounded-2xl p-3 flex flex-col gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-secondary">Página {pg.numeroPagina}</span>
          <div className="flex flex-wrap gap-2">
            {pg.palabras.map((w, i) => (
              <button
                key={i}
                onClick={() => abrirEditor(p, i)}
                aria-label={`Cambiar pictograma de ${w.texto}`}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl border-2 cursor-pointer transition-all ${
                  editando?.p === p && editando.w === i ? 'border-brand' : 'border-borderCustom hover:border-brand'
                }`}
              >
                {w.pictogramaUrl ? (
                  <PictoImg src={w.pictogramaUrl} alt={w.texto} className="w-14 h-14" />
                ) : (
                  <div className="w-14 h-14 rounded-xl border-2 border-dashed border-borderCustom flex items-center justify-center text-secondary text-xl font-black">
                    +
                  </div>
                )}
                <span className="text-xs font-black text-primary">{w.texto}</span>
              </button>
            ))}
          </div>

          {editando?.p === p && (
            <div className="bg-app border-2 border-borderCustom rounded-2xl p-3 flex flex-col gap-2">
              <span className="text-sm font-black text-primary">
                Pictograma para «{paginas[p].palabras[editando.w].texto}»
              </span>
              {buscando && <span className="text-xs font-semibold text-secondary">Buscando en ARASAAC…</span>}
              {!buscando && opciones && opciones.length === 0 && (
                <span className="text-xs font-semibold text-secondary">
                  No se encontraron opciones (sin internet o sin coincidencias).
                </span>
              )}
              <div className="flex flex-wrap gap-2">
                {opciones?.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      asignarPictograma(p, editando.w, o.url);
                      setEditando(null);
                    }}
                    className="cursor-pointer rounded-xl hover:ring-4 hover:ring-brand"
                    aria-label={`Usar pictograma ${o.id}`}
                  >
                    <PictoImg src={o.url} alt={`pictograma ${o.id}`} className="w-16 h-16" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  asignarPictograma(p, editando.w, undefined);
                  setEditando(null);
                }}
                className="self-start inline-flex items-center gap-1.5 text-xs font-bold text-statusDanger cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Quitar pictograma
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => guardar('publicado')}>Publicar</Button>
        <Button variant="secondary" onClick={() => guardar('borrador')}>
          Guardar borrador
        </Button>
        <Button variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </div>
  );
};
