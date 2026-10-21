import React, { useState } from 'react';
import { Plus, Search, Wand2 } from 'lucide-react';
import { crearCuento, useNiveles } from '@/api';
import { Hoja } from '@/features/docente/components/Hoja';
import { resolverImagenes } from '@/features/docente/components/resolverImagenes';
import { PictoImg } from '@/features/docente/components/widgets';
import { Button } from '@/shared/ui';
import type { Cuento } from '@/types';

const MIN_CON_IMAGEN = 3;
const MAXIMO_PALABRAS = 8;
const CAMPO = 'w-full min-h-12 rounded-control border border-borderStrong bg-surface px-3 text-sm text-primary';

/** Palabras sueltas del texto (una por línea o separadas por coma), sin repetir. */
const palabrasDe = (texto: string) =>
  [...new Set(texto.split(/[\n,;]+/).map((p) => p.trim().replace(/[.!?¡¿]/g, '')).filter(Boolean))].slice(0, MAXIMO_PALABRAS);

/**
 * Crear una actividad propia: la docente escribe palabras, la app busca sus dibujos y de ahí salen solos los
 * juegos (escuchar, leer, sonido inicial, memoria). No hace falta armar cada juego a mano.
 */
export const CrearActividad: React.FC<{ alCrear: (cuentoId: string) => void }> = ({ alCrear }) => {
  const niveles = useNiveles();
  const [abierto, setAbierto] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [nivel, setNivel] = useState('nivel-c');
  const [vista, setVista] = useState<Map<string, string | undefined> | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const palabras = palabrasDe(texto);
  const conImagen = vista ? palabras.filter((p) => vista.get(p)) : [];
  const sinImagen = vista ? palabras.filter((p) => !vista.get(p)) : [];

  const buscar = async () => {
    setError('');
    if (palabras.length < MIN_CON_IMAGEN) return setError(`Escribe al menos ${MIN_CON_IMAGEN} palabras.`);
    setBuscando(true);
    setVista(await resolverImagenes(palabras));
    setBuscando(false);
  };

  const guardar = async () => {
    setError('');
    if (!titulo.trim()) return setError('Ponle un nombre a la actividad.');
    if (conImagen.length < MIN_CON_IMAGEN) return setError(`Hacen falta al menos ${MIN_CON_IMAGEN} palabras con dibujo para armar los juegos.`);
    const id = `actividad-propia-${crypto.randomUUID().slice(0, 8)}`;
    const cuento: Cuento = {
      id,
      nivelId: nivel,
      titulo: titulo.trim(),
      descripcion: 'Actividad creada por la docente',
      portadaUrl: vista?.get(conImagen[0]),
      // Material de su propio curso: no pasa por el revisor porque no se comparte con otros cursos
      estado: 'publicado',
      fechaCreacion: new Date().toISOString(),
      paginas: conImagen.map((p, i) => ({
        numeroPagina: i + 1,
        textoCompleto: p,
        palabras: [{ texto: p, pictogramaUrl: vista?.get(p) }],
      })),
    };
    await crearCuento(cuento);
    setAviso(`«${cuento.titulo}» está lista. Ya puedes asignarla.`);
    setTimeout(() => setAviso(''), 5000);
    setTitulo('');
    setTexto('');
    setVista(null);
    setAbierto(false);
    alCrear(id);
  };

  return (
    <Hoja aria-label="Crear actividad propia">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-primary inline-flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-brand" aria-hidden /> Crear actividad propia
          </h2>
          <p className="text-xs text-secondary">Escribe palabras y se arman solos los juegos con sus dibujos.</p>
        </div>
        {!abierto && (
          <Button variant="secondary" size="md" onClick={() => setAbierto(true)}>
            <Plus className="w-5 h-5" aria-hidden /> Nueva actividad
          </Button>
        )}
      </div>
      {aviso && (
        <p role="status" className="mt-2 text-sm font-semibold text-statusOk">
          ✓ {aviso}
        </p>
      )}

      {abierto && (
        <div className="mt-3 flex flex-col gap-4">
          {error && <p className="rounded-control border border-statusDanger bg-statusDanger-bg px-3 py-2 text-sm font-semibold text-statusDanger">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)]">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="act-titulo" className="text-sm font-semibold text-primary">Nombre de la actividad</label>
              <input id="act-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej.: Animales de la granja" className={CAMPO} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="act-nivel" className="text-sm font-semibold text-primary">Nivel</label>
              <select id="act-nivel" value={nivel} onChange={(e) => setNivel(e.target.value)} className={CAMPO}>
                {(niveles ?? []).map((n) => (
                  <option key={n.id} value={n.id}>Nivel {n.codigo} · {n.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="act-palabras" className="text-sm font-semibold text-primary">Palabras (de {MIN_CON_IMAGEN} a {MAXIMO_PALABRAS}, una por línea o separadas por coma)</label>
            <textarea
              id="act-palabras"
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                setVista(null);
              }}
              rows={3}
              placeholder={'vaca\ngallina\ncaballo'}
              className="w-full rounded-control border border-borderStrong bg-surface p-3 text-sm text-primary resize-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="md" onClick={buscar} loading={buscando}>
              <Search className="w-5 h-5" aria-hidden /> Buscar dibujos
            </Button>
            <span className="text-xs text-secondary">Usa los dibujos del proyecto y, con internet, busca en ARASAAC.</span>
          </div>

          {vista && (
            <div>
              <ul className="flex flex-wrap gap-3" aria-label="Vista previa">
                {palabras.map((p) => (
                  <li key={p} className="flex flex-col items-center gap-1 w-20">
                    <PictoImg src={vista.get(p)} alt={p} className="w-16 h-16" />
                    <span className={`text-xs font-bold ${vista.get(p) ? 'text-primary' : 'text-statusDanger'}`}>{p}</span>
                  </li>
                ))}
              </ul>
              {sinImagen.length > 0 && (
                <p className="mt-2 text-xs text-statusWarn font-semibold">
                  Sin dibujo: {sinImagen.join(', ')}. Se dejarán fuera; cambia la palabra por otra parecida si la necesitas.
                </p>
              )}
              <p className="mt-2 text-xs text-secondary">
                Con estas {conImagen.length} palabras se arman juegos de escuchar y elegir, leer, sonido inicial y memoria. Es material de tu curso: no pasa por el revisor.
              </p>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="ghost" size="md" onClick={() => setAbierto(false)}>Cancelar</Button>
            <Button size="md" onClick={guardar} disabled={!vista || conImagen.length < MIN_CON_IMAGEN}>
              Guardar actividad
            </Button>
          </div>
        </div>
      )}
    </Hoja>
  );
};
