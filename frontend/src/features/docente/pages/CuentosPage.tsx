import React from 'react';
import { AdminLayout } from '@/features/docente/AdminLayout';
import { GestionCuentos } from '@/features/docente/components/GestionCuentos';

export const CuentosPage: React.FC = () => (
  <AdminLayout activeSection="cuentos">
    <GestionCuentos />
  </AdminLayout>
);
