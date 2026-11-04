import React, { useEffect, useRef, useState } from 'react';
import { AudioLines, RotateCcw, Sparkles, Trash2, Volume2, Wand2, X } from 'lucide-react';
import type { Cuento, CuentoPagina, CuentoPalabra } from '@/types';
import { getArasaacImageUrl, fetchArasaacPictogramId, searchArasaacPictograms, type ArasaacOpcion } from '@/features/tablero/arasaac';
import { normalizar } from '@/features/docente/components/format';
import { apareceEnTexto, leerPalabras, MAX_PALABRAS } from '@/features/docente/components/palabrasParaPracticar';
import { PictoImg } from '@/features/docente/components/widgets';
import { Button } from '@/shared/ui';
import { conAudios, generarAudiosDeCuento } from '@/features/docente/audioCuento';
import { actualizarCuento, crearCuento, listarPictogramas, useNiveles } from '@/api';
import { fueCancelada, generarCuentoConIa, type PedidoDeCuento } from '@/api/servidor';
import { useAuthStore } from '@/shared/store/useAuthStore';

// Niveles que ya leen oraciones (Cuentos e Historias). Los anteriores trabajan sílabas, vocales y palabras: frases mínimas.
const NIVELES_CON_ORACIONES = ['D', 'E'];

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
      // Si la línea no cambió, se conserva la página original (texto completo y audio de la página).
      // Se compara también con textoCompleto: textoDePagina no trae la puntuación que la docente escribió.
      if (original && (linea === original.textoCompleto || linea === textoDePagina(original))) {
        return { ...original, numeroPagina: i + 1, palabras };
      }
      return { numeroPagina: i + 1, textoCompleto: linea, palabras };
    });
};

/** Lo que había en el formulario antes de crear un borrador con IA: se puede recuperar. */
interface VersionAnterior {
  titulo: string;
  descripcion: string;
  texto: string;
  paginas: CuentoPagina[];
}

interface CuentoFormProps {
  /** Nivel inicial al crear un cuento (se puede cambiar en el formulario). */
  nivelId?: string;
  cuento?: Cuento; // si viene, se edita; si no, se crea
  /** Palabras para practicar ya cargadas en «Crear con IA» (por ejemplo, las que le cuestan a un niño). */
  palabrasIniciales?: string[];
  onGuardado: () => void;
  onCancelar: () => void;
}

