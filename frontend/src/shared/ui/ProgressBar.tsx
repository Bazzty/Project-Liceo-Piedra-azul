import React from 'react';

export interface ProgressBarProps {
  value: number; // 0-100
  label: string; // lectura para lectores de pantalla
  size?: 'sm' | 'md';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, label, size = 'md', className = '' }) => {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`${size === 'sm' ? 'h-2.5' : 'h-3'} rounded-full bg-borderCustom overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="h-full bg-brand rounded-full transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  );
};
