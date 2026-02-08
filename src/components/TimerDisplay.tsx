import { useTimer } from '@/hooks/useTimer';
import { formatDuration } from '@/utils/time';
import { Moon, Play, Square } from 'lucide-react';

interface TimerDisplayProps {
  startTime?: number;
  isActive: boolean;
  type: 'sleep' | 'feeding';
  onStart: () => void;
  onStop: () => void;
  label?: string;
}

export function TimerDisplay({
  startTime,
  isActive,
  type,
  onStart,
  onStop,
  label,
}: TimerDisplayProps) {
  const { elapsed } = useTimer(isActive ? startTime : undefined);

  // Tombstone themed colors - deep night blues for sleep, warm sunset red for feeding
  const bgColor = type === 'sleep' ? 'bg-indigo-700' : 'bg-red-700';
  const bgColorLight = type === 'sleep' ? 'bg-indigo-900/40' : 'bg-red-900/40';
  const borderColor = type === 'sleep' ? 'border-indigo-600/50' : 'border-red-600/50';

  if (!isActive) {
    return (
      <button
        onClick={onStart}
        className={`w-full ${bgColorLight} rounded-2xl p-6 flex flex-col items-center gap-3 
          active:scale-[0.98] transition-transform border ${borderColor}`}
      >
        <div className={`w-16 h-16 rounded-full ${bgColor} flex items-center justify-center shadow-lg`}>
          {type === 'sleep' ? (
            <Moon className="w-8 h-8 text-white" />
          ) : (
            <Play className="w-8 h-8 text-white ml-1" />
          )}
        </div>
        <span className="text-lg font-medium text-sand-100">
          {label || (type === 'sleep' ? 'Start Sleep' : 'Start Feeding')}
        </span>
      </button>
    );
  }

  return (
    <div className={`w-full ${bgColor} rounded-2xl p-6 flex flex-col items-center gap-4 shadow-lg`}>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-gold-400 animate-pulse" />
        <span className="text-white/90 font-medium">
          {type === 'sleep' ? 'Sleeping' : 'Feeding'}
        </span>
      </div>
      
      <div className="text-5xl font-bold text-white tabular-nums">
        {formatDuration(elapsed)}
      </div>

      <button
        onClick={onStop}
        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 
          rounded-xl px-6 py-3 transition-colors active:scale-95"
      >
        <Square className="w-5 h-5 text-white fill-white" />
        <span className="text-white font-medium">Stop</span>
      </button>
    </div>
  );
}
