import React from 'react';

export interface OptionButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'role'> {
  selected: boolean;
}

/** Opción de un grupo de selección única. Usar dentro de un contenedor con role="radiogroup". */
export const OptionButton: React.FC<OptionButtonProps> = ({ selected, className = '', ...props }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    className={`rounded-control border-2 cursor-pointer transition-all ${
      selected ? 'border-brand bg-app text-primary' : 'border-borderCustom bg-surface text-secondary hover:border-brand'
    } ${className}`}
    {...props}
  />
);
