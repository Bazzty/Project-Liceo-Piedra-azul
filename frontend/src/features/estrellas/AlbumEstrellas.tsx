import React, { useMemo, useState } from 'react';
import { Crown, Star, Volume2 } from 'lucide-react';
import { useProgresosDeAlumno, useRegistrosDeAlumno } from '@/api';
import { Sticker } from '@/features/estrellas/Sticker';
import { PAGINAS, STICKERS } from '@/features/estrellas/stickers';
import { useColeccion } from '@/features/estrellas/useColeccion';
import { sonarToque } from '@/shared/audio/sonidos';
import { OsoCabeza } from '@/shared/components/OsoCabeza';
import { useHablar } from '@/shared/hooks/useHablar';

const NOMBRES_DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
/** Cada día tiene su color, tomado de la paleta activa. */
const COLORES_DIA = [
  'bg-btnAprender-bg text-btnAprender-text',
  'bg-btnHablar-bg text-btnHablar-text',
  'bg-btnColores-bg text-btnColores-text',
  'bg-btnLogros-bg text-btnLogros-text',
];

const claveDia = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

/** Álbum de stickers por páginas temáticas y racha de los últimos 7 días, todo visual y con voz. */
export const AlbumEstrellas: React.FC<{ alumnoId: string | null }> = ({ alumnoId }) => {
  const hablar = useHablar();
  const progresos = useProgresosDeAlumno(alumnoId);
  const registros = useRegistrosDeAlumno(alumnoId);
  const { obtenidos } = useColeccion(alumnoId);
  const [paginaElegida, setPaginaElegida] = useState<string | null>(null);
  const [tocado, setTocado] = useState<number | null>(null);

  const ganados = useMemo(() => new Set(obtenidos), [obtenidos]);
  const ultimo = obtenidos.length > 0 ? obtenidos[obtenidos.length - 1] : null;
  // Abre en la página del último sticker ganado, para que el niño vea lo nuevo primero
  const pagina = paginaElegida ?? (ultimo !== null ? STICKERS[ultimo].pagina : PAGINAS[0].id);
  const delaPagina = STICKERS.map((s, i) => ({ s, i })).filter(({ s }) => s.pagina === pagina);

  const { dias, racha } = useMemo(() => {
    const conActividad = new Set<string>([
      ...(registros ?? []).map((r) => claveDia(new Date(r.fecha))),
      ...(progresos ?? []).map((p) => claveDia(new Date(p.fechaUltimoAcceso))),
    ]);
    const hoy = new Date();
    const lista = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() - (6 - i));
      return { nombre: NOMBRES_DIA[d.getDay()], activo: conActividad.has(claveDia(d)), esHoy: i === 6 };
    });
    // Días seguidos hasta hoy (si hoy aún no jugó, cuenta hasta ayer)
    let contador = 0;
    let i = lista[6].activo ? 6 : 5;
    while (i >= 0 && lista[i].activo) {
      contador += 1;
      i -= 1;
    }
    return { dias: lista, racha: contador };
  }, [registros, progresos]);

  const textoRacha = racha > 0 ? `¡${racha} ${racha === 1 ? 'día seguido' : 'días seguidos'}!` : '¡Hoy empieza tu racha!';
  const diasActivos = dias.filter((d) => d.activo).length;
  const semanaCompleta = diasActivos === 7;
  const textoStickers = obtenidos.length === 0 ? 'Gana tu primer sticker' : `Tienes ${obtenidos.length} de ${STICKERS.length} stickers`;

  const tocarSticker = (i: number) => {
    sonarToque();
    setTocado(i);
    setTimeout(() => setTocado((t) => (t === i ? null : t)), 700);
    hablar(ganados.has(i) ? STICKERS[i].nombre : 'Todavía no lo tienes. ¡Sigue jugando!');
  };

  return (
    <div className="flex flex-col gap-5 p-2 sm:p-4">
      <section className="flex flex-col items-center gap-3" aria-label="Racha de días">
        {/* La semana: cada día aparece con su color, uno tras otro; el osito espera en hoy */}
        <div className="relative flex gap-2 sm:gap-4 pt-12">
          {dias.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                sonarToque();
                hablar(d.activo ? `${d.nombre}: ¡jugaste!` : `${d.nombre}: ese día no jugaste`);
              }}
              aria-label={`${d.nombre}: ${d.activo ? 'jugaste' : 'no jugaste'}${d.esHoy ? ' (hoy)' : ''}`}
              className="relative flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition-transform"
            >
              {d.esHoy && (
                <span className="absolute -top-12 sm:-top-14 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-surface border-2 border-borderStrong overflow-hidden animate-saltito" aria-hidden>
                  <OsoCabeza ojosFelices boca="HAPPY" />
                </span>
              )}
              <span
                style={d.activo ? { animationDelay: `${i * 120}ms`, animationFillMode: 'backwards' } : undefined}
                className={`w-11 h-11 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-4 ${
                  d.activo ? `${COLORES_DIA[i % COLORES_DIA.length]} border-surface shadow-card animate-pop` : 'bg-app border-dashed border-borderStrong'
                } ${d.esHoy ? 'ring-4 ring-brand/40' : ''}`}
              >
                <Star className={`w-6 h-6 sm:w-9 sm:h-9 ${d.activo ? 'fill-current' : 'text-borderStrong'}`} aria-hidden />
              </span>
              <span className="text-[0.7rem] sm:text-sm font-black text-secondary capitalize" aria-hidden>
                {d.nombre.slice(0, 3)}
              </span>
            </button>
          ))}
        </div>
        <p className="flex items-center gap-2 text-2xl sm:text-3xl font-black text-primary">
          {semanaCompleta && <Crown className="w-8 h-8 text-accent fill-accent animate-saltito" aria-hidden />}
          {semanaCompleta ? '¡Semana completa!' : textoRacha}
        </p>
        <p className="text-base sm:text-lg font-bold text-secondary">{diasActivos} de 7 días esta semana</p>
      </section>

      <section className="flex flex-col items-center gap-4 border-t-2 border-borderCustom pt-5" aria-label="Álbum de stickers">
        {/* Páginas del álbum: un botón por tema, con cuántos lleva */}
        <div role="tablist" aria-label="Páginas del álbum" className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {PAGINAS.map((p) => {
            const total = STICKERS.filter((s) => s.pagina === p.id).length;
            const tengo = STICKERS.reduce((n, s, i) => (s.pagina === p.id && ganados.has(i) ? n + 1 : n), 0);
            const activa = p.id === pagina;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={activa}
                aria-label={`${p.nombre}: ${tengo} de ${total}`}
                onClick={() => {
                  sonarToque();
                  setPaginaElegida(p.id);
                  hablar(p.nombre);
                }}
                className={`relative flex flex-col items-center justify-center gap-0.5 w-[4.5rem] h-[4.75rem] sm:w-24 sm:h-24 rounded-card border-4 cursor-pointer transition-all active:scale-95 ${
                  activa ? 'bg-accent border-brand -translate-y-1 shadow-card' : 'bg-surface border-borderStrong hover:border-brand'
                }`}
              >
                <p.Icono className="w-7 h-7 sm:w-9 sm:h-9 text-primary" aria-hidden />
                <span className="text-xs sm:text-sm font-black text-primary">{p.nombre}</span>
                <span className={`absolute -top-2 -right-2 min-w-6 h-6 px-1.5 rounded-full text-xs font-black flex items-center justify-center border-2 border-surface ${tengo === total ? 'bg-statusOk text-onStatus' : 'bg-brand text-onBrand'}`} aria-hidden>
                  {tengo}/{total}
                </span>
              </button>
            );
          })}
        </div>

        {/* Hoja de stickers: cada uno un poco inclinado, como pegado a mano */}
        <ul key={pagina} className="grid grid-cols-4 gap-x-3 gap-y-5 sm:gap-x-6 sm:gap-y-6 bg-app/70 rounded-card border-2 border-dashed border-borderStrong p-4 sm:p-6 w-full max-w-xl justify-items-center animate-aparecer" role="tabpanel">
          {delaPagina.map(({ i }) => (
            <li key={i} className="relative">
              <button
                type="button"
                onClick={() => tocarSticker(i)}
                aria-label={ganados.has(i) ? STICKERS[i].nombre : 'Sticker por ganar'}
                className={`block cursor-pointer rounded-full transition-transform hover:scale-110 active:scale-95 ${tocado === i ? 'animate-pop' : ''}`}
              >
                <Sticker indice={i} obtenido={ganados.has(i)} inclinar />
              </button>
              {i === ultimo && (
                <span className="absolute -top-2 -right-3 rounded-full bg-statusDanger text-onStatus text-xs font-black px-2 py-0.5 animate-pulso rotate-6" aria-hidden>
                  ¡Nuevo!
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className="text-2xl sm:text-3xl font-black text-primary text-center">{textoStickers}</p>
      </section>

      <button
        type="button"
        onClick={() => hablar(`${textoRacha} ${textoStickers}.`)}
        className="self-center inline-flex items-center gap-2 min-h-14 px-6 rounded-control bg-accent text-onAccent text-xl font-extrabold cursor-pointer hover:bg-accent-hover"
      >
        <Volume2 className="w-6 h-6" aria-hidden />
        Escuchar
      </button>
    </div>
  );
};
