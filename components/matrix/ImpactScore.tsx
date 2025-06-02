import React from 'react';
import clsx from 'clsx';

type Confidence = 'high' | 'medium' | 'low';

export interface ImpactScoreProps {
  /** Numeric impact score (‑5 → +5) */
  value: number;
  /** Analyst / AI confidence bucket */
  confidence: Confidence;
}

/**
 * Gradient tile that encodes value & confidence according to the migrated visual style.
 * Replace old .impact‑score divs with this component.
 */
export const ImpactScore: React.FC<ImpactScoreProps> = ({ value, confidence }) => {
  const tone = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';

  return (
    <div
      role="button"
      tabIndex={0}
      className={clsx(
        'w-12 h-12 rounded-lg flex items-center justify-center font-semibold transition-transform hover:scale-105',
        tone === 'positive' && 'bg-gradient-to-br from-success-400 to-success-600 text-white',
        tone === 'negative' && 'bg-gradient-to-br from-danger-400 to-danger-600 text-white',
        tone === 'neutral' && 'bg-neutral text-gray-700',
        confidence === 'high' && 'ring-2 ring-primary/40',
        confidence === 'medium' && 'ring-2 ring-dashed ring-gray-400/50',
        confidence === 'low' && 'ring-2 ring-dotted ring-gray-400/70'
      )}
    >
      {value}
    </div>
  );
};

ImpactScore.displayName = 'ImpactScore';

export default ImpactScore;
