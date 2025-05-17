/**
 * Maps confidence score to a tier category
 * @param score - Confidence score between 0 and 1
 * @returns A string tier: 'high', 'med', 'low', or 'warn'
 */
export function confidenceTier(score: number): 'high' | 'med' | 'low' | 'warn' {
  if (score >= 0.85) return 'high';
  if (score >= 0.65) return 'med';
  if (score >= 0.50) return 'low';
  return 'warn';
}

interface ConfidenceBadgeProps {
  score: number;
}

/**
 * Component that displays a confidence score with appropriate color coding
 * 
 * Confidence tiers:
 * - High (≥ 0.85): Emerald
 * - Medium (≥ 0.65): Blue
 * - Low (≥ 0.50): Amber
 * - Warning (< 0.50): Red
 */
export default function ConfidenceBadge({ score }: ConfidenceBadgeProps) {
  const tier = confidenceTier(score);
  
  // Map tier to the appropriate Tailwind CSS classes
  const tierClasses = {
    high: 'bg-emerald-600/10 text-emerald-700',
    med: 'bg-blue-600/10 text-blue-700',
    low: 'bg-amber-600/10 text-amber-700',
    warn: 'bg-red-600/10 text-red-700',
  };
  
  // Combine classes manually instead of using clsx
  const classes = `inline-flex items-center gap-1 px-2 rounded text-xs font-semibold ${tierClasses[tier]}`;
  
  return (
    <span
      className={classes}
      title={`LLM confidence ${(score * 100).toFixed(0)}%`}
      data-testid="confidence-badge"
    >
      {(score * 100).toFixed(0)}%
    </span>
  );
}
