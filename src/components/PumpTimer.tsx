import { useState } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { formatDuration, formatRelativeTime } from '@/utils/time';
import { Play, X, Check } from 'lucide-react';
import type { PumpSession } from '@/types';

interface PumpTimerProps {
  activePump?: PumpSession;
  lastPump?: PumpSession;
  onStart: () => void;
  onStop: (amount?: number) => void;
  onCancel: () => void;
}

export function PumpTimer({
  activePump,
  lastPump,
  onStart,
  onStop,
  onCancel,
}: PumpTimerProps) {
  const { elapsed } = useTimer(activePump?.startTime);
  const [pumpAmount, setPumpAmount] = useState('');

  const handleSubmit = () => {
    const amount = parseFloat(pumpAmount);
    onStop(isNaN(amount) ? undefined : amount);
    setPumpAmount('');
  };

  // Not active - show start button
  if (!activePump) {
    return (
      <div className="w-full bg-purple-900/40 rounded-2xl p-4 border border-purple-600/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-sand-400">Pump Timer</h3>
          {lastPump?.endTime && (
            <span className="text-xs text-sand-500">
              Last: {formatRelativeTime(lastPump.endTime)}
              {lastPump.amount ? ` (${lastPump.amount}ml)` : ''}
            </span>
          )}
        </div>

        <button
          onClick={onStart}
          className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-purple-700/30 hover:bg-purple-700/50 
            active:scale-[0.98] transition-all border border-purple-600/40"
        >
          <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center">
            <Play className="w-5 h-5 text-white ml-0.5" />
          </div>
          <span className="text-sand-100 font-medium">Start Pump</span>
        </button>
      </div>
    );
  }

  // Active - show timer with amount input
  return (
    <div className="w-full bg-purple-700 rounded-2xl p-6 shadow-lg">
      <div className="flex flex-col items-center gap-4">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-300 animate-pulse" />
          <span className="text-white/90 font-medium">Pumping</span>
        </div>

        {/* Timer */}
        <div className="text-5xl font-bold text-white tabular-nums">
          {formatDuration(elapsed)}
        </div>

        {/* Amount input & controls */}
        <div className="w-full space-y-3">
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
            <input
              type="number"
              inputMode="decimal"
              placeholder="Amount (ml)"
              value={pumpAmount}
              onChange={(e) => setPumpAmount(e.target.value)}
              className="flex-1 bg-transparent text-white text-center text-lg font-medium placeholder:text-white/50 outline-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 
                rounded-xl px-4 py-3 transition-colors active:scale-95"
            >
              <X className="w-5 h-5 text-white" />
              <span className="text-white font-medium">Cancel</span>
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 bg-white/30 hover:bg-white/40 
                rounded-xl px-4 py-3 transition-colors active:scale-95"
            >
              <Check className="w-5 h-5 text-white" />
              <span className="text-white font-medium">Done</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
