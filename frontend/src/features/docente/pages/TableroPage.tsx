import React from 'react';
import { AdminLayout } from '@/features/docente/AdminLayout';
import { EditorTablero } from '@/features/tablero/editor/EditorTablero';

export const TableroPage: React.FC = () => (
  <AdminLayout activeSection="tablero">
    <EditorTablero />
  </AdminLayout>
);
