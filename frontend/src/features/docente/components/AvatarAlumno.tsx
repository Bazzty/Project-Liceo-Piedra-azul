import React from 'react';

const TINTES = [
  'bg-tinte-azul text-tinte-azul-fuerte',
  'bg-tinte-ambar text-tinte-ambar-fuerte',
  'bg-tinte-coral text-tinte-coral-fuerte',
  'bg-tinte-verde text-tinte-verde-fuerte',
  'bg-tinte-moca text-tinte-moca-fuerte',
];

const TAMANOS = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-12 h-12 text-lg' };

/** Avatar del estudiante: su foto o la inicial sobre un tinte de color fijo para cada nombre. */
export const AvatarAlumno: React.FC<{ nombre: string; url?: string; size?: keyof typeof TAMANOS }> = ({
  nombre,
  url,
  size = 'md',
}) => {
  const tinte = TINTES[[...nombre].reduce((suma, c) => suma + c.charCodeAt(0), 0) % TINTES.length];
  return (
    <span
      aria-hidden
      className={`${TAMANOS[size]} ${tinte} rounded-full overflow-hidden flex items-center justify-center font-bold shrink-0`}
    >
      {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : nombre.charAt(0).toUpperCase()}
    </span>
  );
};
