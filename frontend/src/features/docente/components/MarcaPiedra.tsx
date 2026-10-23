import React from 'react';

/** Piedra facetada: marca del proyecto (Piedra Azul). */
export const MarcaPiedra: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden>
    <polygon points="16,2 29,10 25,28 7,28 3,10" fill="#0075de" />
    <polygon points="16,2 29,10 16,16" fill="#62aef0" />
    <polygon points="3,10 16,16 7,28" fill="#005bab" />
    <polygon points="16,16 29,10 25,28 7,28" fill="#097fe8" fillOpacity="0.9" />
  </svg>
);
