import React from 'react';
import { AdminLayout } from '@/features/docente/AdminLayout';
import { Hoja } from '@/features/docente/components/Hoja';
import { NivelesPanel } from '@/features/docente/components/NivelesPanel';

export const CuentosPage: React.FC = () => (
  <AdminLayout activeSection="cuentos">
    <Hoja className="p-6">
      <NivelesPanel />
    </Hoja>
  </AdminLayout>
);
