import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FolderPlus, Play, Plus, RotateCcw, Undo2 } from 'lucide-react';
import { guardarTableros, useAlumnos, useCategorias, usePictogramas } from '@/api';
import { EncabezadoPagina, Hoja } from '@/features/docente/components/Hoja';
import { franjaDeColor } from '@/features/tablero/coloresTablero';
import {
  actualizarCelda,
  agregarCarpeta,
  agregarCelda,
  moverCelda,
  moverRelativo,
  nuevaCeldaPalabra,
  pasarCelda,
  quitarCelda,
  tablerosDelConjunto,
  type Conjunto,
} from '@/features/tablero/edicionTablero';
import { CeldaEditable } from '@/features/tablero/editor/CeldaEditable';
import { DialogoCelda, type DatosDeCelda } from '@/features/tablero/editor/DialogoCelda';
import { guardarCambio, restablecerAlumno, type Destino } from '@/features/tablero/gestionTableros';
import { ID_PLANTILLA_GENERAL } from '@/features/tablero/plantillaGeneral';
import { useConjuntoEditable } from '@/features/tablero/useConjuntoEditable';
import { useTableroStore } from '@/shared/store/useTableroStore';
import { Button } from '@/shared/ui';
import type { CeldaTablero } from '@/types';

type Dialogo =
  | { tipo: 'palabra-nueva'; tableroId: string; nucleo: boolean }
  | { tipo: 'carpeta-nueva' }
  | { tipo: 'editar'; tableroId: string; celdaId: string };

interface Arrastre {
  tableroId: string;
  celdaId: string;
}

const claveDestino = (d: Destino) => (d.tipo === 'plantilla' ? `plantilla:${d.id}` : `alumno:${d.alumnoId}`);
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
  const abrirTablero = useTableroStore((s) => s.abrir);

  const [destino, setDestino] = useState<Destino>({ tipo: 'plantilla', id: ID_PLANTILLA_GENERAL });
  const editable = useConjuntoEditable(destino);
  const [tableroId, setTableroId] = useState<string | null>(null);
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [aviso, setAviso] = useState('');
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

  const colores = useMemo(() => new Map((categorias ?? []).map((c) => [c.id, c.color])), [categorias]);
  const franja = (celda: CeldaTablero) => franjaDeColor(colores.get(celda.categoriaId) ?? 'aprender');
  const dibujo = (celda: CeldaTablero) => pictogramas?.find((p) => p.id === celda.pictogramaId);

  if (!editable || !categorias || !pictogramas) {
    return <p role="status" className="text-secondary">Cargando el tablero…</p>;
  }

  const { conjunto, copiaPropia } = editable;
  const actual = (tableroId ? conjunto.carpetas.find((t) => t.id === tableroId) : undefined) ?? conjunto.principal;
  const enPrincipal = actual.id === conjunto.principal.id;
  const nucleo = conjunto.principal.celdas.filter((c) => c.tipo === 'palabra' && c.esNucleo);
  const carpetas = conjunto.principal.celdas.filter((c) => c.tipo === 'carpeta');
  const grilla = enPrincipal ? conjunto.principal.celdas.filter((c) => c.tipo === 'palabra' && !c.esNucleo) : actual.celdas;
  const carpetaAbierta = carpetas.find((c) => c.destinoTableroId === actual.id);
  const celdaEnEdicion = dialogo?.tipo === 'editar' ? [...conjunto.principal.celdas, ...conjunto.carpetas.flatMap((t) => t.celdas)].find((c) => c.id === dialogo.celdaId) : undefined;

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
      void aplicar(`Carpeta «${datos.textoMostrado}» agregada`, (c) => agregarCarpeta(c, { nombre: datos.textoMostrado, categoriaId: datos.categoriaId, pictogramaId: datos.pictogramaId }));
    } else if (dialogo.tipo === 'palabra-nueva') {
      const celda = nuevaCeldaPalabra({ pictogramaId: datos.pictogramaId as string, textoMostrado: datos.textoMostrado, textoHablado: datos.textoHablado, categoriaId: datos.categoriaId, esNucleo: datos.esNucleo });
      void aplicar(`«${datos.textoMostrado}» agregada`, (c) => agregarCelda(c, dialogo.tableroId, celda));
    } else {
      const { esNucleo, ...resto } = datos;
      void aplicar(`«${datos.textoMostrado}» guardada`, (c) => actualizarCelda(c, dialogo.tableroId, dialogo.celdaId, { ...resto, esNucleo: esNucleo || undefined }));
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

      <Hoja className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1 min-w-0 grow sm:grow-0">
          <label htmlFor="destino-tablero" className="text-sm font-semibold text-primary">
            ¿Qué tablero quieres editar?
          </label>
          <select id="destino-tablero" value={claveDestino(destino)} onChange={(e) => cambiarDestino(e.target.value)} className="min-h-12 rounded-control border border-borderStrong bg-surface px-3 text-base text-primary sm:min-w-72">
            <optgroup label="Plantilla">
              <option value={`plantilla:${ID_PLANTILLA_GENERAL}`}>Plantilla general (la que trae la app)</option>
            </optgroup>
            <optgroup label="Tablero de cada niño">
              {(alumnos ?? []).map((a) => (
                <option key={a.id} value={`alumno:${a.id}`}>
                  {`${a.nombre} ${a.apellido}`.trim()}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <p className="text-sm text-secondary grow min-w-60">
          {destino.tipo === 'plantilla'
            ? 'Los cambios a la plantilla general los reciben los niños que aún no tienen tablero propio.'
            : copiaPropia
              ? `${nombreAlumno} tiene su propio tablero: lo que cambies aquí solo lo ve él o ella.`
              : `${nombreAlumno} usa la plantilla general. Al hacer el primer cambio se le crea su propio tablero.`}
        </p>

        <div className="flex gap-2">
          {destino.tipo === 'alumno' && copiaPropia && (
            <Button variant="secondary" onClick={() => void restablecer()}>
              <RotateCcw className="w-4 h-4" aria-hidden /> Restablecer a la plantilla
            </Button>
          )}
          <Button variant="secondary" onClick={() => void deshacer?.()} disabled={!deshacer}>
            <Undo2 className="w-4 h-4" aria-hidden /> Deshacer
          </Button>
        </div>
      </Hoja>

      <p role="status" aria-live="polite" className={`text-sm ${aviso ? 'text-secondary' : 'sr-only'}`}>
        {aviso}
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

      {dialogo && (
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
