import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { guardarPictograma, usePictogramas } from '@/api';
import { searchArasaacPictograms, type ArasaacOpcion } from '@/features/tablero/arasaac';
import { nuevoId } from '@/features/tablero/edicionTablero';
import { descargarDibujo, motivoDeRechazo, reducirImagen } from '@/features/tablero/imagenes';
import { Creditos } from '@/shared/components/Creditos';
import type { Pictograma } from '@/types';

const sinTildes = (texto: string) => texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const MAXIMO_DEL_CATALOGO = 12;

interface Props {
  /** La palabra que escribió la docente: con ella se busca el dibujo. */
  consulta: string;
  elegido?: Pictograma;
  alElegir: (pictograma: Pictograma) => void;
}

const Opcion: React.FC<{ url: string; etiqueta: string; elegida: boolean; alElegir: () => void }> = ({ url, etiqueta, elegida, alElegir }) => (
  <li>
    <button
      type="button"
      onClick={alElegir}
      aria-label={etiqueta}
      aria-pressed={elegida}
      className={`w-full aspect-square rounded-control border-4 bg-surface p-1 cursor-pointer transition-colors ${elegida ? 'border-brand ring-4 ring-accent/60' : 'border-borderCustom hover:border-brand'}`}
    >
      <img src={url} alt="" className="w-full h-full object-contain" />
    </button>
  </li>
);

/**
 * Elige el dibujo de una palabra: a medida que se escribe, muestra los del catálogo de la app y los que encuentra
 * en ARASAAC. Un dibujo de ARASAAC se guarda como pictograma propio al elegirlo.
 */
