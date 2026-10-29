import React from 'react';

export type BadgeTone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral';

const TONES: Record<BadgeTone, string> = {
  ok: 'bg-statusOk-bg text-statusOk border-statusOk',
  warn: 'bg-statusWarn-bg text-statusWarn border-statusWarn',
  danger: 'bg-statusDanger-bg text-statusDanger border-statusDanger',
  info: 'bg-statusInfo-bg text-statusInfo border-statusInfo',
  neutral: 'bg-app text-secondary border-borderCustom',
};

export const Badge: React.FC<{ tone?: BadgeTone; children: React.ReactNode; className?: string }> = ({
  tone = 'neutral',
  children,
  className = '',
}) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-sm font-bold ${TONES[tone]} ${className}`}
  >
    {children}
  </span>
);
