import React from 'react';
import { PictogramaCard } from '@/features/aprender/components/PictogramaCard';
import type { CuentoPalabra } from '@/types';

export interface LectorDualViewProps {
  palabras: CuentoPalabra[];
  highlightedIndex?: number | null;
  onPalabraClick?: (palabra: CuentoPalabra, index: number) => void;
  className?: string;
}

export const LectorDualView: React.FC<LectorDualViewProps> = ({
  palabras,
  highlightedIndex = null,
  onPalabraClick,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-6 sm:gap-8 my-auto ${className}`}>
      {palabras.map((palabra, idx) => (
        <PictogramaCard
          key={idx}
          palabra={palabra}
          isHighlighted={highlightedIndex === idx}
          onClick={() => onPalabraClick && onPalabraClick(palabra, idx)}
        />
      ))}
    </div>
  );
};