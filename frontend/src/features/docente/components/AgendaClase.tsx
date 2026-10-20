import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useAjustesStore, type PasoAgenda } from '@/shared/store/useAjustesStore';
import { Card, SectionTitle } from '@/shared/ui';

const OPCIONES: { valor: PasoAgenda; nombre: string }[] = [
  { valor: 'leer', nombre: 'Leer' },
  { valor: 'hablar', nombre: 'Hablar' },
  { valor: 'estrellas', nombre: 'Estrellas' },
];

const CAMPO =
  'min-h-12 rounded-control border-2 border-borderStrong bg-surface px-3 text-base font-bold text-primary cursor-pointer focus-visible:border-brand';

/** La docente deja fija la agenda "Primero – Después" que ven los niños en su menú (da predictibilidad). */
export const AgendaClase: React.FC = () => {
  const agenda = useAjustesStore((s) => s.agenda);
  const setAgenda = useAjustesStore((s) => s.setAgenda);

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <div>
        <SectionTitle>Agenda visual de la clase</SectionTitle>
        <p className="text-sm font-semibold text-secondary mt-1">
          Los niños verán estos dos pasos arriba en su menú: primero uno, después el otro.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-extrabold text-secondary">
          Primero
          <select className={CAMPO} value={agenda[0]} onChange={(e) => setAgenda([e.target.value as PasoAgenda, agenda[1]])}>
            {OPCIONES.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.nombre}
              </option>
            ))}
          </select>
        </label>
        <ArrowRight className="w-6 h-6 text-secondary mb-3" aria-hidden />
        <label className="flex flex-col gap-1 text-sm font-extrabold text-secondary">
          Después
          <select className={CAMPO} value={agenda[1]} onChange={(e) => setAgenda([agenda[0], e.target.value as PasoAgenda])}>
            {OPCIONES.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Card>
  );
};
