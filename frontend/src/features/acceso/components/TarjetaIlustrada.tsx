import React from 'react';

/** Dibujo de la tarjeta de acceso del niño: foto, nombre y las casillas del código. */
export const TarjetaIlustrada: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 200 126" className={className} role="img" aria-label="Tu tarjeta con tu foto y tu número">
    <rect x="3" y="3" width="194" height="120" rx="16" fill="var(--bg-card)" stroke="var(--border-strong)" strokeWidth="3" />
    <path d="M3 19a16 16 0 0 1 16-16h162a16 16 0 0 1 16 16v20H3z" fill="var(--brand-primary)" />
    <circle cx="22" cy="21" r="7" fill="var(--on-brand)" />
    <rect x="36" y="17" width="54" height="8" rx="4" fill="var(--on-brand)" />
    <circle cx="52" cy="80" r="26" fill="var(--accent)" stroke="var(--brand-primary)" strokeWidth="3" />
    <circle cx="43" cy="74" r="3.5" fill="var(--text-primary)" />
    <circle cx="61" cy="74" r="3.5" fill="var(--text-primary)" />
    <path d="M40 88q12 12 24 0" fill="none" stroke="var(--text-primary)" strokeWidth="3.5" strokeLinecap="round" />
    {[0, 1, 2, 3, 4].map((i) => (
      <rect key={i} x={92 + i * 20} y="68" width="16" height="26" rx="5" fill="var(--bg-app)" stroke="var(--brand-primary)" strokeWidth="2.5" />
    ))}
    <rect x="92" y="102" width="96" height="6" rx="3" fill="var(--border-color)" />
  </svg>
);
