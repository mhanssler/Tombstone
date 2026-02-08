import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/database/db';
import {
  getActiveSleepSession,
  getActiveFeeding,
  getActivePump,
  getSleepSessionsForDay,
  getFeedingsForDay,
  getPumpSessionsForDay,
  getDiapersForDay,
  getWakeWindowMinutes,
  getLastSleepSession,
  getLastFeeding,
  getLastPump,
  getLastPoop,
  getLastPee,
} from '@/database/queries';
import type { Child, SleepSession, FeedingSession, PumpSession, DiaperChange, ActiveTimer } from '@/types';

// Get the current child
export function useCurrentChild(): Child | undefined {
  return useLiveQuery(async () => {
    const children = await db.children.toArray();
    return children.find(c => !c._deleted);
  });
}

// Get active sleep timer
export function useActiveSleep(): SleepSession | undefined {
  return useLiveQuery(() => getActiveSleepSession());
}

// Get active feeding timer
export function useActiveFeeding(): FeedingSession | undefined {
  return useLiveQuery(() => getActiveFeeding());
}

// Get active pump timer
export function useActivePump(): PumpSession | undefined {
  return useLiveQuery(() => getActivePump());
}

// Get all active timers
export function useActiveTimers(): ActiveTimer[] {
  return useLiveQuery(() => db.activeTimers.toArray()) ?? [];
}

// Get sleep sessions for a specific day
export function useSleepSessionsForDay(childId: string | undefined, date: Date): SleepSession[] {
  return useLiveQuery(
    async () => {
      if (!childId) return [];
      return getSleepSessionsForDay(childId, date);
    },
    [childId, date.toDateString()]
  ) ?? [];
}

// Get feedings for a specific day
export function useFeedingsForDay(childId: string | undefined, date: Date): FeedingSession[] {
  return useLiveQuery(
    async () => {
      if (!childId) return [];
      return getFeedingsForDay(childId, date);
    },
    [childId, date.toDateString()]
  ) ?? [];
}

// Get diapers for a specific day
export function useDiapersForDay(childId: string | undefined, date: Date): DiaperChange[] {
  return useLiveQuery(
    async () => {
      if (!childId) return [];
      return getDiapersForDay(childId, date);
    },
    [childId, date.toDateString()]
  ) ?? [];
}

// Get pump sessions for a specific day
export function usePumpSessionsForDay(childId: string | undefined, date: Date): PumpSession[] {
  return useLiveQuery(
    async () => {
      if (!childId) return [];
      return getPumpSessionsForDay(childId, date);
    },
    [childId, date.toDateString()]
  ) ?? [];
}

// Get current wake window in minutes
export function useWakeWindow(childId: string | undefined): number | null {
  return useLiveQuery(
    async () => {
      if (!childId) return null;
      return getWakeWindowMinutes(childId);
    },
    [childId]
  ) ?? null;
}

// Get last sleep session
export function useLastSleep(childId: string | undefined): SleepSession | undefined {
  return useLiveQuery(
    async () => {
      if (!childId) return undefined;
      return getLastSleepSession(childId);
    },
    [childId]
  );
}

// Get the last feeding session
export function useLastFeeding(childId: string | undefined): FeedingSession | undefined {
  return useLiveQuery(
    async () => {
      if (!childId) return undefined;
      return getLastFeeding(childId);
    },
    [childId]
  );
}

// Get the last pump session
export function useLastPump(childId: string | undefined): PumpSession | undefined {
  return useLiveQuery(
    async () => {
      if (!childId) return undefined;
      return getLastPump(childId);
    },
    [childId]
  );
}

// Get today's summary stats
export function useTodaySummary(childId: string | undefined) {
  const today = new Date();
  const sleepSessions = useSleepSessionsForDay(childId, today);
  const feedings = useFeedingsForDay(childId, today);
  const diapers = useDiapersForDay(childId, today);
  const pumps = usePumpSessionsForDay(childId, today);

  const totalSleepMs = sleepSessions.reduce((total, session) => {
    if (session.endTime) {
      return total + (session.endTime - session.startTime);
    }
    return total;
  }, 0);

  const napCount = sleepSessions.filter(s => s.type === 'nap' && s.endTime).length;

  const totalPumpMl = pumps.reduce((total, p) => total + (p.amount || 0), 0);

  return {
    totalSleepMs,
    totalSleepHours: Math.round((totalSleepMs / (1000 * 60 * 60)) * 10) / 10,
    napCount,
    feedingCount: feedings.length,
    diaperCount: diapers.length,
    pumpCount: pumps.length,
    totalPumpMl,
    sleepSessions,
    feedings,
    diapers,
    pumps,
  };
}

// Get app settings
export function useSettings() {
  return useLiveQuery(() => db.settings.get('default'));
}

// Get last poop diaper change
export function useLastPoop(childId: string | undefined): DiaperChange | undefined {
  return useLiveQuery(
    async () => {
      if (!childId) return undefined;
      return getLastPoop(childId);
    },
    [childId]
  );
}

// Get last pee diaper change
export function useLastPee(childId: string | undefined): DiaperChange | undefined {
  return useLiveQuery(
    async () => {
      if (!childId) return undefined;
      return getLastPee(childId);
    },
    [childId]
  );
}
