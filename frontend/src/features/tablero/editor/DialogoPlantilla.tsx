import React, { useId, useState } from 'react';
import { Button, Modal } from '@/shared/ui';
import type { Tablero } from '@/types';

interface Props {
  modo: 'nueva' | 'renombrar';
  nombreInicial?: string;
  /** Las plantillas de donde se puede copiar. */
  plantillas: Tablero[];
  origenInicial?: string;
  /** Si se copia de algo que no es una plantilla (el tablero propio de un niño), se muestra su nombre y no se elige. */
  origenFijo?: string;
  alGuardar: (datos: { nombre: string; origenId: string }) => void;
  alCerrar: () => void;
}

const CAMPO = 'w-full min-h-12 rounded-control border border-borderStrong bg-surface px-3 text-base text-primary';

/** Crear una plantilla nueva (copiando otra) o ponerle otro nombre a una existente. */
export const DialogoPlantilla: React.FC<Props> = ({ modo, nombreInicial = '', plantillas, origenInicial, origenFijo, alGuardar, alCerrar }) => {
  const id = useId();
  const [nombre, setNombre] = useState(nombreInicial);
  const [origenId, setOrigenId] = useState(origenInicial ?? plantillas[0]?.id ?? '');
  const valido = nombre.trim().length > 0;

  return (
    <Modal isOpen onClose={alCerrar} title={modo === 'nueva' ? 'Nueva plantilla' : 'Cambiar el nombre de la plantilla'} size="sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valido) alGuardar({ nombre: nombre.trim(), origenId });
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-nombre`} className="text-sm font-semibold text-primary">
            Nombre de la plantilla
          </label>
          <input id={`${id}-nombre`} data-autofoco value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={40} placeholder="Ej.: Para el recreo" required className={CAMPO} />
        </div>

        {modo === 'nueva' && (
          <div className="flex flex-col gap-1">
            {origenFijo ? (
              <p className="text-sm text-secondary">
                Se copiará el tablero de <strong className="text-primary">{origenFijo}</strong>, con sus carpetas.
              </p>
            ) : (
              <>
                <label htmlFor={`${id}-origen`} className="text-sm font-semibold text-primary">
                  Copiar de
                </label>
                <select id={`${id}-origen`} value={origenId} onChange={(e) => setOrigenId(e.target.value)} className={CAMPO}>
                  {plantillas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-secondary">La plantilla nueva parte igual que esa y se edita aparte: no cambia la original.</p>
              </>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-borderCustom">
          <Button type="button" variant="secondary" onClick={alCerrar}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={!valido}>
            {modo === 'nueva' ? 'Crear plantilla' : 'Guardar nombre'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
