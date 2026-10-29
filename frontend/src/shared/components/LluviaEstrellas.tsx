import React from 'react';
import { Star } from 'lucide-react';

const ESTRELLAS = Array.from({ length: 18 }, (_, i) => ({
  izquierda: `${(i * 37 + 7) % 96}%`,
  tamano: 20 + ((i * 7) % 5) * 7,
  retraso: `${(i % 9) * 0.22}s`,
  duracion: `${3 + (i % 4) * 0.5}s`,
  relleno: i % 3 === 0 ? 'fill-brand text-brand' : 'fill-accent text-accent',
}));

/** Celebración: estrellas que caen una sola vez. Sin animación (y sin estrellas) si se pide reducir el movimiento. */
export const LluviaEstrellas: React.FC = () => (
  <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden" aria-hidden>
    {ESTRELLAS.map((e, i) => (
      <Star
        key={i}
        className={`absolute top-0 opacity-0 animate-caer ${e.relleno}`}
        style={{ left: e.izquierda, width: e.tamano, height: e.tamano, animationDelay: e.retraso, animationDuration: e.duracion }}
      />
    ))}
  </div>
);
