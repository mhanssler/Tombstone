import { useEffect, useState } from 'react';
import { Droplet, Circle } from 'lucide-react';
import {
  TimerDisplay,
  QuickLogButton,
  WakeWindowDisplay,
  DaySummaryCard,
  ActivityCard,
  OwletStatusCard,
} from '@/components';
import { SleepPrediction } from '@/components/SleepPrediction';
import { FeedingTimer } from '@/components/FeedingTimer';
import { PumpTimer } from '@/components/PumpTimer';
import {
  useCurrentChild,
  useActiveSleep,
  useActiveFeeding,
  useActivePump,
  useLastFeeding,
  useLastPump,
  useWakeWindow,
  useTodaySummary,
  useLastPoop,
  useLastPee,
  useOwletReadingsForRange,
  useLatestOwletReading,
} from '@/hooks';
import {
  startSleep,
  stopSleep,
  startFeeding,
  stopFeeding,
  cancelFeeding,
  startPump,
  stopPump,
  cancelPump,
  logDiaper,
  deleteSleepSession,
  deleteFeedingSession,
  deletePumpSession,
  deleteDiaperChange,
} from '@/database/queries';
import { getOrCreateDefaultChild } from '@/database/db';
import { classifySleepType } from '@/utils/time';
import type { DiaperType, SleepSession, FeedingSession, PumpSession, DiaperChange } from '@/types';

