import React from 'react';
import { AdminLayout } from '@/features/docente/AdminLayout';
import { ActividadesPanel } from '@/features/docente/components/ActividadesPanel';

export const ActividadesPage: React.FC = () => (
  <AdminLayout activeSection="actividades">
    <ActividadesPanel />
  </AdminLayout>
);
