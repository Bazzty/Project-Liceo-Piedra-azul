import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FolderPlus, Play, Plus } from 'lucide-react';
import { guardarCategorias, guardarTableros, useAlumnos, useCategorias, usePictogramas, useTodosLosTableros } from '@/api';
import { generarAudio } from '@/api/servidor';
import { EncabezadoPagina, Hoja } from '@/features/docente/components/Hoja';
import { necesitaAudio, textoHablado } from '@/features/tablero/audioDeCeldas';
import { franjaDeColor } from '@/features/tablero/coloresTablero';
import { usoDeCategorias } from '@/features/tablero/edicionCategorias';
import {
  actualizarCelda,
  agregarCarpeta,
  agregarCelda,
  moverCelda,
  moverRelativo,
  nuevaCeldaPalabra,
  pasarCelda,
  quitarCelda,
  renombrarTablero,
  tablerosDelConjunto,
  type Conjunto,
} from '@/features/tablero/edicionTablero';
import { BarraDeTableros } from '@/features/tablero/editor/BarraDeTableros';
import { CeldaEditable } from '@/features/tablero/editor/CeldaEditable';
import { DialogoAsignar } from '@/features/tablero/editor/DialogoAsignar';
import { DialogoCategorias } from '@/features/tablero/editor/DialogoCategorias';
import { DialogoCelda, type DatosDeCelda } from '@/features/tablero/editor/DialogoCelda';
import { DialogoPlantilla } from '@/features/tablero/editor/DialogoPlantilla';
import {
  asignarPlantillaAVarios,
  crearPlantilla,
  eliminarPlantilla,
  guardarCambio,
  restablecerAlumno,
  restablecerPlantillaGeneral,
  type Destino,
} from '@/features/tablero/gestionTableros';
import { CATEGORIAS_INICIALES, construirPlantillaGeneral, esDelCatalogoBase, ID_PLANTILLA_GENERAL } from '@/features/tablero/plantillaGeneral';
import { useConjuntoEditable } from '@/features/tablero/useConjuntoEditable';
import { Creditos } from '@/shared/components/Creditos';
import { useTableroStore } from '@/shared/store/useTableroStore';
import { Button } from '@/shared/ui';
import type { CategoriaTablero, CeldaTablero } from '@/types';

type Dialogo =
  | { tipo: 'palabra-nueva'; tableroId: string; nucleo: boolean }
  | { tipo: 'carpeta-nueva' }
  | { tipo: 'editar'; tableroId: string; celdaId: string }
  | { tipo: 'plantilla-nueva'; origenFijo?: { id: string; nombre: string } }
  | { tipo: 'plantilla-renombrar' }
  | { tipo: 'asignar' }
  | { tipo: 'categorias' };

interface Arrastre {
  tableroId: string;
  celdaId: string;
}

const desdeClave = (clave: string): Destino => {
  const [tipo, ...resto] = clave.split(':');
  return tipo === 'alumno' ? { tipo: 'alumno', alumnoId: resto.join(':') } : { tipo: 'plantilla', id: resto.join(':') };
};

const BOTON_AGREGAR =
  'min-h-12 flex items-center justify-center gap-2 rounded-card border-2 border-dashed border-borderStrong bg-app px-3 text-sm font-bold text-primary cursor-pointer hover:border-brand';

/**
 * Editor del tablero de comunicación. Se ve como lo ve el niño (palabras siempre a la vista, grilla y carpetas al
 * costado) y cada cambio se guarda al instante, con «Deshacer». Un niño sin tablero propio recibe su copia de la
 * plantilla general en su primer cambio.
 */
