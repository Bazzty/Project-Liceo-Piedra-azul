import React from 'react';

const SIZES = { md: 'w-11 h-11 text-lg', lg: 'w-14 h-14 text-2xl' };

export const Avatar: React.FC<{ nombre: string; url?: string; size?: keyof typeof SIZES }> = ({
  nombre,
  url,
  size = 'md',
}) => (
  <div
    className={`${SIZES[size]} rounded-full bg-app border-2 border-borderCustom overflow-hidden flex items-center justify-center font-black text-brand shrink-0`}
  >
    {url ? <img src={url} alt={nombre} className="w-full h-full object-cover" /> : nombre.charAt(0).toUpperCase()}
  </div>
);
