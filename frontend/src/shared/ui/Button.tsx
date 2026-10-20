import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Muestra un indicador y bloquea el botón mientras una acción está en curso. */
  loading?: boolean;
  fullWidth?: boolean;
}

const BASE =
  'inline-flex items-center justify-center gap-2 font-bold rounded-control transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-onBrand hover:bg-brand-hover shadow-card',
  secondary: 'bg-surface text-primary border-2 border-borderCustom hover:border-brand',
  accent: 'bg-accent text-onAccent hover:bg-accent-hover shadow-card',
  danger: 'bg-statusDanger text-onStatus hover:opacity-90 shadow-card',
  ghost: 'bg-transparent text-secondary hover:text-brand hover:bg-app',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm min-h-[2.25rem]',
  md: 'px-4 py-2 text-base min-h-[2.75rem]',
  lg: 'px-6 py-3 text-lg min-h-[3.25rem]',
  xl: 'px-8 py-4 text-xl min-h-[3.75rem]', // acción principal para niños
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    {...props}
  >
    {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
    {children}
  </button>
);
