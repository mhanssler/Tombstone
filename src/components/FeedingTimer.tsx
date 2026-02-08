import { useState } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { formatDuration, formatRelativeTime } from '@/utils/time';
import { Play, Square, Baby, X, Check, ArrowRight } from 'lucide-react';
import type { FeedingSession } from '@/types';

interface FeedingTimerProps {
  activeFeeding?: FeedingSession;
  lastFeeding?: FeedingSession;
  onStartBreast: (side: 'left' | 'right') => void;
  onStartBottle: () => void;
  onStop: (amount?: number, vitaminD?: boolean) => void;
  onCancel: () => void;
}

export function FeedingTimer({
  activeFeeding,
  lastFeeding,
  onStartBreast,
  onStartBottle,
  onStop,
  onCancel,
}: FeedingTimerProps) {
  const { elapsed } = useTimer(activeFeeding?.startTime);
  const [showBottleInput, setShowBottleInput] = useState(false);
  const [bottleAmount, setBottleAmount] = useState('');
  const [vitaminD, setVitaminD] = useState(false);

  const isBreast = activeFeeding?.type === 'breast_left' || activeFeeding?.type === 'breast_right';
  const isBottle = activeFeeding?.type === 'bottle';
  const side = activeFeeding?.type === 'breast_left' ? 'Left' : activeFeeding?.type === 'breast_right' ? 'Right' : '';

  // Determine which side to suggest based on last feeding
  const lastBreastSide = lastFeeding?.type === 'breast_left' ? 'left' : lastFeeding?.type === 'breast_right' ? 'right' : null;
  const suggestedSide = lastBreastSide === 'left' ? 'right' : lastBreastSide === 'right' ? 'left' : null;

  // Handle bottle amount submission
  const handleBottleSubmit = () => {
    const amount = parseFloat(bottleAmount);
    onStop(isNaN(amount) ? undefined : amount, vitaminD);
    setBottleAmount('');
    setShowBottleInput(false);
    setVitaminD(false);
  };

  // Start bottle with optional amount input
  const handleStartBottle = () => {
    setShowBottleInput(true);
  };

  const handleConfirmBottleStart = () => {
    onStartBottle();
    setShowBottleInput(false);
    setBottleAmount('');
  };

  // Bottle amount input dialog
  if (showBottleInput && !activeFeeding) {
    return (
      <div className="w-full bg-red-900/40 rounded-2xl p-6 border border-red-600/50">
        <h3 className="text-lg font-semibold text-sand-100 text-center mb-4">Start Bottle Feeding</h3>
        <p className="text-sand-400 text-sm text-center mb-4">
          You can enter the amount now or after feeding
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBottleInput(false)}
            className="flex-1 py-3 px-4 rounded-xl bg-leather-800 text-sand-100 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmBottleStart}
            className="flex-1 py-3 px-4 rounded-xl bg-red-700 text-white font-medium flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Start Timer
          </button>
        </div>
      </div>
    );
  }

  // Not active - show start options
  if (!activeFeeding) {
    return (
      <div className="w-full bg-red-900/40 rounded-2xl p-4 border border-red-600/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-sand-400">Start Feeding Timer</h3>
          {lastFeeding?.endTime && (
            <span className="text-xs text-sand-500">
              Last: {formatRelativeTime(lastFeeding.endTime)}
            </span>
          )}
        </div>

        {/* Suggested side indicator */}
        {suggestedSide && (
          <div className="mb-3 flex items-center gap-2 bg-red-700/30 rounded-lg px-3 py-2">
            <ArrowRight className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-300">
              Start with <strong>{suggestedSide === 'left' ? 'Left' : 'Right'}</strong> breast
              <span className="text-red-400/70"> (last was {lastBreastSide})</span>
            </span>
          </div>
        )}
        
        {/* Breast feeding options */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={() => onStartBreast('left')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-red-700/50 
              active:scale-[0.98] transition-all border ${
                suggestedSide === 'left' 
                  ? 'bg-red-700/50 border-red-400 ring-2 ring-red-400/50' 
                  : 'bg-red-700/30 border-red-600/40'
              }`}
          >
            <div className="w-12 h-12 rounded-full bg-red-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="text-sand-100 font-medium">Left Breast</span>
            {suggestedSide === 'left' && (
              <span className="text-xs text-red-300">Suggested</span>
            )}
          </button>
          
          <button
            onClick={() => onStartBreast('right')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-red-700/50 
              active:scale-[0.98] transition-all border ${
                suggestedSide === 'right' 
                  ? 'bg-red-700/50 border-red-400 ring-2 ring-red-400/50' 
                  : 'bg-red-700/30 border-red-600/40'
              }`}
          >
            <div className="w-12 h-12 rounded-full bg-red-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <span className="text-sand-100 font-medium">Right Breast</span>
            {suggestedSide === 'right' && (
              <span className="text-xs text-red-300">Suggested</span>
            )}
          </button>
        </div>
        
        {/* Bottle option */}
        <button
          onClick={handleStartBottle}
          className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-red-700/30 hover:bg-red-700/50 
            active:scale-[0.98] transition-all border border-red-600/40"
        >
          <div className="w-10 h-10 rounded-full bg-red-700 flex items-center justify-center">
            <Baby className="w-5 h-5 text-white" />
          </div>
          <span className="text-sand-100 font-medium">Bottle</span>
        </button>
      </div>
    );
  }

  // Active feeding - show timer
  return (
    <div className="w-full bg-red-700 rounded-2xl p-6 shadow-lg">
      <div className="flex flex-col items-center gap-4">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gold-400 animate-pulse" />
          <span className="text-white/90 font-medium">
            {isBreast ? `${side} Breast` : 'Bottle'} Feeding
          </span>
        </div>
        
        {/* Timer */}
        <div className="text-5xl font-bold text-white tabular-nums">
          {formatDuration(elapsed)}
        </div>

        {/* Stop controls */}
        {isBottle ? (
          // Bottle - show amount input when stopping
          <div className="w-full space-y-3">
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Amount (ml or oz)"
                value={bottleAmount}
                onChange={(e) => setBottleAmount(e.target.value)}
                className="flex-1 bg-transparent text-white text-center text-lg font-medium placeholder:text-white/50 outline-none"
              />
            </div>
            <button
              onClick={() => setVitaminD(!vitaminD)}
              className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-medium transition-colors ${
                vitaminD
                  ? 'bg-yellow-500/30 border border-yellow-400 text-yellow-200'
                  : 'bg-white/10 border border-white/20 text-white/70'
              }`}
            >
              <span className="text-lg">💊</span>
              <span>Vitamin D {vitaminD ? '✓' : ''}</span>
            </button>
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
                onClick={handleBottleSubmit}
                className="flex-1 flex items-center justify-center gap-2 bg-white/30 hover:bg-white/40 
                  rounded-xl px-4 py-3 transition-colors active:scale-95"
              >
                <Check className="w-5 h-5 text-white" />
                <span className="text-white font-medium">Done</span>
              </button>
            </div>
          </div>
        ) : (
          // Breast - simple stop button
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 
                rounded-xl px-6 py-3 transition-colors active:scale-95"
            >
              <X className="w-5 h-5 text-white" />
              <span className="text-white font-medium">Cancel</span>
            </button>
            <button
              onClick={() => onStop()}
              className="flex items-center gap-2 bg-white/30 hover:bg-white/40 
                rounded-xl px-6 py-3 transition-colors active:scale-95"
            >
              <Square className="w-5 h-5 text-white fill-white" />
              <span className="text-white font-medium">Stop</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
