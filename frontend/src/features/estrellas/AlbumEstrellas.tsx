import React, { useMemo } from 'react';
import { Star, Volume2 } from 'lucide-react';
import { contarCompletados, useProgresosDeAlumno, useRegistrosDeAlumno } from '@/api';
import { Sticker } from '@/features/estrellas/Sticker';
import { STICKERS } from '@/features/estrellas/stickers';
import { useHablar } from '@/shared/hooks/useHablar';

const INICIALES = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const claveDia = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

/** Álbum de stickers (uno por cuento completado) y racha de los últimos 7 días, todo visual. */
export const AlbumEstrellas: React.FC<{ alumnoId: string | null }> = ({ alumnoId }) => {
  const hablar = useHablar();
  const progresos = useProgresosDeAlumno(alumnoId);
  const registros = useRegistrosDeAlumno(alumnoId);

  const stickers = Math.min(contarCompletados(progresos), STICKERS.length);

  const { dias, racha } = useMemo(() => {
    const conActividad = new Set<string>([
      ...(registros ?? []).map((r) => claveDia(new Date(r.fecha))),
      ...(progresos ?? []).map((p) => claveDia(new Date(p.fechaUltimoAcceso))),
    ]);
    const hoy = new Date();
    const lista = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() - (6 - i));
      return { inicial: INICIALES[d.getDay()], activo: conActividad.has(claveDia(d)), esHoy: i === 6 };
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
  const textoStickers = stickers === 0 ? 'Gana tu primer sticker' : `Tienes ${stickers} de ${STICKERS.length} stickers`;

  return (
    <div className="flex flex-col gap-6 p-2 sm:p-4">
      <section className="flex flex-col items-center gap-3" aria-label="Racha de días">
        <div className="flex gap-2 sm:gap-3" role="img" aria-label={textoRacha}>
          {dias.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span
                className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-4 ${
                  d.activo ? 'bg-accent border-brand' : 'bg-app border-dashed border-borderStrong'
                } ${d.esHoy ? 'ring-4 ring-brand/30' : ''}`}
              >
                <Star className={`w-6 h-6 sm:w-8 sm:h-8 ${d.activo ? 'fill-brand text-brand' : 'text-borderStrong'}`} aria-hidden />
              </span>
              <span className="text-sm font-black text-secondary" aria-hidden>
                {d.inicial}
              </span>
            </div>
          ))}
        </div>
        <p className="text-2xl sm:text-3xl font-black text-primary">{textoRacha}</p>
      </section>

      <section className="flex flex-col items-center gap-4 border-t-2 border-borderCustom pt-5" aria-label="Álbum de stickers">
        <ul className="grid grid-cols-4 gap-3 sm:gap-5">
          {STICKERS.map((_, i) => (
            <li key={i}>
              <Sticker indice={i} obtenido={i < stickers} />
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
