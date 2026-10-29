import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 'surface' = tarjeta principal; 'inset' = bloque secundario dentro de otra tarjeta. */
  tone?: 'surface' | 'inset';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const TONES = {
  surface: 'bg-surface shadow-card',
  inset: 'bg-app',
};

const PADDINGS = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' };

export const Card: React.FC<CardProps> = ({
  tone = 'surface',
  padding = 'md',
  className = '',
  ...props
}) => (
  <div
    className={`border-2 border-borderCustom rounded-card ${TONES[tone]} ${PADDINGS[padding]} ${className}`}
    {...props}
  />
);
