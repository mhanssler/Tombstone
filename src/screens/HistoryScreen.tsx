import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ActivityCard } from '@/components';
import { EditActivityModal } from '@/components/EditActivityModal';
import {
  useCurrentChild,
  useSleepSessionsForDay,
  useFeedingsForDay,
  usePumpSessionsForDay,
  useDiapersForDay,
} from '@/hooks';
import {
  deleteSleepSession,
  deleteFeedingSession,
  deletePumpSession,
  deleteDiaperChange,
  updateSleepSession,
  updateFeedingSession,
  updatePumpSession,
  updateDiaperChange,
} from '@/database/queries';
import { formatDate, formatDuration } from '@/utils/time';
import type { SleepSession, FeedingSession, PumpSession, DiaperChange } from '@/types';

export function HistoryScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingActivity, setEditingActivity] = useState<{
    activity: SleepSession | FeedingSession | PumpSession | DiaperChange;
    type: 'sleep' | 'feeding' | 'diaper' | 'pump';
  } | null>(null);
  const child = useCurrentChild();

  const sleepSessions = useSleepSessionsForDay(child?.id, selectedDate);
  const feedings = useFeedingsForDay(child?.id, selectedDate);
  const pumps = usePumpSessionsForDay(child?.id, selectedDate);
  const diapers = useDiapersForDay(child?.id, selectedDate);

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    // Don't go into the future
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // Calculate totals
  const totalSleepMs = sleepSessions.reduce((total, s) => {
    if (s.endTime) return total + (s.endTime - s.startTime);
    return total;
  }, 0);

  // Combine and sort activities
  const allActivities: Array<{
    id: string;
    type: 'sleep' | 'feeding' | 'diaper' | 'pump';
    time: number;
    data: SleepSession | FeedingSession | PumpSession | DiaperChange;
  }> = [
    ...sleepSessions.map(s => ({
      id: s.id,
      type: 'sleep' as const,
      time: s.startTime,
      data: s,
    })),
    ...feedings.map(f => ({
      id: f.id,
      type: 'feeding' as const,
      time: f.startTime,
      data: f,
    })),
    ...pumps.map(p => ({
      id: p.id,
      type: 'pump' as const,
      time: p.startTime,
      data: p,
    })),
    ...diapers.map(d => ({
      id: d.id,
      type: 'diaper' as const,
      time: d.time,
      data: d,
    })),
  ].sort((a, b) => b.time - a.time);

  return (
    <div className="min-h-screen bg-sand-950 pb-24">
      {/* Header with date navigation */}
      <header className="px-4 pt-4 pb-4">
        <h1 className="text-2xl western-title mb-4">History</h1>
        
        <div className="flex items-center justify-between bg-sand-900/60 rounded-xl p-2 border border-leather-800/50">
          <button
            onClick={goToPreviousDay}
            className="p-2 rounded-lg hover:bg-leather-800/50 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-sand-300" />
          </button>
          
          <span className="text-lg font-medium text-sand-100">
            {formatDate(selectedDate.getTime())}
          </span>
          
          <button
            onClick={goToNextDay}
            disabled={isToday}
            className="p-2 rounded-lg hover:bg-leather-800/50 transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-6 h-6 text-sand-300" />
          </button>
        </div>
      </header>

      <div className="px-4 space-y-4">
        {/* Day Summary */}
        <div className="bg-sand-900/60 rounded-2xl p-4 border border-leather-800/50">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold text-indigo-400">
                {formatDuration(totalSleepMs)}
              </div>
              <div className="text-xs text-sand-400">Total Sleep</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">
                {feedings.length}
              </div>
              <div className="text-xs text-sand-400">Feedings</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {pumps.length}
              </div>
              <div className="text-xs text-sand-400">Pumps</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-lime-400">
                {diapers.length}
              </div>
              <div className="text-xs text-sand-400">Diapers</div>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        {allActivities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sand-400">No activities logged for this day</p>
          </div>
        ) : (
          <div className="space-y-2">
            {allActivities.map(activity => (
              <ActivityCard
                key={activity.id}
                activity={activity.data}
                type={activity.type}
                onEdit={() => setEditingActivity({ activity: activity.data, type: activity.type })}
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
        )}
      </div>

      {/* Edit Modal */}
      {editingActivity && (
        <EditActivityModal
          activity={editingActivity.activity}
          type={editingActivity.type}
          onSave={(updates) => {
            if (editingActivity.type === 'sleep') {
              updateSleepSession(editingActivity.activity.id, updates as Parameters<typeof updateSleepSession>[1]);
            } else if (editingActivity.type === 'feeding') {
              updateFeedingSession(editingActivity.activity.id, updates as Parameters<typeof updateFeedingSession>[1]);
            } else if (editingActivity.type === 'pump') {
              updatePumpSession(editingActivity.activity.id, updates as Parameters<typeof updatePumpSession>[1]);
            } else if (editingActivity.type === 'diaper') {
              updateDiaperChange(editingActivity.activity.id, updates as Parameters<typeof updateDiaperChange>[1]);
            }
          }}
          onDelete={() => {
            if (editingActivity.type === 'sleep') {
              deleteSleepSession(editingActivity.activity.id);
            } else if (editingActivity.type === 'feeding') {
              deleteFeedingSession(editingActivity.activity.id);
            } else if (editingActivity.type === 'pump') {
              deletePumpSession(editingActivity.activity.id);
            } else if (editingActivity.type === 'diaper') {
              deleteDiaperChange(editingActivity.activity.id);
            }
          }}
          onClose={() => setEditingActivity(null)}
        />
      )}
    </div>
  );
}
