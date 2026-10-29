import React, { useCallback, useEffect, useRef } from 'react';
import { MousePointerClick } from 'lucide-react';
import { useHablar } from '@/shared/hooks/useHablar';
import { useAjustesStore, type VelocidadBarrido } from '@/shared/store/useAjustesStore';

const MS_POR_VELOCIDAD: Record<VelocidadBarrido, number> = { lento: 2800, normal: 1800, rapido: 1100 };
const MARCA = 'data-barrido-activo';
const CANDIDATOS = 'button:not([disabled]), a[href], [role="button"]:not([aria-disabled="true"]), input:not([disabled]), select:not([disabled])';

/** Elementos que se pueden elegir ahora: los del diálogo abierto o, si no hay, los de toda la pantalla. */
const elementosElegibles = (raiz: HTMLElement): HTMLElement[] => {
  const dialogos = document.querySelectorAll<HTMLElement>('[role="dialog"]');
  const contenedor = dialogos.length > 0 ? dialogos[dialogos.length - 1] : raiz;
  const visibles = [...contenedor.querySelectorAll<HTMLElement>(CANDIDATOS)].filter((el) => {
    if (el.closest('[data-barrido-ignorar]') || el.closest('[aria-hidden="true"]')) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  // Primero lo principal de la pantalla; la barra de arriba (volver, calma, ajustes) al final
  const principal = visibles.filter((el) => el.closest('main') || contenedor !== raiz);
  return [...principal, ...visibles.filter((el) => !principal.includes(el))];
};

const nombreDe = (el: HTMLElement) => (el.getAttribute('aria-label') ?? el.textContent ?? '').replace(/\s+/g, ' ').trim();

/**
 * Control con un solo botón (barrido): las opciones de la pantalla se marcan una a una, se dice cuál es,
 * y con el botón grande (o la barra espaciadora, o Enter) se elige la marcada. Sirve a niños que no pueden
 * apuntar con precisión. Funciona en cualquier pantalla del niño sin tocar sus componentes.
 */
export const BarridoUnBoton: React.FC<{ raiz: React.RefObject<HTMLElement | null> }> = ({ raiz }) => {
  const velocidad = useAjustesStore((s) => s.barridoVelocidad);
  const hablar = useHablar();
  const indice = useRef(-1);
  const marcado = useRef<HTMLElement | null>(null);
  const pausaHasta = useRef(0);

  const desmarcar = useCallback(() => {
    marcado.current?.removeAttribute(MARCA);
    marcado.current = null;
  }, []);

  const avanzar = useCallback(() => {
    if (!raiz.current || Date.now() < pausaHasta.current) return;
    const lista = elementosElegibles(raiz.current);
    desmarcar();
    if (lista.length === 0) return;
    indice.current = (indice.current + 1) % lista.length;
    const el = lista[indice.current];
    el.setAttribute(MARCA, '1');
    marcado.current = el;
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const nombre = nombreDe(el);
    if (nombre) hablar(nombre);
  }, [raiz, hablar, desmarcar]);

  const elegir = useCallback(() => {
    const el = marcado.current;
    if (!el || !el.isConnected) return;
    // Tras elegir se espera un momento: la pantalla cambia y no conviene marcar de inmediato lo siguiente
    pausaHasta.current = Date.now() + 1500;
    el.click();
    desmarcar();
    indice.current = -1;
  }, [desmarcar]);

  useEffect(() => {
    const id = setInterval(avanzar, MS_POR_VELOCIDAD[velocidad]);
    return () => {
      clearInterval(id);
      desmarcar();
    };
  }, [avanzar, velocidad, desmarcar]);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        elegir();
      }
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [elegir]);

  return (
    <div data-barrido-ignorar className="fixed inset-x-0 bottom-4 z-[70] flex justify-start px-4 sm:px-8 pointer-events-none">
      <button
        type="button"
        onClick={elegir}
        aria-label="Elegir lo marcado"
        className="pointer-events-auto w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-accent text-onAccent border-8 border-borderStrong shadow-card flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
      >
        <MousePointerClick className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={2.2} aria-hidden />
      </button>
    </div>
  );
};
