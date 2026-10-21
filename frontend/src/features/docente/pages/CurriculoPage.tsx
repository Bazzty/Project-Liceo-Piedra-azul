import React from 'react';
import { AdminLayout } from '@/features/docente/AdminLayout';
import { CurriculoPanel } from '@/features/docente/components/CurriculoPanel';

export const CurriculoPage: React.FC = () => (
  <AdminLayout activeSection="curriculo">
    <CurriculoPanel />
  </AdminLayout>
);
