import React from 'react';

/**
 * Fondo decorativo: nubes arriba y colinas abajo. Usa los colores de la paleta activa,
 * así se adapta solo a cada tema. El contenedor padre debe ser relative con overflow-hidden.
 */
export const FondoPaisaje: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none" aria-hidden>
    <svg viewBox="0 0 1440 220" preserveAspectRatio="none" className="absolute top-0 left-0 w-full h-[22vh] opacity-80">
      <g fill="var(--bg-card)" fillOpacity="0.75">
        <g className="animate-nube" style={{ animationDuration: '34s' }}>
          <ellipse cx="210" cy="80" rx="95" ry="26" />
          <ellipse cx="270" cy="62" rx="62" ry="30" />
          <ellipse cx="170" cy="66" rx="52" ry="24" />
        </g>
        <g className="animate-nube" style={{ animationDuration: '46s', animationDelay: '-12s' }}>
          <ellipse cx="1130" cy="120" rx="110" ry="28" />
          <ellipse cx="1205" cy="98" rx="68" ry="32" />
          <ellipse cx="1065" cy="104" rx="55" ry="24" />
        </g>
        <g className="animate-nube" style={{ animationDuration: '28s', animationDelay: '-6s' }}>
          <ellipse cx="690" cy="40" rx="70" ry="18" />
          <ellipse cx="735" cy="28" rx="44" ry="20" />
        </g>
      </g>
    </svg>
    <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-[34vh]">
      <path
        d="M0 150 C 220 60 420 70 640 140 C 860 210 1080 90 1440 130 L1440 320 L0 320 Z"
        fill="var(--brand-primary)"
        fillOpacity="0.2"
      />
      <path
        d="M0 210 C 260 130 520 170 760 215 C 1000 260 1220 170 1440 205 L1440 320 L0 320 Z"
        fill="var(--status-ok)"
        fillOpacity="0.32"
      />
      <path
        d="M0 265 C 300 225 560 275 840 258 C 1100 242 1280 270 1440 255 L1440 320 L0 320 Z"
        fill="var(--status-ok)"
        fillOpacity="0.5"
      />
    </svg>
  </div>
);
