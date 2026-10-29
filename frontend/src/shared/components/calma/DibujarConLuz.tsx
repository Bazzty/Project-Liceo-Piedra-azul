import React, { useEffect, useRef } from 'react';

/** Dibujar con luz: el dedo deja una estela de colores suaves que se desvanece sola. */
export const DibujarConLuz: React.FC = () => {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const trazo = useRef<{ x: number; y: number } | null>(null);
  const tono = useRef(200);

  useEffect(() => {
    const el = lienzo.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;

    const ajustar = () => {
      const { width, height } = el.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      el.width = Math.max(1, Math.round(width * d));
      el.height = Math.max(1, Math.round(height * d));
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    ajustar();
    const observador = new ResizeObserver(ajustar);
    observador.observe(el);

    // Cada cuadro borra un poquito: así la estela se apaga despacio
    let cuadro = 0;
    const apagar = () => {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.035)';
      ctx.fillRect(0, 0, el.width, el.height);
      ctx.restore();
      cuadro = requestAnimationFrame(apagar);
    };
    cuadro = requestAnimationFrame(apagar);

    return () => {
      cancelAnimationFrame(cuadro);
      observador.disconnect();
    };
  }, []);

  const punto = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const caja = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - caja.left, y: e.clientY - caja.top };
  };

  const empezar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    trazo.current = punto(e);
  };

  const mover = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = e.currentTarget.getContext('2d');
    const desde = trazo.current;
    if (!ctx || !desde) return;
    const hasta = punto(e);
    tono.current = (tono.current + 1.5) % 360;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = `hsl(${tono.current} 85% 78%)`;
    ctx.shadowColor = `hsl(${tono.current} 90% 70%)`;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(desde.x, desde.y);
    ctx.lineTo(hasta.x, hasta.y);
    ctx.stroke();
    trazo.current = hasta;
  };

  return (
    <canvas
      ref={lienzo}
      role="img"
      aria-label="Lienzo para dibujar con luz con el dedo"
      onPointerDown={empezar}
      onPointerMove={mover}
      onPointerUp={() => (trazo.current = null)}
      onPointerCancel={() => (trazo.current = null)}
      className="w-full flex-1 min-h-[22rem] rounded-card bg-[#0e2a3d]/60 touch-none cursor-crosshair"
    />
  );
};