export function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const child = useCurrentChild();
  const activeSleep = useActiveSleep();
  const activeFeeding = useActiveFeeding();
  const activePump = useActivePump();
  const lastFeeding = useLastFeeding(child?.id);
  const lastPump = useLastPump(child?.id);
  const wakeMinutes = useWakeWindow(child?.id);
  const summary = useTodaySummary(child?.id);
  const lastPoop = useLastPoop(child?.id);
  const lastPee = useLastPee(child?.id);
  const latestOwlet = useLatestOwletReading(child?.id);
  const owletTrend = useOwletReadingsForRange(
    child?.id,
    nowMs - 60 * 60 * 1000,
    nowMs,
    240
  );

  // Initialize child on first load
  useEffect(() => {
    async function init() {
      try {
        await getOrCreateDefaultChild('Baby');
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize');
        setIsLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const handleStartSleep = async () => {
    if (!child) return;
    const sleepType = classifySleepType(Date.now());
    await startSleep(child.id, sleepType);
  };

  const handleStopSleep = async () => {
    if (!activeSleep) return;
    await stopSleep(activeSleep.id);
  };

  const handleStartBreastFeeding = async (side: 'left' | 'right') => {
    if (!child) return;
    await startFeeding(child.id, side === 'left' ? 'breast_left' : 'breast_right');
  };

  const handleStartBottleFeeding = async () => {
    if (!child) return;
    await startFeeding(child.id, 'bottle');
  };

  const handleStopFeeding = async (amount?: number, vitaminD?: boolean) => {
    if (!activeFeeding) return;
    await stopFeeding(activeFeeding.id, amount, vitaminD);
  };

  const handleCancelFeeding = async () => {
    if (!activeFeeding) return;
    await cancelFeeding(activeFeeding.id);
  };

  const handleStartPump = async () => {
    if (!child) return;
    await startPump(child.id);
  };

  const handleStopPump = async (amount?: number) => {
    if (!activePump) return;
    await stopPump(activePump.id, amount);
  };

  const handleCancelPump = async () => {
    if (!activePump) return;
    await cancelPump(activePump.id);
  };

  const handleQuickDiaper = async (type: DiaperType) => {
    if (!child) return;
    await logDiaper(child.id, type);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-sand-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-400 text-center">
          <p className="text-lg font-medium mb-2">Something went wrong, partner</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Combine and sort today's activities
  const allActivities: Array<{
    id: string;
    type: 'sleep' | 'feeding' | 'diaper' | 'pump';
    time: number;
    data: SleepSession | FeedingSession | PumpSession | DiaperChange;
  }> = [
    ...summary.sleepSessions.map(s => ({
      id: s.id,
      type: 'sleep' as const,
      time: s.startTime,
      data: s,
    })),
    ...summary.feedings.map(f => ({
      id: f.id,
      type: 'feeding' as const,
      time: f.startTime,
      data: f,
    })),
    ...summary.pumps.map(p => ({
      id: p.id,
      type: 'pump' as const,
      time: p.startTime,
      data: p,
    })),
    ...summary.diapers.map(d => ({
      id: d.id,
      type: 'diaper' as const,
      time: d.time,
      data: d,
    })),
  ].sort((a, b) => b.time - a.time);

  return (
    <div className="min-h-screen bg-sand-950 pb-24">
      {/* Header */}
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-3xl western-title">Tombstone</h1>
        <p className="text-sand-400 text-sm italic">"I'm your huckleberry" — {child?.name || 'Baby'}</p>
      </header>

      <div className="px-4 space-y-4">
        {/* Sleep Timer */}
        <TimerDisplay
          startTime={activeSleep?.startTime}
          isActive={Boolean(activeSleep)}
          type="sleep"
          onStart={handleStartSleep}
          onStop={handleStopSleep}
          label="Start Sleep"
        />

        {/* Wake Window (only show when not sleeping) */}
        {!activeSleep && (
          <WakeWindowDisplay
            wakeMinutes={wakeMinutes}
            childBirthDate={child?.birthDate}
          />
        )}

        {/* Sleep Prediction - Sweet Spot */}
        {!activeSleep && wakeMinutes !== null && child?.birthDate && (
          <SleepPrediction 
            wakeMinutes={wakeMinutes} 
            birthDate={child.birthDate} 
          />
        )}

        {/* Owlet Status */}
        <OwletStatusCard reading={latestOwlet} trendReadings={owletTrend} />

        {/* Diaper Buttons */}
        <div>
          <h2 className="text-sm font-medium text-sand-400 mb-2">Log Diaper</h2>
          <div className="grid grid-cols-3 gap-3">
            <QuickLogButton
              icon={<Droplet className="w-6 h-6 text-white" />}
              label="Pee"
              sublabel="Wet"
              color="diaper"
              onClick={() => handleQuickDiaper('wet')}
            />
            <QuickLogButton
              icon={<Circle className="w-6 h-6 text-white fill-white" />}
              label="Poop"
              sublabel="Dirty"
              color="diaper"
              onClick={() => handleQuickDiaper('dirty')}
            />
            <QuickLogButton
              icon={<Droplet className="w-6 h-6 text-white" />}
              label="Both"
              sublabel="Pee + Poop"
              color="diaper"
              onClick={() => handleQuickDiaper('both')}
            />
          </div>
        </div>

        {/* Feeding Timer */}
        <FeedingTimer
          activeFeeding={activeFeeding}
          lastFeeding={lastFeeding}
          onStartBreast={handleStartBreastFeeding}
          onStartBottle={handleStartBottleFeeding}
          onStop={handleStopFeeding}
          onCancel={handleCancelFeeding}
        />

        {/* Pump Timer */}
        <PumpTimer
          activePump={activePump}
          lastPump={lastPump}
          onStart={handleStartPump}
          onStop={handleStopPump}
          onCancel={handleCancelPump}
        />

        {/* Today's Summary */}
        <DaySummaryCard
          totalSleepHours={summary.totalSleepHours}
          napCount={summary.napCount}
          feedingCount={summary.feedingCount}
          diaperCount={summary.diaperCount}
          pumpCount={summary.pumpCount}
          totalPumpMl={summary.totalPumpMl}
          lastPoopTime={lastPoop?.time}
          lastPeeTime={lastPee?.time}
        />

        {/* Recent Activity */}
        {allActivities.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-sand-100 mb-3">Today's Activity</h2>
            <div className="space-y-2">
              {allActivities.slice(0, 5).map(activity => (
                <ActivityCard
                  key={activity.id}
                  activity={activity.data}
                  type={activity.type}
                  onDelete={() => {
                    if (activity.type === 'sleep') {
                      deleteSleepSession(activity.id);
                    } else if (activity.type === 'feeding') {
                      deleteFeedingSession(activity.id);
                    } else if (activity.type === 'pump') {
                      deletePumpSession(activity.id);
                    } else if (activity.type === 'diaper') {
                      deleteDiaperChange(activity.id);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

