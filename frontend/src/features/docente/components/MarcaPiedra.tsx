import React from 'react';

/** Piedra facetada: marca del proyecto (Piedra Azul). */
export const MarcaPiedra: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden>
    <polygon points="16,2 29,10 25,28 7,28 3,10" fill="#5266eb" />
    <polygon points="16,2 29,10 16,16" fill="#9aa8f7" />
    <polygon points="3,10 16,16 7,28" fill="#3f53d6" />
    <polygon points="16,16 29,10 25,28 7,28" fill="#4a5ee0" fillOpacity="0.9" />
  </svg>
);
