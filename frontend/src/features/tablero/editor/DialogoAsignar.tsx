import React, { useState } from 'react';
import { Button, Modal } from '@/shared/ui';
import type { Alumno, Tablero } from '@/types';

interface Props {
  plantillas: Tablero[];
  alumnos: Alumno[];
  /** Los niños que ya tienen un tablero propio: se les avisa que se reemplaza. */
  conTablero: Set<string>;
  plantillaInicial: string;
  alumnosIniciales: string[];
  alAsignar: (plantillaId: string, alumnoIds: string[]) => void;
  alCerrar: () => void;
}

const nombreDe = (a: Alumno) => `${a.nombre} ${a.apellido}`.trim();

/** Elegir una plantilla y los niños que la reciben. Cada niño recibe su propia copia, que luego se puede editar solo para él o ella. */
export const DialogoAsignar: React.FC<Props> = ({ plantillas, alumnos, conTablero, plantillaInicial, alumnosIniciales, alAsignar, alCerrar }) => {
  const [plantillaId, setPlantillaId] = useState(plantillaInicial);
  const [marcados, setMarcados] = useState<Set<string>>(new Set(alumnosIniciales));
  const ids = alumnos.flatMap((a) => (a.id ? [a.id] : []));
  const todos = ids.length > 0 && ids.every((id) => marcados.has(id));
  const reemplazan = ids.filter((id) => marcados.has(id) && conTablero.has(id)).length;

  const alternar = (id: string) =>
    setMarcados((actual) => {
      const nuevo = new Set(actual);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });

  return (
    <Modal isOpen onClose={alCerrar} title="Asignar plantilla a niños" size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (marcados.size > 0) alAsignar(plantillaId, [...marcados]);
        }}
        className="flex flex-col gap-5"
      >
        <fieldset className="flex flex-col gap-2 min-w-0">
          <legend className="text-sm font-semibold text-primary mb-1">Plantilla</legend>
          {plantillas.map((p) => (
            <label key={p.id} className="flex items-center gap-3 min-h-11 cursor-pointer">
              <input type="radio" name="plantilla" checked={plantillaId === p.id} onChange={() => setPlantillaId(p.id)} className="w-5 h-5 accent-[var(--brand)]" />
              <span className="text-base text-primary">{p.nombre}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="flex flex-col gap-2 min-w-0">
          <legend className="text-sm font-semibold text-primary mb-1">Niños</legend>
          <label className="flex items-center gap-3 min-h-11 cursor-pointer font-semibold">
            <input type="checkbox" checked={todos} onChange={() => setMarcados(todos ? new Set() : new Set(ids))} className="w-5 h-5 accent-[var(--brand)]" />
            <span className="text-base text-primary">Todos</span>
          </label>
          {alumnos.map((a) => (
            <label key={a.id} className="flex items-center gap-3 min-h-11 cursor-pointer">
              <input type="checkbox" checked={marcados.has(a.id ?? '')} onChange={() => alternar(a.id ?? '')} className="w-5 h-5 accent-[var(--brand)]" />
              <span className="text-base text-primary">
                {nombreDe(a)}
                {a.id && conTablero.has(a.id) && <span className="text-sm text-secondary"> · ya tiene tablero propio</span>}
              </span>
            </label>
          ))}
        </fieldset>

        {reemplazan > 0 && (
          <p role="status" className="text-sm text-primary rounded-control border border-statusWarn bg-app px-3 py-2">
            {reemplazan === 1 ? 'Un niño ya tiene' : `${reemplazan} niños ya tienen`} tablero propio: se reemplazará por esta plantilla. Después podrás deshacerlo.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-borderCustom">
          <Button type="button" variant="secondary" onClick={alCerrar}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={marcados.size === 0}>
            Asignar
          </Button>
        </div>
      </form>
    </Modal>
  );
};
