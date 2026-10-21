import React, { useMemo, useRef, useState } from "react";
import { Delete, HandHelping, Trash2, Volume2 } from "lucide-react";
import type { Pictograma } from "@/types";
import { crearRegistro, usePictogramas, useRegistrosDeAlumno } from "@/api";
import { useAuthStore } from "@/features/acceso/useAuthStore";
import {
  CATEGORIAS_TABLERO,
  franjaDe,
} from "@/features/tablero/categoriasTablero";
import { resolverYGuardarPictograma } from "@/features/tablero/arasaac";
import {
  decirSecuencia,
  type ElementoDeVoz,
} from "@/shared/audio/decirSecuencia";
import { sonarToque } from "@/shared/audio/sonidos";
import { useHablar } from "@/shared/hooks/useHablar";

const MAXIMO_FRECUENTES = 12;
const PALABRAS_POR_FRASE = 8;

const aVoz = (p: Pictograma): ElementoDeVoz => ({
  texto: p.palabra,
  audioUrl: p.audioUrl,
});

/** Dibujo con respaldo: si el archivo no está, lo pide a ARASAAC una vez; si tampoco, muestra la inicial. */
const Dibujo: React.FC<{ pic: Pictograma; className: string }> = ({
  pic,
  className,
}) => {
  const [src, setSrc] = useState(pic.imagenUrl);
  const [fallo, setFallo] = useState(false);
  const alFallar = async () => {
    if (fallo) return;
    const url = await resolverYGuardarPictograma(pic.palabra);
    if (url && url !== src) setSrc(url);
    else setFallo(true);
  };
  return fallo ? (
    <span
      className={`${className} flex items-center justify-center text-4xl font-black text-secondary`}
    >
      {pic.palabra.charAt(0).toUpperCase()}
    </span>
  ) : (
    <img
      src={src}
      alt=""
      onError={alFallar}
      className={`${className} object-contain`}
    />
  );
};

interface TeclaProps {
  pic: Pictograma;
  alTocar: (pic: Pictograma) => void;
}

/** Una tecla del tablero: dibujo grande y, debajo, la palabra sobre la franja de color de su categoría. */
const Tecla: React.FC<TeclaProps> = ({ pic, alTocar }) => {
  const [pulsada, setPulsada] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        setPulsada(true);
        setTimeout(() => setPulsada(false), 350);
        alTocar(pic);
      }}
      aria-label={pic.palabra}
      className={`flex flex-col overflow-hidden rounded-card border-4 border-borderStrong bg-surface shadow-card cursor-pointer transition-transform hover:border-brand hover:-translate-y-0.5 active:scale-95 ${pulsada ? "animate-pop" : ""}`}
    >
      <span className="flex-1 flex items-center justify-center p-2 min-h-24 sm:min-h-28">
        <Dibujo pic={pic} className="w-20 h-20 sm:w-24 sm:h-24" />
      </span>
      <span
        className={`px-1 py-1.5 text-center text-base sm:text-lg font-black truncate ${franjaDe(pic.categoria)}`}
      >
        {pic.palabra}
      </span>
    </button>
  );
};

/**
 * Hablar: tablero de comunicación con pictogramas. El niño toca dibujos (cada uno se dice al tocarlo),
 * arma una frase arriba y la dice entera con el botón grande. Las categorías tienen color e ícono.
 */