export const EditorTablero: React.FC = () => {
  const alumnos = useAlumnos();
  const categorias = useCategorias();
  const pictogramas = usePictogramas();
  const todos = useTodosLosTableros();
  const abrirTablero = useTableroStore((s) => s.abrir);

  const [destino, setDestino] = useState<Destino>({ tipo: 'plantilla', id: ID_PLANTILLA_GENERAL });
  const editable = useConjuntoEditable(destino);
  const [tableroId, setTableroId] = useState<string | null>(null);
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [aviso, setAviso] = useState('');
  /** Aparte del aviso de lo que se guardó: el audio se genera en segundo plano y puede tardar o fallar. */
  const [avisoAudio, setAvisoAudio] = useState('');
  const [generando, setGenerando] = useState(false);
  const [deshacer, setDeshacer] = useState<(() => Promise<void>) | null>(null);
  const arrastre = useRef<Arrastre | null>(null);
  /** El conjunto más reciente: así dos cambios seguidos no parten de una versión vieja. */
  const ultimo = useRef<Conjunto | undefined>(undefined);
  useEffect(() => {
    ultimo.current = editable?.conjunto;
  }, [editable]);

  const alumno = destino.tipo === 'alumno' ? alumnos?.find((a) => a.id === destino.alumnoId) : undefined;
  const nombreAlumno = alumno ? `${alumno.nombre} ${alumno.apellido}`.trim() : '';

  const cambiarDestino = (clave: string) => {
    setDestino(desdeClave(clave));
    setTableroId(null);
    setDeshacer(null);
    setAviso('');
  };

  /** Aplica un cambio: lo guarda al instante y deja a mano «Deshacer». */
  const aplicar = async (descripcion: string, cambiar: (c: Conjunto) => Conjunto) => {
    const antes = ultimo.current;
    if (!antes) return;
    const despues = cambiar(antes);
    if (despues === antes) return;
    ultimo.current = despues;
    await guardarCambio(antes, despues);
    setDeshacer(() => async () => {
      await guardarCambio(despues, antes);
      ultimo.current = antes;
      setAviso('Cambio deshecho.');
      setDeshacer(null);
    });
    setAviso(`${descripcion}. Guardado.`);
  };

  const restablecer = async () => {
    if (destino.tipo !== 'alumno' || !editable?.copiaPropia) return;
    const antes = editable.conjunto;
    await restablecerAlumno(destino.alumnoId);
    setDeshacer(() => async () => {
      await guardarTableros(tablerosDelConjunto(antes));
      setAviso('Tablero propio recuperado.');
      setDeshacer(null);
    });
    setTableroId(null);
    setAviso(`El tablero de ${nombreAlumno} volvió a la plantilla general.`);
  };

  /** Las plantillas: la general primero y luego las de la docente por nombre. */
  const plantillas = useMemo(
    () => (todos ?? []).filter((t) => t.esPlantilla && t.principal).sort((a, b) => Number(b.id === ID_PLANTILLA_GENERAL) - Number(a.id === ID_PLANTILLA_GENERAL) || a.nombre.localeCompare(b.nombre, 'es')),
    [todos],
  );
  const conTablero = useMemo(() => new Set((todos ?? []).flatMap((t) => (t.alumnoId && t.principal ? [t.alumnoId] : []))), [todos]);
  const uso = useMemo(() => usoDeCategorias(todos ?? []), [todos]);

  const colores = useMemo(() => new Map((categorias ?? []).map((c) => [c.id, c.color])), [categorias]);
  const franja = (celda: CeldaTablero) => franjaDeColor(colores.get(celda.categoriaId) ?? 'aprender');
  const dibujo = (celda: CeldaTablero) => pictogramas?.find((p) => p.id === celda.pictogramaId);

  /** Guarda el audio recién generado en la celda, si ella sigue diciendo lo mismo (la docente pudo cambiarla mientras tanto). */
  const guardarAudio = async (tableroId: string, celdaId: string, texto: string, url: string) => {
    const antes = ultimo.current;
    const celda = antes && tablerosDelConjunto(antes).find((t) => t.id === tableroId)?.celdas.find((c) => c.id === celdaId);
    if (!antes || !celda || textoHablado(celda) !== texto) return;
    const despues = actualizarCelda(antes, tableroId, celdaId, { audioUrl: url, audioTexto: texto });
    ultimo.current = despues;
    await guardarCambio(antes, despues);
  };

  /**
   * Genera con la voz del proyecto el audio de lo que dice una celda. Si no se puede (sin sesión con el servidor, sin
   * internet…), la celda sigue funcionando con la voz del navegador y se le dice a la docente. Devuelve si salió bien.
   */
  const generarAudioDe = async (tableroId: string, celda: CeldaTablero): Promise<boolean> => {
    const texto = textoHablado(celda);
    setAvisoAudio(`Generando el audio de «${texto}»…`);
    try {
      const audio = await generarAudio(texto);
      await guardarAudio(tableroId, celda.id, texto, audio.url);
      setAvisoAudio(audio.respaldo ? `Audio de «${texto}» listo, con la voz de respaldo del servidor.` : `Audio de «${texto}» listo.`);
      return true;
    } catch (error) {
      setAvisoAudio(`${error instanceof Error ? error.message : 'No se pudo generar el audio.'} «${texto}» sonará con la voz del navegador.`);
      return false;
    }
  };

  /** Genera el audio de todas las celdas que no lo tienen, una a la vez; se detiene en el primer error para no repetirlo. */
  const generarFaltantes = async () => {
    const conjunto = ultimo.current;
    if (!conjunto || generando) return;
    setGenerando(true);
    const pendientes = tablerosDelConjunto(conjunto).flatMap((t) => t.celdas.filter((c) => necesitaAudio(c, dibujo(c))).map((c) => ({ tableroId: t.id, celda: c })));
    let hechas = 0;
    for (const { tableroId, celda } of pendientes) {
      if (!(await generarAudioDe(tableroId, celda))) break;
      hechas += 1;
    }
    if (hechas === pendientes.length && hechas > 0) setAvisoAudio(`${hechas === 1 ? 'Se generó 1 audio' : `Se generaron ${hechas} audios`}.`);
    setGenerando(false);
  };

  /** Crea una plantilla copiando otra y pasa a editarla. Se puede deshacer: la elimina y vuelve a donde estaba. */
  const crearNueva = async ({ nombre, origenId }: { nombre: string; origenId: string }) => {
    setDialogo(null);
    const id = await crearPlantilla(nombre, origenId);
    if (!id) return;
    const anterior = destino;
    setDestino({ tipo: 'plantilla', id });
    setTableroId(null);
    setDeshacer(() => async () => {
      await eliminarPlantilla(id);
      setDestino(anterior);
      setAviso('Plantilla eliminada.');
      setDeshacer(null);
    });
    setAviso(`Plantilla «${nombre}» creada.`);
  };

  const eliminarEsta = async () => {
    if (destino.tipo !== 'plantilla' || destino.id === ID_PLANTILLA_GENERAL || !editable) return;
    const antes = editable.conjunto;
    const id = destino.id;
    await eliminarPlantilla(id);
    setDestino({ tipo: 'plantilla', id: ID_PLANTILLA_GENERAL });
    setTableroId(null);
    setDeshacer(() => async () => {
      await guardarTableros(tablerosDelConjunto(antes));
      setDestino({ tipo: 'plantilla', id });
      setAviso(`Plantilla «${antes.principal.nombre}» recuperada.`);
      setDeshacer(null);
    });
    setAviso(`Plantilla «${antes.principal.nombre}» eliminada. Los niños que la recibieron conservan su copia.`);
  };

  const asignar = async (plantillaId: string, alumnoIds: string[]) => {
    setDialogo(null);
    const deshacerAsignacion = await asignarPlantillaAVarios(alumnoIds, plantillaId);
    const nombre = plantillas.find((p) => p.id === plantillaId)?.nombre ?? '';
    setDeshacer(() => async () => {
      await deshacerAsignacion();
      setAviso('Asignación deshecha.');
      setDeshacer(null);
    });
    setAviso(`Plantilla «${nombre}» asignada a ${alumnoIds.length} ${alumnoIds.length === 1 ? 'niño' : 'niños'}.`);
  };

  /** Deja la plantilla general como vino. Sus dibujos agregados por la docente quedan guardados pero fuera del tablero. */
  const restablecerFabrica = async () => {
    if (!editable || !pictogramas || !categorias) return;
    const antes = editable.conjunto;
    // Si borró alguna categoría de fábrica, vuelve: la plantilla la necesita
    const faltan = CATEGORIAS_INICIALES.filter((c) => !categorias.some((x) => x.id === c.id));
    if (faltan.length > 0) await guardarCategorias(faltan.map((c, i) => ({ ...c, orden: categorias.length + i + 1 })));
    await restablecerPlantillaGeneral(construirPlantillaGeneral(pictogramas.filter(esDelCatalogoBase)));
    setTableroId(null);
    setDeshacer(() => async () => {
      await restablecerPlantillaGeneral(tablerosDelConjunto(antes));
      setAviso('Plantilla general recuperada.');
      setDeshacer(null);
    });
    setAviso('La plantilla general volvió a como la trae la app.');
  };

  const cambiarCategorias = (nuevas: CategoriaTablero[]) =>
    void guardarCategorias(nuevas, (categorias ?? []).filter((c) => !nuevas.some((n) => n.id === c.id)).map((c) => c.id));

  if (!editable || !categorias || !pictogramas || !todos) {
    return <p role="status" className="text-secondary">Cargando el tablero…</p>;
  }

  const { conjunto, copiaPropia } = editable;
  const actual = (tableroId ? conjunto.carpetas.find((t) => t.id === tableroId) : undefined) ?? conjunto.principal;
  const enPrincipal = actual.id === conjunto.principal.id;
  const nucleo = conjunto.principal.celdas.filter((c) => c.tipo === 'palabra' && c.esNucleo);
  const carpetas = conjunto.principal.celdas.filter((c) => c.tipo === 'carpeta');
  const grilla = enPrincipal ? conjunto.principal.celdas.filter((c) => c.tipo === 'palabra' && !c.esNucleo) : actual.celdas;
  const carpetaAbierta = carpetas.find((c) => c.destinoTableroId === actual.id);
  const idEnEdicion = dialogo?.tipo === 'editar' ? dialogo.celdaId : undefined;
  const celdaEnEdicion = idEnEdicion ? [...conjunto.principal.celdas, ...conjunto.carpetas.flatMap((t) => t.celdas)].find((c) => c.id === idEnEdicion) : undefined;

  const faltanAudios = tablerosDelConjunto(conjunto).reduce((suma, t) => suma + t.celdas.filter((c) => necesitaAudio(c, dibujo(c))).length, 0);

  const mover = (tablero: string, lista: CeldaTablero[], celda: CeldaTablero, paso: -1 | 1) =>
    aplicar(`«${celda.textoMostrado}» ${paso < 0 ? 'se movió antes' : 'se movió después'}`, (c) =>
      moverRelativo(c, tablero, celda.id, lista.map((x) => x.id), paso),
    );

  /** Soltar una celda sobre otra: si es una palabra sobre una carpeta, entra a ella; si no, toma su lugar. */
  const soltar = (objetivo: CeldaTablero, tableroDelObjetivo: string) => {
    const origen = arrastre.current;
    arrastre.current = null;
    if (!origen || origen.celdaId === objetivo.id) return;
    const arrastrada = [...conjunto.principal.celdas, ...conjunto.carpetas.flatMap((t) => t.celdas)].find((c) => c.id === origen.celdaId);
    if (!arrastrada) return;
    if (objetivo.tipo === 'carpeta' && arrastrada.tipo === 'palabra' && objetivo.destinoTableroId && origen.tableroId !== objetivo.destinoTableroId) {
      void aplicar(`«${arrastrada.textoMostrado}» pasó a la carpeta «${objetivo.textoMostrado}»`, (c) => pasarCelda(c, origen.tableroId, arrastrada.id, objetivo.destinoTableroId as string));
      return;
    }
    if (origen.tableroId !== tableroDelObjetivo) return;
    const lugar = (tableroDelObjetivo === conjunto.principal.id ? conjunto.principal : conjunto.carpetas.find((t) => t.id === tableroDelObjetivo))?.celdas.findIndex((c) => c.id === objetivo.id) ?? -1;
    if (lugar >= 0) void aplicar(`«${arrastrada.textoMostrado}» cambió de lugar`, (c) => moverCelda(c, tableroDelObjetivo, arrastrada.id, lugar));
  };

  const guardarDialogo = (datos: DatosDeCelda) => {
    if (!dialogo) return;
    setDialogo(null);
    if (dialogo.tipo === 'carpeta-nueva') {
      void aplicar(`Carpeta «${datos.textoMostrado}» agregada`, (c) => agregarCarpeta(c, { nombre: datos.textoMostrado, categoriaId: datos.categoriaId, pictogramaId: datos.pictogramaId })).then(() => {
        const nueva = ultimo.current?.principal.celdas.at(-1);
        if (nueva && necesitaAudio(nueva, dibujo(nueva))) void generarAudioDe(ultimo.current?.principal.id ?? '', nueva);
      });
    } else if (dialogo.tipo === 'palabra-nueva') {
      const { tableroId: enTablero } = dialogo;
      const celda = nuevaCeldaPalabra({ pictogramaId: datos.pictogramaId as string, textoMostrado: datos.textoMostrado, textoHablado: datos.textoHablado, categoriaId: datos.categoriaId, esNucleo: datos.esNucleo });
      void aplicar(`«${datos.textoMostrado}» agregada`, (c) => agregarCelda(c, enTablero, celda)).then(() => {
        if (necesitaAudio(celda, pictogramas?.find((p) => p.id === celda.pictogramaId))) void generarAudioDe(enTablero, celda);
      });
    } else if (dialogo.tipo === 'editar') {
      const { tableroId: enTablero, celdaId } = dialogo;
      const { esNucleo, ...resto } = datos;
      void aplicar(`«${datos.textoMostrado}» guardada`, (c) => actualizarCelda(c, enTablero, celdaId, { ...resto, esNucleo: esNucleo || undefined })).then(() => {
        const editada = ultimo.current && tablerosDelConjunto(ultimo.current).find((t) => t.id === enTablero)?.celdas.find((c) => c.id === celdaId);
        if (editada && necesitaAudio(editada, dibujo(editada))) void generarAudioDe(enTablero, editada);
      });
    }
  };

  const quitar = (tablero: string, celda: CeldaTablero) =>
    aplicar(`${celda.tipo === 'carpeta' ? 'Carpeta' : 'Palabra'} «${celda.textoMostrado}» quitada`, (c) => quitarCelda(c, tablero, celda.id));

  const lista = (celdas: CeldaTablero[], tablero: string, orientacion: 'horizontal' | 'vertical') =>
    celdas.map((celda, i) => (
      <CeldaEditable
        key={celda.id}
        celda={celda}
        pic={dibujo(celda)}
        franja={franja(celda)}
        esPrimera={i === 0}
        esUltima={i === celdas.length - 1}
        orientacion={orientacion}
        seleccionada={celda.tipo === 'carpeta' && celda.destinoTableroId === actual.id}
        alAbrir={() => setTableroId(celda.destinoTableroId === actual.id ? null : (celda.destinoTableroId ?? null))}
        alEditar={() => setDialogo({ tipo: 'editar', tableroId: tablero, celdaId: celda.id })}
        alQuitar={() => void quitar(tablero, celda)}
        alMover={(paso) => void mover(tablero, celdas, celda, paso)}
        alEmpezarArrastre={() => {
          arrastre.current = { tableroId: tablero, celdaId: celda.id };
        }}
        alSoltarAqui={() => soltar(celda, tablero)}
      />
    ));

  return (
    <div className="flex flex-col gap-5">
      <EncabezadoPagina
        etiqueta="Panel docente"
        titulo="Tablero de comunicaciones"
        descripcion="Cambia lo que el niño ve al hablar: agrega palabras con su dibujo, ordénalas y agrúpalas en carpetas. Cada cambio se guarda solo."
        acciones={
          <Button variant="secondary" onClick={abrirTablero}>
            <Play className="w-4 h-4" aria-hidden /> Probar el tablero
          </Button>
        }
      />

      <BarraDeTableros
        destino={destino}
        plantillas={plantillas}
        alumnos={alumnos ?? []}
        nombreAlumno={nombreAlumno}
        copiaPropia={copiaPropia}
        hayDeshacer={Boolean(deshacer)}
        alCambiarDestino={cambiarDestino}
        alNuevaPlantilla={() => setDialogo({ tipo: 'plantilla-nueva' })}
        alRenombrar={() => setDialogo({ tipo: 'plantilla-renombrar' })}
        alAsignar={() => setDialogo({ tipo: 'asignar' })}
        alEliminar={() => void eliminarEsta()}
        alRestablecerFabrica={() => void restablecerFabrica()}
        alGuardarComoPlantilla={() => setDialogo({ tipo: 'plantilla-nueva', origenFijo: { id: conjunto.principal.id, nombre: `el tablero de ${nombreAlumno}` } })}
        alRestablecerNino={() => void restablecer()}
        alCategorias={() => setDialogo({ tipo: 'categorias' })}
        alDeshacer={() => void deshacer?.()}
        faltanAudios={faltanAudios}
        generandoAudios={generando}
        alGenerarAudios={() => void generarFaltantes()}
      />

      <p role="status" aria-live="polite" className={`text-sm ${aviso ? 'text-secondary' : 'sr-only'}`}>
        {aviso}
      </p>

      <p role="status" aria-live="polite" className={`text-sm ${avisoAudio ? 'text-secondary' : 'sr-only'}`}>
        {avisoAudio}
      </p>

      <Hoja aria-label="Vista del tablero" className="flex flex-col gap-4">
        <section aria-label="Palabras siempre a la vista">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary mb-2">Siempre a la vista (fila de arriba)</h2>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3">
            {lista(nucleo, conjunto.principal.id, 'horizontal')}
            <li>
              <button type="button" onClick={() => setDialogo({ tipo: 'palabra-nueva', tableroId: conjunto.principal.id, nucleo: true })} className={`${BOTON_AGREGAR} w-full h-full`}>
                <Plus className="w-4 h-4" aria-hidden /> Agregar palabra siempre a la vista
              </button>
            </li>
          </ul>
        </section>

        <div className="flex flex-col lg:flex-row gap-5 border-t border-borderCustom pt-4">
          <section aria-label={enPrincipal ? 'Tablero principal' : `Carpeta ${actual.nombre}`} className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary mb-2">{enPrincipal ? 'Tablero principal' : `Carpeta «${carpetaAbierta?.textoMostrado ?? actual.nombre}»`}</h2>
            {!enPrincipal && (
              <Button variant="ghost" size="sm" onClick={() => setTableroId(null)} className="mb-2">
                Volver al tablero principal
              </Button>
            )}
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3">
              {lista(grilla, actual.id, 'horizontal')}
              <li>
                <button type="button" onClick={() => setDialogo({ tipo: 'palabra-nueva', tableroId: actual.id, nucleo: false })} className={`${BOTON_AGREGAR} w-full h-full min-h-40`}>
                  <Plus className="w-4 h-4" aria-hidden /> Agregar palabra
                </button>
              </li>
            </ul>
            {grilla.length === 0 && <p className="mt-3 text-sm text-secondary">Aún no hay palabras aquí.</p>}
          </section>

          <nav aria-label="Carpetas" className="lg:w-56 shrink-0 lg:border-l lg:border-borderCustom lg:pl-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary mb-2">Carpetas</h2>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] lg:grid-cols-1 gap-3">
              {lista(carpetas, conjunto.principal.id, 'vertical')}
              <li>
                <button type="button" onClick={() => setDialogo({ tipo: 'carpeta-nueva' })} className={`${BOTON_AGREGAR} w-full`}>
                  <FolderPlus className="w-4 h-4" aria-hidden /> Agregar carpeta
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </Hoja>

      <Creditos className="text-xs text-secondary" />

      {dialogo?.tipo === 'plantilla-nueva' && (
        <DialogoPlantilla
          modo="nueva"
          plantillas={plantillas}
          origenInicial={dialogo.origenFijo?.id ?? (destino.tipo === 'plantilla' ? destino.id : ID_PLANTILLA_GENERAL)}
          origenFijo={dialogo.origenFijo?.nombre}
          alGuardar={(datos) => void crearNueva(datos)}
          alCerrar={() => setDialogo(null)}
        />
      )}
      {dialogo?.tipo === 'plantilla-renombrar' && (
        <DialogoPlantilla
          modo="renombrar"
          nombreInicial={conjunto.principal.nombre}
          plantillas={plantillas}
          alGuardar={({ nombre }) => {
            setDialogo(null);
            void aplicar(`Plantilla renombrada a «${nombre}»`, (c) => renombrarTablero(c, c.principal.id, nombre));
          }}
          alCerrar={() => setDialogo(null)}
        />
      )}
      {dialogo?.tipo === 'asignar' && (
        <DialogoAsignar
          plantillas={plantillas}
          alumnos={alumnos ?? []}
          conTablero={conTablero}
          plantillaInicial={destino.tipo === 'plantilla' ? destino.id : ID_PLANTILLA_GENERAL}
          alumnosIniciales={destino.tipo === 'alumno' ? [destino.alumnoId] : []}
          alAsignar={(plantillaId, ids) => void asignar(plantillaId, ids)}
          alCerrar={() => setDialogo(null)}
        />
      )}
      {dialogo?.tipo === 'categorias' && <DialogoCategorias categorias={categorias} uso={uso} alCambiar={cambiarCategorias} alCerrar={() => setDialogo(null)} />}

      {dialogo && (dialogo.tipo === 'palabra-nueva' || dialogo.tipo === 'carpeta-nueva' || dialogo.tipo === 'editar') && (
        <DialogoCelda
          key={dialogo.tipo === 'editar' ? dialogo.celdaId : dialogo.tipo}
          tipo={dialogo.tipo === 'carpeta-nueva' || celdaEnEdicion?.tipo === 'carpeta' ? 'carpeta' : 'palabra'}
          celda={celdaEnEdicion}
          categorias={categorias}
          pictogramas={pictogramas}
          puedeSerNucleo={dialogo.tipo === 'palabra-nueva' ? dialogo.tableroId === conjunto.principal.id : dialogo.tipo === 'editar' && dialogo.tableroId === conjunto.principal.id}
          inicial={dialogo.tipo === 'palabra-nueva' ? { esNucleo: dialogo.nucleo } : undefined}
          alGuardar={guardarDialogo}
          alCerrar={() => setDialogo(null)}
        />
      )}
    </div>
  );
};
