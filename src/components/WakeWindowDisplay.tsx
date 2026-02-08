import { formatDurationShort, getRecommendedWakeWindow, getAgeInMonths } from '@/utils/time';

interface WakeWindowDisplayProps {
  wakeMinutes: number | null;
  childBirthDate?: string;
}

export function WakeWindowDisplay({ wakeMinutes, childBirthDate }: WakeWindowDisplayProps) {
  if (wakeMinutes === null) {
    return (
      <div className="bg-sand-900/60 rounded-2xl p-4 border border-leather-800/50">
        <div className="text-sm text-sand-400 mb-1">Wake Window</div>
        <div className="text-sand-500">No sleep logged yet</div>
      </div>
    );
  }

  // Get recommended wake window based on age
  let recommendation = { min: 60, max: 120 }; // default
  if (childBirthDate) {
    const ageMonths = getAgeInMonths(childBirthDate);
    recommendation = getRecommendedWakeWindow(ageMonths);
  }

  // Calculate progress towards recommended window
  const progress = Math.min((wakeMinutes / recommendation.max) * 100, 100);
  const isOverdue = wakeMinutes > recommendation.max;
  const isInWindow = wakeMinutes >= recommendation.min && wakeMinutes <= recommendation.max;

  let statusColor = 'bg-lime-600'; // under min
  let textColor = 'text-lime-400';
  let statusText = 'Not ready for sleep';

  if (isInWindow) {
    statusColor = 'bg-amber-600';
    textColor = 'text-amber-400';
    statusText = 'Good time for sleep';
  } else if (isOverdue) {
    statusColor = 'bg-red-600';
    textColor = 'text-red-400';
    statusText = 'May be overtired';
  }

  return (
    <div className="bg-sand-900/60 rounded-2xl p-4 border border-leather-800/50">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-sand-400">Awake for</div>
        <div className={`text-xs px-2 py-1 rounded-full ${statusColor}/20 ${textColor}`}>
          {statusText}
        </div>
      </div>
      
      <div className="text-3xl font-bold text-sand-100 mb-3">
        {formatDurationShort(wakeMinutes * 60 * 1000)}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-leather-800 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${statusColor} transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-sand-500">
        <span>{formatDurationShort(recommendation.min * 60 * 1000)} min</span>
        <span>{formatDurationShort(recommendation.max * 60 * 1000)} max</span>
      </div>
    </div>
  );
}