export const TableroSAAC: React.FC = () => {
  const hablar = useHablar();
  const activeStudentId = useAuthStore((s) => s.activeStudentId);
  const supervision = useAuthStore((s) => s.supervision);
  const todos = usePictogramas();
  const registros = useRegistrosDeAlumno(activeStudentId);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [frase, setFrase] = useState<Pictograma[]>([]);
  const [sonando, setSonando] = useState<number | null>(null);
  const corte = useRef(0);

  // Las palabras que más usa este niño, para tenerlas a mano
  const frecuentes = useMemo(() => {
    if (!todos || !registros) return [];
    const cuenta = new Map<string, number>();
    registros
      .filter((r) => r.tipo === "tablero")
      .forEach((r) =>
        r.pictogramaIds?.forEach((id) =>
          cuenta.set(id, (cuenta.get(id) ?? 0) + 1),
        ),
      );
    return [...cuenta.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => todos.find((p) => p.id === id))
      .filter((p): p is Pictograma => !!p)
      .slice(0, MAXIMO_FRECUENTES);
  }, [todos, registros]);

  const tieneFrecuentes = frecuentes.length >= 3;
  const activa = categoria ?? (tieneFrecuentes ? "frecuentes" : "todos");
  const visibles =
    activa === "frecuentes"
      ? frecuentes
      : (todos ?? []).filter(
          (p) => activa === "todos" || p.categoria === activa,
        );
  const ayuda = todos?.find((p) => p.id === "pic-ayuda");

  const registrar = (pics: Pictograma[], detalleExtra = "") => {
    if (!activeStudentId || supervision || pics.length === 0) return;
    void crearRegistro({
      alumnoId: activeStudentId,
      tipo: "tablero",
      detalle: `Tablero: «${pics.map((p) => p.palabra).join(" ")}»${detalleExtra}`,
      lugar: "casa",
      fecha: new Date().toISOString(),
      pictogramaIds: pics.map((p) => p.id ?? "").filter(Boolean),
    });
  };

  const tocarTecla = (pic: Pictograma) => {
    sonarToque();
    if (frase.length < PALABRAS_POR_FRASE) setFrase((f) => [...f, pic]);
    // Cada palabra se dice al tocarla: el niño oye lo que eligió
    corte.current += 1;
    void decirSecuencia([aVoz(pic)], { cancelada: () => false });
  };

  const decirFrase = () => {
    if (frase.length === 0) return;
    corte.current += 1;
    const mio = corte.current;
    void decirSecuencia(frase.map(aVoz), {
      alDecir: setSonando,
      cancelada: () => corte.current !== mio,
    });
    registrar(frase);
  };

  const pedirAyuda = () => {
    if (!ayuda) return;
    sonarToque();
    corte.current += 1;
    void decirSecuencia(
      [{ texto: "Necesito ayuda", audioUrl: ayuda.audioUrl }],
      { cancelada: () => false },
    );
    registrar([ayuda], " (botón de ayuda)");
  };

  const borrarUltima = () => {
    corte.current += 1;
    setSonando(null);
    setFrase((f) => f.slice(0, -1));
  };

  const limpiar = () => {
    corte.current += 1;
    setSonando(null);
    setFrase([]);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* La frase: dibujos grandes y los botones para decirla o borrarla */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 rounded-card border-4 border-borderStrong bg-surface p-3 sm:p-4 shadow-card">
        <div
          className="flex-1 min-w-[12rem] flex items-center gap-2 sm:gap-3 overflow-x-auto py-1"
          aria-label="Mi frase"
          aria-live="polite"
        >
          {frase.length === 0
            ? [0, 1, 2].map((i) => (
                <span
                  key={i}
                  aria-hidden
                  className="shrink-0 w-20 h-24 sm:w-24 sm:h-28 rounded-control border-4 border-dashed border-borderStrong bg-app"
                />
              ))
            : frase.map((p, i) => (
                <span
                  key={`${p.id}-${i}`}
                  className={`shrink-0 flex flex-col items-center rounded-control border-4 bg-app px-1.5 pt-1.5 animate-pop transition-all ${sonando === i ? "border-brand ring-8 ring-accent/70 scale-110" : "border-borderStrong"}`}
                >
                  <Dibujo pic={p} className="w-16 h-16 sm:w-20 sm:h-20" />
                  <span className="text-sm sm:text-base font-black text-primary">
                    {p.palabra}
                  </span>
                </span>
              ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={decirFrase}
            disabled={frase.length === 0}
            aria-label="Decir mi frase"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-accent text-onAccent border-4 border-borderStrong flex items-center justify-center shadow-card cursor-pointer hover:bg-accent-hover active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Volume2
              className={`w-10 h-10 sm:w-12 sm:h-12 ${sonando !== null ? "animate-pulso" : ""}`}
              aria-hidden
            />
          </button>
          <button
            type="button"
            onClick={borrarUltima}
            disabled={frase.length === 0}
            aria-label="Borrar la última palabra"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-surface text-primary border-4 border-borderStrong flex items-center justify-center cursor-pointer hover:border-brand active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Delete className="w-7 h-7" aria-hidden />
          </button>
          <button
            type="button"
            onClick={limpiar}
            disabled={frase.length === 0}
            aria-label="Borrar toda la frase"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-statusDanger-bg text-statusDanger border-4 border-statusDanger flex items-center justify-center cursor-pointer active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-7 h-7" aria-hidden />
          </button>
        </div>
      </div>

      {/* Categorías: ícono grande y su color; tocar una la dice en voz alta */}
      <div className="flex items-stretch gap-2 sm:gap-3">
        <div
          role="tablist"
          aria-label="Categorías"
          className="flex-1 min-w-0 flex gap-2 sm:gap-3 overflow-x-auto pb-1"
        >
          {CATEGORIAS_TABLERO.filter(
            (c) => c.id !== "frecuentes" || tieneFrecuentes,
          ).map((c) => {
            const seleccionada = c.id === activa;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={seleccionada}
                onClick={() => {
                  sonarToque();
                  setCategoria(c.id);
                  hablar(c.nombre);
                }}
                className={`shrink-0 flex flex-col items-center justify-center gap-0.5 w-[4.75rem] h-[4.75rem] sm:w-24 sm:h-24 rounded-card border-4 cursor-pointer transition-all active:scale-95 ${
                  seleccionada
                    ? "bg-accent text-onAccent border-brand -translate-y-1 shadow-card"
                    : "bg-surface text-primary border-borderStrong hover:border-brand"
                }`}
              >
                <c.Icono className="w-8 h-8 sm:w-10 sm:h-10" aria-hidden />
                <span className="text-xs sm:text-sm font-black">
                  {c.nombre}
                </span>
              </button>
            );
          })}
        </div>
        {ayuda && (
          <button
            type="button"
            onClick={pedirAyuda}
            aria-label="Necesito ayuda"
            className="shrink-0 self-start flex flex-col items-center justify-center gap-0.5 w-[4.75rem] h-[4.75rem] sm:w-24 sm:h-24 rounded-card border-4 border-statusDanger bg-statusDanger text-onStatus cursor-pointer active:scale-90 transition-transform shadow-card"
          >
            <HandHelping className="w-8 h-8 sm:w-10 sm:h-10" aria-hidden />
            <span className="text-xs sm:text-sm font-black">Ayuda</span>
          </button>
        )}
      </div>

      {/* Teclas */}
      <div
        role="tabpanel"
        className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-3 sm:gap-4 max-h-[52vh] overflow-y-auto p-1"
      >
        {visibles.map((pic) => (
          <Tecla key={pic.id ?? pic.palabra} pic={pic} alTocar={tocarTecla} />
        ))}
      </div>
    </div>
  );
};
