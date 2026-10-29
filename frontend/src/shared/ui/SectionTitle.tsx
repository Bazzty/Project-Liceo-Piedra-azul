import React from 'react';

export const PageTitle: React.FC<{ title: string; description?: string; actions?: React.ReactNode }> = ({
  title,
  description,
  actions,
}) => (
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 className="text-2xl font-black text-primary">{title}</h2>
      {description && <p className="text-sm font-semibold text-secondary">{description}</p>}
    </div>
    {actions}
  </div>
);

export const SectionTitle: React.FC<{ icon?: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <h3 className="text-lg font-black text-primary inline-flex items-center gap-2">
    {icon}
    {children}
  </h3>
);

export const EmptyState: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-secondary font-semibold">{children}</p>
);
