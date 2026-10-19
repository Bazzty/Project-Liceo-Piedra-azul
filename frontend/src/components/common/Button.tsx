import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  size?: 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'lg',
  children,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-brand-hover active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md';

  const variantStyles = {
    primary: 'bg-brand text-white hover:bg-brand-hover',
    secondary: 'bg-surface text-primary border-2 border-borderCustom hover:bg-app',
    accent: 'bg-yellow-400 text-yellow-950 hover:bg-yellow-300 border-2 border-yellow-500',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  const sizeStyles = {
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[52px]',
    xl: 'px-8 py-4 text-xl min-h-[60px]', // Ideal para botones de acción principal en niños
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};