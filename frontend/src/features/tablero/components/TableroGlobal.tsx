import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { TableroSAAC } from '@/features/tablero/components/TableroSAAC';
import { tableroDisponible } from '@/shared/config/tableroDisponible';
import { useTableroStore } from '@/shared/store/useTableroStore';

/** Único lugar donde se monta el tablero: así se abre igual desde cualquier vista y no se duplica. */
export const TableroGlobal: React.FC = () => {
  const { pathname } = useLocation();
  const abierto = useTableroStore((s) => s.abierto);
  const cerrar = useTableroStore((s) => s.cerrar);
  const disponible = tableroDisponible(pathname);

  // Si se sale a una vista sin tablero, se cierra: al volver no reaparece solo.
  useEffect(() => {
    if (abierto && !disponible) cerrar();
  }, [abierto, disponible, cerrar]);

  return abierto && disponible ? <TableroSAAC onCerrar={cerrar} /> : null;
};