export const SelectorPictograma: React.FC<Props> = ({ consulta, elegido, alElegir }) => {
  const catalogo = usePictogramas();
  /** Lo último que devolvió ARASAAC y para qué palabra: si no coincide con la actual, todavía se está buscando. */
  const [respuesta, setRespuesta] = useState<{ para: string; opciones: ArasaacOpcion[] } | null>(null);
  const buscada = sinTildes(consulta);
  const buscaEnArasaac = buscada.length >= 2;
  const arasaac = respuesta?.para === buscada ? respuesta.opciones : [];
  const estado: 'quieto' | 'buscando' | 'listo' | 'sinResultados' = !buscaEnArasaac ? 'quieto' : respuesta?.para !== buscada ? 'buscando' : arasaac.length > 0 ? 'listo' : 'sinResultados';

  useEffect(() => {
    if (!buscaEnArasaac) return;
    let vigente = true;
    // Se espera un momento a que la docente termine de escribir, para no pedir una búsqueda por cada letra
    const espera = setTimeout(async () => {
      const opciones = await searchArasaacPictograms(buscada);
      if (vigente) setRespuesta({ para: buscada, opciones });
    }, 400);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [buscada, buscaEnArasaac]);

  const delCatalogo = buscada
    ? (catalogo ?? []).filter((p) => sinTildes(p.palabra).includes(buscada)).slice(0, MAXIMO_DEL_CATALOGO)
    : [];

  /** Aviso sobre lo último que se hizo (guardar un dibujo, subir una foto). */
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const entradaDeFoto = useRef<HTMLInputElement>(null);
  const misFotos = (catalogo ?? []).filter((p) => p.esFotoReal && p.id?.startsWith('foto-')).slice(0, MAXIMO_DEL_CATALOGO);

  /** Un dibujo de ARASAAC se baja y se guarda en el navegador, para que el tablero también funcione sin internet. */
  const elegirDeArasaac = async (opcion: ArasaacOpcion) => {
    const id = `arasaac-${opcion.id}`;
    const yaGuardado = (catalogo ?? []).find((p) => p.id === id && p.imagenUrl.startsWith('data:'));
    if (yaGuardado) {
      alElegir(yaGuardado);
      return;
    }
    setOcupado(true);
    setAviso('Guardando el dibujo…');
    const local = await descargarDibujo(opcion.url);
    const pictograma: Pictograma = { id, palabra: consulta.trim(), categoria: 'basicas', imagenUrl: local ?? opcion.url, esFotoReal: false };
    await guardarPictograma(pictograma);
    setAviso(local ? 'Dibujo guardado: se verá también sin internet.' : 'No se pudo guardar para usarlo sin internet: se verá solo con conexión.');
    setOcupado(false);
    alElegir(pictograma);
  };

  /** Una foto propia se reduce (y pierde sus metadatos) antes de guardarse como pictograma. */
  const subirFoto = async (archivo: File | undefined) => {
    if (!archivo) return;
    const rechazo = motivoDeRechazo(archivo);
    if (rechazo) {
      setAviso(rechazo);
      return;
    }
    setOcupado(true);
    setAviso('Preparando la foto…');
    try {
      const imagenUrl = await reducirImagen(archivo);
      const pictograma: Pictograma = { id: nuevoId('foto'), palabra: consulta.trim(), categoria: 'propias', imagenUrl, esFotoReal: true };
      await guardarPictograma(pictograma);
      setAviso('Foto guardada.');
      alElegir(pictograma);
    } catch {
      setAviso('No se pudo usar esa foto. Prueba con otra.');
    } finally {
      setOcupado(false);
      if (entradaDeFoto.current) entradaDeFoto.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 min-h-16">
        <span className="w-16 h-16 shrink-0 rounded-control border-2 border-borderStrong bg-app flex items-center justify-center overflow-hidden">
          {elegido ? <img src={elegido.imagenUrl} alt="" className="w-full h-full object-contain" /> : <span className="text-xs text-secondary px-1 text-center">Sin dibujo</span>}
        </span>
        <p className="text-sm text-secondary" role="status">
          {elegido ? `Dibujo elegido para «${elegido.palabra}».` : 'Escribe la palabra y elige un dibujo de la lista.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input ref={entradaDeFoto} type="file" accept="image/*" aria-label="Elegir una foto de este equipo" tabIndex={-1} className="sr-only" onChange={(e) => void subirFoto(e.target.files?.[0])} />
        <button
          type="button"
          onClick={() => entradaDeFoto.current?.click()}
          disabled={ocupado || !consulta.trim()}
          className="min-h-11 inline-flex items-center gap-2 rounded-control border border-borderStrong bg-surface px-3 text-sm font-bold text-primary cursor-pointer hover:border-brand disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera className="w-4 h-4" aria-hidden /> Subir una foto
        </button>
        <p className="text-xs text-secondary grow min-w-48">
          {consulta.trim() ? 'Sirve una foto de un objeto o lugar del liceo. No subas fotos de niños.' : 'Escribe primero la palabra para poder subir su foto.'}
        </p>
      </div>
      <p role="status" aria-live="polite" className={aviso ? 'text-sm text-primary' : 'sr-only'}>
        {aviso}
      </p>

      {misFotos.length > 0 && (
        <section aria-label="Mis fotos">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-secondary mb-1">Mis fotos</h4>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2">
            {misFotos.map((p) => (
              <Opcion key={p.id} url={p.imagenUrl} etiqueta={`Usar mi foto de «${p.palabra}»`} elegida={elegido?.id === p.id} alElegir={() => alElegir(p)} />
            ))}
          </ul>
        </section>
      )}

      {delCatalogo.length > 0 && (
        <section aria-label="Dibujos de la app">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-secondary mb-1">De la app</h4>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2">
            {delCatalogo.map((p) => (
              <Opcion key={p.id} url={p.imagenUrl} etiqueta={`Usar el dibujo de «${p.palabra}»`} elegida={elegido?.id === p.id} alElegir={() => alElegir(p)} />
            ))}
          </ul>
        </section>
      )}

      {buscada.length >= 2 && (
        <section aria-label="Dibujos de ARASAAC" aria-busy={estado === 'buscando'}>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-secondary mb-1">De ARASAAC</h4>
          {estado === 'buscando' && (
            <p className="flex items-center gap-2 text-sm text-secondary">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Buscando…
            </p>
          )}
          {estado === 'sinResultados' && <p className="text-sm text-secondary">No encontré dibujos en ARASAAC. Prueba con otra palabra o revisa la conexión a internet.</p>}
          {estado === 'listo' && (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2">
              {arasaac.map((o, i) => (
                <Opcion key={o.id} url={o.url} etiqueta={`Usar la opción ${i + 1} de ARASAAC para «${consulta.trim()}»`} elegida={elegido?.id === `arasaac-${o.id}`} alElegir={() => void elegirDeArasaac(o)} />
              ))}
            </ul>
          )}
          <Creditos className="mt-2 text-xs text-secondary" />
        </section>
      )}
    </div>
  );
};
