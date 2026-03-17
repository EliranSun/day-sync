import { calculateMatchPercentage } from '../lib/match';
import type { TimeBlock } from '../types';

interface MatchBadgeProps {
  expected: TimeBlock[];
  reality: TimeBlock[];
}

export function MatchBadge({ expected, reality }: MatchBadgeProps) {
  const percentage = calculateMatchPercentage(expected, reality);

  if (percentage === null || reality.length === 0) return null;

  const color =
    percentage >= 80
      ? 'bg-green-500'
      : percentage >= 50
        ? 'bg-yellow-500'
        : 'bg-red-500';

  const textColor =
    percentage >= 80
      ? 'text-green-50'
      : percentage >= 50
        ? 'text-yellow-50'
        : 'text-red-50';

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
      <div className={`${color} ${textColor} px-3 py-1.5 rounded-full shadow-lg text-sm font-semibold flex items-center gap-1.5`}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="7" cy="7" r="6" />
          <path d="M4.5 7l1.5 1.5 3-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {percentage}% match
      </div>
    </div>
  );
}
