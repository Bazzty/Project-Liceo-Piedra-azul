import React, { useEffect, useRef, useState } from 'react';
import { sonarLuz } from '@/shared/audio/sonidos';
import { useAjustesStore } from '@/shared/store/useAjustesStore';

interface Luz {
  id: number;
  x: number;
  y: number;
  dx: number;
  t: number;
}

const MAXIMO = 36;
const VIDA_MS = 6000;

/** Cielo de luciérnagas: donde el niño toca nace una lucecita que flota y se apaga sola. Nada que ganar ni perder. */
export const Luciernagas: React.FC = () => {
  const movimiento = useAjustesStore((s) => s.movimiento);
  const [luces, setLuces] = useState<Luz[]>([]);
  const contador = useRef(0);
  const temporizadores = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const lista = temporizadores.current;
    return () => lista.forEach(clearTimeout);
  }, []);

  const nacer = (x: number, y: number) => {
    const id = (contador.current += 1);
    const luz: Luz = { id, x, y, dx: Math.round((Math.random() - 0.5) * 120), t: 36 + Math.round(Math.random() * 28) };
    setLuces((l) => [...l.slice(-(MAXIMO - 1)), luz]);
    temporizadores.current.push(setTimeout(() => setLuces((l) => l.filter((o) => o.id !== id)), VIDA_MS));
  };

  const tocar = (e: React.PointerEvent<HTMLDivElement>) => {
    const caja = e.currentTarget.getBoundingClientRect();
    nacer(((e.clientX - caja.left) / caja.width) * 100, ((e.clientY - caja.top) / caja.height) * 100);
    sonarLuz();
  };

  // Un par de luces ya flotando al llegar, para que se entienda que hay que tocar
  useEffect(() => {
    const inicio = [
      [28, 38],
      [62, 30],
      [48, 60],
    ];
    const id = setTimeout(() => inicio.forEach(([x, y]) => nacer(x, y)), 150);
    temporizadores.current.push(id);
  }, []);

  return (
    <div
      role="application"
      aria-label="Cielo de luciérnagas: toca para que nazca una luz"
      onPointerDown={tocar}
      className="relative w-full flex-1 min-h-[22rem] rounded-card bg-[#0e2a3d]/60 overflow-hidden cursor-pointer touch-none select-none"
    >
      {luces.map((l) => (
        <span
          key={l.id}
          aria-hidden
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${l.x}%`,
            top: `${l.y}%`,
            width: l.t,
            height: l.t,
            marginLeft: -l.t / 2,
            marginTop: -l.t / 2,
            background: 'radial-gradient(circle, #fff7b8 0%, #ffe066 45%, rgba(255,224,102,0) 72%)',
            boxShadow: '0 0 36px 12px rgba(255,224,102,0.5)',
            animation: `${movimiento ? 'luciernaga' : 'luciernagaQuieta'} ${VIDA_MS}ms ease-out forwards`,
            ['--dx' as string]: `${l.dx}px`,
          }}
        />
      ))}
    </div>
  );
};
