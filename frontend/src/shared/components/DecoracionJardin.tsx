import React from 'react';

const Arbol: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 80 120" className={className} aria-hidden>
    <rect x="35" y="70" width="10" height="46" rx="4" fill="var(--text-secondary)" fillOpacity="0.55" />
    <circle cx="40" cy="48" r="34" fill="var(--status-ok)" fillOpacity="0.85" />
    <circle cx="24" cy="62" r="20" fill="var(--status-ok)" fillOpacity="0.85" />
    <circle cx="58" cy="60" r="22" fill="var(--status-ok)" fillOpacity="0.85" />
    <circle cx="48" cy="36" r="6" fill="var(--accent)" />
    <circle cx="28" cy="52" r="5" fill="var(--accent)" />
    <circle cx="56" cy="62" r="5" fill="var(--accent)" />
  </svg>
);

const Flor: React.FC<{ color: string; className?: string }> = ({ color, className = '' }) => (
  <svg viewBox="0 0 30 50" className={className} aria-hidden>
    <path d="M15 22 V48" stroke="var(--status-ok)" strokeWidth="3" strokeLinecap="round" />
    <g fill={color}>
      <circle cx="15" cy="9" r="6" />
      <circle cx="15" cy="21" r="6" />
      <circle cx="9" cy="15" r="6" />
      <circle cx="21" cy="15" r="6" />
    </g>
    <circle cx="15" cy="15" r="5" fill="var(--accent)" />
  </svg>
);

const Mariposa: React.FC<{ className?: string; color: string }> = ({ className = '', color }) => (
  <svg viewBox="0 0 40 30" className={className} aria-hidden>
    <ellipse cx="12" cy="11" rx="10" ry="9" fill={color} />
    <ellipse cx="28" cy="11" rx="10" ry="9" fill={color} />
    <ellipse cx="13" cy="22" rx="6" ry="6" fill={color} fillOpacity="0.8" />
    <ellipse cx="27" cy="22" rx="6" ry="6" fill={color} fillOpacity="0.8" />
    <rect x="19" y="6" width="2.5" height="20" rx="1.2" fill="var(--text-primary)" />
  </svg>
);

/** Sol, árboles, flores y mariposas del menú del estudiante. Solo decoración (no se puede tocar). */
export const DecoracionJardin: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
    {/* Sol */}
    <svg viewBox="0 0 120 120" className="absolute top-20 left-[3%] w-20 sm:w-28 lg:w-32 hidden sm:block">
      <g className="origin-center animate-rotar" style={{ transformBox: 'fill-box' }}>
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x="57" y="2" width="6" height="18" rx="3" fill="var(--accent)" transform={`rotate(${i * 30} 60 60)`} />
        ))}
      </g>
      <circle cx="60" cy="60" r="28" fill="var(--accent)" />
      <circle cx="50" cy="56" r="3" fill="var(--text-primary)" />
      <circle cx="70" cy="56" r="3" fill="var(--text-primary)" />
      <path d="M50 68q10 9 20 0" fill="none" stroke="var(--text-primary)" strokeWidth="3" strokeLinecap="round" />
    </svg>

    {/* Árboles */}
    <Arbol className="absolute bottom-[7vh] left-[2%] w-20 sm:w-28 lg:w-36" />
    <Arbol className="absolute bottom-[9vh] left-[11%] w-14 sm:w-20 lg:w-24 hidden sm:block" />
    <Arbol className="absolute bottom-[8vh] right-[3%] w-20 sm:w-28 lg:w-36" />

    {/* Flores */}
    <Flor color="var(--btn-colores-bg)" className="absolute bottom-[3vh] left-[22%] w-7 sm:w-9" />
    <Flor color="var(--status-danger)" className="absolute bottom-[2vh] left-[28%] w-6 sm:w-8" />
    <Flor color="var(--accent)" className="absolute bottom-[3.5vh] right-[24%] w-7 sm:w-9" />
    <Flor color="var(--btn-colores-bg)" className="absolute bottom-[2vh] right-[30%] w-6 sm:w-8 hidden sm:block" />
    <Flor color="var(--status-danger)" className="absolute bottom-[3vh] left-[46%] w-6 sm:w-8 hidden lg:block" />

    {/* Mariposas */}
    <Mariposa color="var(--btn-colores-bg)" className="absolute top-[34%] left-[8%] w-8 sm:w-10 animate-flotar" />
    <Mariposa color="var(--status-danger)" className="absolute top-[28%] right-[7%] w-8 sm:w-10 animate-flotar" />
  </div>
);