/** 9e / 6.2 Subir o editar un cuento con pictogramas sugeridos (ARASAAC) y vista previa de voz. */
export const CuentoForm: React.FC<CuentoFormProps> = ({ nivelId, cuento, palabrasIniciales, onGuardado, onCancelar }) => {
  const niveles = useNiveles();
  const esRevisor = useAuthStore((s) => s.user?.role === 'revisor');
  const [nivel, setNivel] = useState(cuento?.nivelId ?? nivelId ?? 'nivel-b');
  const [titulo, setTitulo] = useState(cuento?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(cuento?.descripcion ?? '');
  const [texto, setTexto] = useState(cuento ? cuento.paginas.map(textoDePagina).join('\n') : '');
  const [paginas, setPaginas] = useState<CuentoPagina[]>(cuento?.paginas ?? []);
  const [sugiriendo, setSugiriendo] = useState(false);
  const [mensaje, setMensaje] = useState('');
  // Cuento con IA: de qué trata y cuántas páginas; `redactando` mientras el servidor trabaja
  const [tema, setTema] = useState('');
  const [numPaginas, setNumPaginas] = useState(5);
  const [palabrasTexto, setPalabrasTexto] = useState((palabrasIniciales ?? []).join(', '));
  // Las palabras pedidas en el último borrador: se compara con el texto para decir cuáles aparecieron
  const [pedidas, setPedidas] = useState<string[]>([]);
  const [redactando, setRedactando] = useState(false);
  // Avance de la generación de audio, en páginas (null = no se está generando)
  const [generando, setGenerando] = useState<{ hechas: number; total: number } | null>(null);
  const generacion = useRef<AbortController | null>(null);
  // Pedido de borrador a la IA en curso (se puede cancelar)
  const redaccion = useRef<AbortController | null>(null);
  const [anterior, setAnterior] = useState<VersionAnterior | null>(null);
  // Guardado en curso: el ref bloquea el doble clic antes de que React alcance a deshabilitar los botones
  const [guardando, setGuardando] = useState(false);
  const guardandoRef = useRef(false);
  const [error, setError] = useState('');
  // Palabra que se está editando: "pagina-indice"
  const [editando, setEditando] = useState<{ p: number; w: number } | null>(null);
  const [opciones, setOpciones] = useState<ArasaacOpcion[] | null>(null);
  const [buscando, setBuscando] = useState(false);

  // Al salir del formulario se dejan de pedir audios: nadie los usaría y cada uno gasta cuota.
  useEffect(
    () => () => {
      generacion.current?.abort();
      redaccion.current?.abort();
    },
    [],
  );

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

  /**
   * Busca pictogramas: primero el catálogo local (funciona offline), luego ARASAAC (requiere internet).
   * Devuelve un aviso si faltaron. Solo completa las palabras que sigan sin pictograma: la búsqueda toma
   * tiempo y la docente puede estar corrigiendo el texto mientras tanto.
   */
  const buscarPictogramas = async (base: CuentoPagina[]) => {
    setSugiriendo(true);
    setMensaje('');
    try {
      const locales = await listarPictogramas();
      const catalogo = new Map(locales.map((p) => [normalizar(p.palabra), p.imagenUrl]));
      const encontrados = new Map<string, string | undefined>();
      let sinInternet = 0;

      for (const w of base.flatMap((pg) => pg.palabras)) {
        const clave = normalizar(w.texto);
        if (w.pictogramaUrl || SIN_PICTOGRAMA.includes(clave) || encontrados.has(clave)) continue;
        let url = catalogo.get(clave);
        if (!url) {
          const id = await fetchArasaacPictogramId(w.texto);
          if (id) url = getArasaacImageUrl(id);
          else sinInternet += 1;
        }
        encontrados.set(clave, url);
      }

      setPaginas((prev) =>
        prev.map((pg) => ({
          ...pg,
          palabras: pg.palabras.map((w) => (w.pictogramaUrl ? w : { ...w, pictogramaUrl: encontrados.get(normalizar(w.texto)) })),
        })),
      );
      return sinInternet > 0 ? `${sinInternet} palabra(s) sin pictograma (sin coincidencia o sin internet). Puedes agregarlas a mano.` : '';
    } finally {
      setSugiriendo(false);
    }
  };

  const sugerirPictogramas = async () => {
    try {
      setMensaje((await buscarPictogramas(paginas)) || 'Pictogramas sugeridos. Toca una palabra para cambiar su pictograma.');
    } catch {
      setError('No se pudieron buscar los pictogramas. Intenta de nuevo.');
    }
  };

  const { palabras, error: errorPalabras } = leerPalabras(palabrasTexto);

  /** Pide un borrador a la IA del servidor. Queda como texto editable: la docente lo revisa antes de guardarlo. */
  const redactarConIa = async () => {
    setError('');
    setMensaje('');
    // Lo escrito no se pierde: queda guardado para «Recuperar versión anterior» en vez de pedir confirmación.
    const hayContenido = [titulo, descripcion, texto].some((campo) => campo.trim());
    const respaldo: VersionAnterior = { titulo, descripcion, texto, paginas };

    const control = new AbortController();
    redaccion.current = control;
    setRedactando(true);
    let nuevas: CuentoPagina[];
    try {
      const codigo = niveles?.find((n) => n.id === nivel)?.codigo ?? '';
      // La API tiene dos largos de frase: 'A' las mínimas y 'B' las oraciones. No son los códigos de nivel de la app.
      const largo = NIVELES_CON_ORACIONES.includes(codigo) ? 'B' : 'A';
      const pedido: PedidoDeCuento = { tema: tema.trim(), nivel: largo, paginas: numPaginas, ...(palabras.length > 0 ? { palabras } : {}) };
      const borrador = await generarCuentoConIa(pedido, control.signal);
      if (control.signal.aborted) return;
      if (hayContenido) setAnterior(respaldo);
      setPedidas(palabras);
      const nuevoTexto = borrador.frases.join('\n');
      nuevas = construirPaginas(nuevoTexto, []);
      setTitulo(borrador.titulo);
      setDescripcion(borrador.descripcion);
      setTexto(nuevoTexto);
      setPaginas(nuevas);
      setEditando(null);
    } catch (e) {
      // Cancelar a propósito no es un error: el formulario queda como estaba.
      if (!fueCancelada(e) && !control.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudo crear el cuento.');
      return;
    } finally {
      setRedactando(false);
    }

    // Los pictogramas se buscan solos: así el borrador queda listo para leerlo y revisarlo.
    const listo = 'Borrador creado con IA. Léelo con calma, corrige lo que haga falta y luego genera el audio.';
    try {
      const aviso = await buscarPictogramas(nuevas);
      setMensaje(aviso ? `${listo} ${aviso}` : listo);
    } catch {
      setMensaje(`${listo} No se pudieron buscar los pictogramas: usa «Sugerir pictogramas».`);
    }
  };

  const cancelarRedaccion = () => redaccion.current?.abort();

  const recuperarAnterior = () => {
    if (!anterior) return;
    setTitulo(anterior.titulo);
    setDescripcion(anterior.descripcion);
    setTexto(anterior.texto);
    setPaginas(anterior.paginas);
    setEditando(null);
    setAnterior(null);
    setPedidas([]);
    setMensaje('Volviste a la versión anterior del cuento.');
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

  /** Genera el audio definitivo de cada página con la voz del proyecto (lo hace el servidor). */
  const crearAudio = async () => {
    setError('');
    setMensaje('');
    generacion.current = new AbortController();
    let hechas = 0;
    try {
      const { respaldo } = await generarAudiosDeCuento(
        paginas,
        (n, total) => {
          hechas = n;
          setGenerando({ hechas: n, total });
        },
        // Cada audio se pone en su página apenas llega: si una falla, las anteriores se conservan.
        (texto, url) => setPaginas((prev) => conAudios(prev, { [texto]: url })),
        generacion.current.signal,
      );
      setMensaje(
        respaldo
          ? 'Audio listo con la voz de respaldo (la API de voz no respondió). Guarda el cuento para conservarlo.'
          : 'Audio listo con la voz del proyecto. Guarda el cuento para conservarlo.',
      );
    } catch (e) {
      const motivo = e instanceof Error ? e.message : 'No se pudo generar el audio.';
      const parcial = hechas === 1 ? ' Quedó 1 página con audio;' : ` Quedaron ${hechas} páginas con audio;`;
      setError(hechas > 0 ? `${motivo}${parcial} vuelve a intentar para terminar.` : motivo);
    } finally {
      setGenerando(null);
    }
  };

  const guardar = async (estado: Cuento['estado']) => {
    if (guardandoRef.current) return;
    setError('');
    if (!titulo.trim()) return setError('El cuento necesita un título.');
    if (paginas.length === 0) return setError('Escribe al menos una frase.');

    const datos = {
      nivelId: nivel,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      paginas,
      estado,
      fechaCambio: new Date().toISOString(),
      // Al volver a enviarlo, el comentario anterior del revisor ya no aplica
      ...(estado === 'en_revision' ? { comentarioRevision: undefined } : {}),
    };
    guardandoRef.current = true;
    setGuardando(true);
    try {
      if (cuento?.id) {
        await actualizarCuento(cuento.id, datos);
      } else {
        await crearCuento({
          ...datos,
          id: `cuento-${crypto.randomUUID()}`,
          fechaCreacion: new Date().toISOString(),
        });
      }
    } catch {
      setError('No se pudo guardar el cuento. Tu texto sigue aquí: intenta de nuevo.');
      guardandoRef.current = false;
      setGuardando(false);
      return;
    }
    onGuardado();
  };

  // Estas tareas escriben sobre las páginas: mientras una corre, las demás y el guardado esperan.
  const ocupado = sugiriendo || redactando || generando !== null || guardando;
  const sinAudio = paginas.filter((p) => !p.audioPaginaUrl).length;
  const avanceAudio = generando && `Generando audio ${Math.min(generando.hechas + 1, generando.total)} de ${generando.total}…`;

  const campo = 'w-full bg-app border border-borderCustom rounded-control px-4 py-3 text-sm font-bold text-primary outline-none focus:border-brand';

  return (
    <div className="bg-app border border-borderCustom rounded-control p-5 flex flex-col gap-4">
      <h3 className="font-display text-2xl font-semibold text-primary">{cuento ? 'Editar cuento' : 'Subir cuento nuevo'}</h3>

      {/* Siempre montada: un lector de pantalla solo anuncia los cambios dentro de una región que ya existía */}
      <div role="alert" className="empty:absolute">
        {error && (
          <p className="bg-statusDanger-bg text-statusDanger border-2 border-statusDanger rounded-control px-4 py-2 text-sm font-bold">
            {error}
          </p>
        )}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold text-primary">Nivel</span>
        <select className={campo} value={nivel} onChange={(e) => setNivel(e.target.value)}>
          {(niveles ?? []).map((n) => (
            <option key={n.id} value={n.id}>
              Nivel {n.codigo} · {n.nombre}
            </option>
          ))}
        </select>
      </label>

      {/* El revisor solo valida cuentos: el servidor le negaría el borrador (403) */}
      {!esRevisor && (
        <section aria-labelledby="crear-con-ia" className="bg-surface border border-borderCustom rounded-control p-4 flex flex-col gap-3">
          <h4 id="crear-con-ia" className="font-display text-lg font-semibold text-primary">
            Crear con IA
          </h4>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tema-ia" className="text-sm font-bold text-primary">
              ¿De qué trata el cuento?
            </label>
            <input
              id="tema-ia"
              className={campo}
              value={tema}
              maxLength={200}
              placeholder="Por ejemplo: el osito va al dentista"
              aria-describedby="aviso-tema"
              onChange={(e) => setTema(e.target.value)}
            />
            <span id="aviso-tema" className="text-xs font-semibold text-secondary">
              No escribas nombres de estudiantes ni datos personales: el tema se envía al servidor de IA.
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="palabras-ia" className="text-sm font-bold text-primary">
              Palabras para practicar (opcional)
            </label>
            <input
              id="palabras-ia"
              className={campo}
              value={palabrasTexto}
              placeholder="Por ejemplo: perro, mamá, casa"
              aria-describedby="ayuda-palabras"
              aria-invalid={errorPalabras ? true : undefined}
              onChange={(e) => setPalabrasTexto(e.target.value)}
            />
            <span id="ayuda-palabras" className={`text-xs font-semibold ${errorPalabras ? 'text-statusDanger' : 'text-secondary'}`}>
              {errorPalabras ?? `Hasta ${MAX_PALABRAS} palabras separadas por comas. La IA intentará usarlas, pero puede omitir alguna: abajo verás cuáles aparecieron.`}
            </span>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-primary">Páginas</span>
              <select className={campo} value={numPaginas} onChange={(e) => setNumPaginas(Number(e.target.value))}>
                {[3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <Button
              variant="accent"
              onClick={redactarConIa}
              disabled={tema.trim().length < 3 || errorPalabras !== null || sugiriendo || generando !== null}
              loading={redactando}
            >
              <Wand2 className="w-4 h-4" aria-hidden /> {redactando ? 'Escribiendo el cuento…' : 'Crear borrador'}
            </Button>
            {redactando && (
              <Button variant="ghost" onClick={cancelarRedaccion}>
                <X className="w-4 h-4" aria-hidden /> Cancelar redacción
              </Button>
            )}
            {anterior && !redactando && (
              <Button variant="secondary" onClick={recuperarAnterior}>
                <RotateCcw className="w-4 h-4" aria-hidden /> Recuperar versión anterior
              </Button>
            )}
          </div>
          {redactando && <p className="text-xs font-semibold text-secondary">Suele tardar menos de un minuto.</p>}
          {pedidas.length > 0 && !redactando && (
            <div className="text-sm font-semibold text-primary" data-testid="cobertura-palabras">
              <p>Palabras para practicar en el cuento:</p>
              <ul className="mt-1 flex flex-wrap gap-2 list-none p-0">
                {pedidas.map((p) => {
                  const aparece = apareceEnTexto(texto, p);
                  return (
                    <li
                      key={p}
                      className={`rounded-sm px-2.5 py-1 ${aparece ? 'bg-statusOk-bg text-statusOk' : 'bg-statusWarn-bg text-statusWarn'}`}
                    >
                      {aparece ? '✓' : '✗'} {p}
                      <span className="sr-only">{aparece ? ': aparece en el cuento' : ': no aparece en el cuento'}</span>
                    </li>
                  );
                })}
              </ul>
              {pedidas.some((p) => !apareceEnTexto(texto, p)) && (
                <p className="mt-1 text-xs text-secondary">
                  El modelo omitió alguna. Puedes agregarla al texto a mano o crear otro borrador.
                </p>
              )}
            </div>
          )}
          <p className="text-xs font-semibold text-secondary">
            La IA escribe un borrador según el nivel elegido. Siempre se revisa y se edita antes de enviarlo: nada llega a los niños sin
            tu aprobación.
          </p>
        </section>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold text-primary">Título del cuento</span>
        <input className={campo} value={titulo} disabled={redactando} onChange={(e) => setTitulo(e.target.value)} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold text-primary">Descripción (opcional)</span>
        <input className={campo} value={descripcion} disabled={redactando} onChange={(e) => setDescripcion(e.target.value)} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold text-primary">Texto: una frase por página</span>
        <textarea className={`${campo} min-h-28`} value={texto} disabled={redactando} onChange={(e) => cambiarTexto(e.target.value)} />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          onClick={sugerirPictogramas}
          disabled={ocupado || paginas.length === 0}
        >
          <Sparkles className="w-4 h-4" /> {sugiriendo ? 'Buscando…' : 'Sugerir pictogramas'}
        </Button>
        <Button variant="secondary" onClick={probarVoz} disabled={paginas.length === 0}>
          <Volume2 className="w-4 h-4" /> Probar voz
        </Button>
        {/* El revisor solo valida cuentos: el servidor le negaría el audio (403) */}
        {!esRevisor && (
          <Button variant="accent" onClick={crearAudio} disabled={sugiriendo || redactando || paginas.length === 0} loading={generando !== null}>
            <AudioLines className="w-4 h-4" aria-hidden />
            {avanceAudio || 'Generar audio'}
          </Button>
        )}
      </div>
      <p className="text-xs font-semibold text-secondary">
        Cada palabra recibe un pictograma sugerido. Puedes cambiarlo antes de enviarlo a revisión. «Probar voz» usa la voz del
        navegador como vista previa; «Generar audio» crea el audio definitivo con la voz del proyecto (necesita el servidor y haber
        ingresado con tu cuenta).
      </p>
      <div role="status" className="empty:absolute">
        {avanceAudio && <span className="sr-only">{avanceAudio}</span>}
        {redactando && <span className="sr-only">Escribiendo el cuento. Suele tardar menos de un minuto.</span>}
        {mensaje && <p className="text-sm font-bold text-statusOk">{mensaje}</p>}
      </div>

      {/* Vista previa página por página: palabra + pictograma (tocar para cambiar) */}
      {paginas.map((pg, p) => (
        <div key={p} className="bg-surface border border-borderCustom rounded-control p-3 flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            Página {pg.numeroPagina}
            {pg.audioPaginaUrl && <span className="ml-2 normal-case tracking-normal text-statusOk">· con audio</span>}
          </span>
          <div className="flex flex-wrap gap-2">
            {pg.palabras.map((w, i) => (
              <button
                key={i}
                onClick={() => abrirEditor(p, i)}
                aria-label={`Cambiar pictograma de ${w.texto}`}
                className={`flex flex-col items-center gap-1 p-2 rounded-control border-2 cursor-pointer transition-all ${
                  editando?.p === p && editando.w === i ? 'border-brand' : 'border-borderCustom hover:border-brand'
                }`}
              >
                {w.pictogramaUrl ? (
                  <PictoImg src={w.pictogramaUrl} alt={w.texto} className="w-14 h-14" />
                ) : (
                  <div className="w-14 h-14 rounded-control border-2 border-dashed border-borderCustom flex items-center justify-center text-secondary text-xl font-bold">
                    +
                  </div>
                )}
                <span className="text-xs font-bold text-primary">{w.texto}</span>
              </button>
            ))}
          </div>

          {editando?.p === p && (
            <div className="bg-app border border-borderCustom rounded-control p-3 flex flex-col gap-2">
              <span className="text-sm font-bold text-primary">
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
                    className="cursor-pointer rounded-control hover:ring-4 hover:ring-brand"
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

      {paginas.length > 0 && sinAudio > 0 && (
        <p className="text-xs font-semibold text-statusWarn">
          {sinAudio === paginas.length
            ? 'Ninguna página tiene audio todavía.'
            : `${sinAudio} de ${paginas.length} páginas no tienen audio.`}{' '}
          Puedes enviarlo igual: en esas páginas los niños oirán la voz del navegador.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {/* Mientras algo escribe sobre las páginas no se guarda: el cuento quedaría a medias */}
        <Button onClick={() => guardar(esRevisor ? 'publicado' : 'en_revision')} disabled={ocupado} loading={guardando}>
          {esRevisor ? 'Validar y publicar' : 'Enviar a revisión'}
        </Button>
        <Button variant="secondary" onClick={() => guardar('borrador')} disabled={ocupado}>
          Guardar borrador
        </Button>
        <Button variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </div>
  );
};
