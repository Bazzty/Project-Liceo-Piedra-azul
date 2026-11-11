import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { guardarPictograma, usePictogramas } from '@/api';
import { searchArasaacPictograms, type ArasaacOpcion } from '@/features/tablero/arasaac';
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

  const elegirDeArasaac = async (opcion: ArasaacOpcion) => {
    const pictograma: Pictograma = { id: `arasaac-${opcion.id}`, palabra: consulta.trim(), categoria: 'basicas', imagenUrl: opcion.url, esFotoReal: false };
    await guardarPictograma(pictograma);
    alElegir(pictograma);
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
        </section>
      )}
    </div>
  );
};
