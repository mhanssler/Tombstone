import { useMemo } from 'react';
import { Moon, Clock, Sparkles } from 'lucide-react';
import { getRecommendedWakeWindow, getAgeInMonths, formatTime } from '@/utils/time';

interface SleepPredictionProps {
  wakeMinutes: number;
  birthDate: string;
}

export function SleepPrediction({ wakeMinutes, birthDate }: SleepPredictionProps) {
  const prediction = useMemo(() => {
    const ageInMonths = getAgeInMonths(birthDate);
    const { min, max } = getRecommendedWakeWindow(ageInMonths);
    
    const now = Date.now();
    
    // Calculate sweet spot times (as timestamps)
    const minSleepTime = now + (min - wakeMinutes) * 60 * 1000;
    const maxSleepTime = now + (max - wakeMinutes) * 60 * 1000;
    
    // Optimal is in the middle of the range
    const optimalMinutes = (min + max) / 2;
    const optimalSleepTime = now + (optimalMinutes - wakeMinutes) * 60 * 1000;
    
    // Calculate remaining minutes until optimal
    const minutesUntilOptimal = Math.round(optimalMinutes - wakeMinutes);
    const minutesUntilMin = Math.round(min - wakeMinutes);
    const minutesUntilMax = Math.round(max - wakeMinutes);
    
    // Determine status
    let status: 'early' | 'sweet-spot' | 'overdue';
    if (wakeMinutes < min) {
      status = 'early';
    } else if (wakeMinutes <= max) {
      status = 'sweet-spot';
    } else {
      status = 'overdue';
    }
    
    // Calculate progress through wake window (0-100)
    const progress = Math.min(100, Math.max(0, ((wakeMinutes - 0) / max) * 100));
    
    return {
      ageInMonths,
      minWindow: min,
      maxWindow: max,
      minSleepTime,
      maxSleepTime,
      optimalSleepTime,
      minutesUntilOptimal,
      minutesUntilMin,
      minutesUntilMax,
      status,
      progress,
    };
  }, [wakeMinutes, birthDate]);

  const formatTimeRemaining = (minutes: number): string => {
    if (minutes <= 0) return 'Now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className={`rounded-2xl p-4 ${
      prediction.status === 'sweet-spot' 
        ? 'bg-gradient-to-br from-amber-600/20 to-gold-500/20 border border-amber-500/40' 
        : prediction.status === 'overdue'
        ? 'bg-gradient-to-br from-red-700/20 to-red-500/20 border border-red-500/40'
        : 'bg-sand-900/60 border border-leather-800/50'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className={`w-5 h-5 ${
            prediction.status === 'sweet-spot' 
              ? 'text-amber-400' 
              : prediction.status === 'overdue'
              ? 'text-red-400'
              : 'text-primary-400'
          }`} />
          <h3 className="font-semibold text-sand-100">Sleep Sweet Spot</h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          prediction.status === 'sweet-spot'
            ? 'bg-amber-500/30 text-amber-300'
            : prediction.status === 'overdue'
            ? 'bg-red-500/30 text-red-300'
            : 'bg-leather-800 text-sand-300'
        }`}>
          {prediction.status === 'sweet-spot' ? '🤠 It\'s high noon!' : 
           prediction.status === 'overdue' ? '⚠️ Overdue' : 
           'Upcoming'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 bg-leather-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              prediction.status === 'sweet-spot'
                ? 'bg-gradient-to-r from-amber-500 to-gold-400'
                : prediction.status === 'overdue'
                ? 'bg-gradient-to-r from-red-600 to-red-400'
                : 'bg-gradient-to-r from-primary-600 to-primary-400'
            }`}
            style={{ width: `${prediction.progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-sand-500 mt-1">
          <span>0m</span>
          <span className="text-amber-400">{prediction.minWindow}-{prediction.maxWindow}m</span>
          <span>{prediction.maxWindow}m+</span>
        </div>
      </div>

      {/* Time predictions */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-sand-950/50 rounded-xl p-3 border border-leather-900/30">
          <div className="flex items-center gap-2 mb-1">
            <Moon className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-sand-400">Best time</span>
          </div>
          <p className="text-lg font-bold text-sand-100">
            {prediction.status === 'overdue' 
              ? 'Now!' 
              : formatTime(prediction.optimalSleepTime)}
          </p>
          {prediction.status !== 'overdue' && (
            <p className="text-xs text-sand-500">
              in {formatTimeRemaining(prediction.minutesUntilOptimal)}
            </p>
          )}
        </div>

        <div className="bg-sand-950/50 rounded-xl p-3 border border-leather-900/30">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-lime-400" />
            <span className="text-xs text-sand-400">Sleep window</span>
          </div>
          <p className="text-lg font-bold text-sand-100">
            {formatTime(prediction.minSleepTime)} - {formatTime(prediction.maxSleepTime)}
          </p>
          <p className="text-xs text-sand-500">
            {prediction.maxWindow - prediction.minWindow}min range
          </p>
        </div>
      </div>

      {/* Tip based on status */}
      <div className={`mt-3 text-xs p-2 rounded-lg ${
        prediction.status === 'sweet-spot'
          ? 'bg-amber-500/10 text-amber-300'
          : prediction.status === 'overdue'
          ? 'bg-red-500/10 text-red-300'
          : 'bg-leather-800/50 text-sand-400'
      }`}>
        {prediction.status === 'sweet-spot' && (
          <>🤠 "You gonna do somethin'? Or just stand there and bleed?" — Start that sleep routine!</>
        )}
        {prediction.status === 'overdue' && (
          <>💤 Baby may be overtired. Look for sleepy cues and start wind-down now.</>
        )}
        {prediction.status === 'early' && (
          <>💡 Based on age ({Math.round(prediction.ageInMonths)}mo), optimal wake window is {prediction.minWindow}-{prediction.maxWindow} minutes.</>
        )}
      </div>
    </div>
  );
}
