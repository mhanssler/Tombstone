import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { triggerSync } from '@/lib/sync';
import type {
  SleepSession,
  FeedingSession,
  PumpSession,
  DiaperChange,
  SleepType,
  FeedingType,
  DiaperType,
  ActiveTimer,
  OwletReading,
  OwletSleepState,
} from '@/types';

// ============ SLEEP SESSIONS ============

export async function startSleep(childId: string, type: SleepType = 'nap'): Promise<SleepSession> {
  const now = Date.now();

  // Enforce a single active sleep session per child.
  // If a session is already open (possibly started on another device), reuse it
  // instead of creating an overlapping session. If multiple open sessions exist
  // (bug/edge case), close all but the most recent to prevent overlap.
  const openSessions = await db.sleepSessions
    .where('childId')
    .equals(childId)
    .and(s => !s._deleted && !s.endTime && s.startTime > 0)
    .toArray();

  if (openSessions.length > 0) {
    const mostRecent = openSessions.reduce((latest, current) =>
      current.startTime > latest.startTime ? current : latest
    );

    // Close any other open sessions to prevent overlapping sleep.
    const toClose = openSessions.filter(s => s.id !== mostRecent.id);
    if (toClose.length > 0) {
      await db.sleepSessions.bulkUpdate(
        toClose.map(s => ({
          key: s.id,
          changes: {
            endTime: Math.max(s.startTime + 1, mostRecent.startTime),
            updatedAt: now,
            syncStatus: 'pending' as const,
          },
        }))
      );
      triggerSync();
    }

    // Ensure the active timer points at the most recent open session.
    const timer: ActiveTimer = {
      id: 'sleep',
      activityType: 'sleep',
      activityId: mostRecent.id,
      startTime: mostRecent.startTime,
    };
    await db.activeTimers.put(timer);

    return mostRecent;
  }

  const session: SleepSession = {
    id: uuidv4(),
    childId,
    startTime: now,
    type,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    _deleted: false,
  };

  await db.sleepSessions.add(session);

  // Set active timer
  const timer: ActiveTimer = {
    id: 'sleep',
    activityType: 'sleep',
    activityId: session.id,
    startTime: now,
  };
  await db.activeTimers.put(timer);

  return session;
}

export async function stopSleep(sessionId: string): Promise<SleepSession | undefined> {
  const now = Date.now();
  
  await db.sleepSessions.update(sessionId, {
    endTime: now,
    updatedAt: now,
    syncStatus: 'pending',
  });

  // Clear active timer
  await db.activeTimers.delete('sleep');

  triggerSync();
  return db.sleepSessions.get(sessionId);
}

export async function logSleep(
  childId: string,
  startTime: number,
  endTime: number,
  type: SleepType = 'nap',
  notes?: string
): Promise<SleepSession> {
  const now = Date.now();
  const session: SleepSession = {
    id: uuidv4(),
    childId,
    startTime,
    endTime,
    type,
    notes,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    _deleted: false,
  };

  await db.sleepSessions.add(session);
  triggerSync();
  return session;
}

export async function getActiveSleepSession(): Promise<SleepSession | undefined> {
  // First check local active timer
  const timer = await db.activeTimers.get('sleep');
  if (timer) {
    const session = await db.sleepSessions.get(timer.activityId);
    if (session) return session;
  }

  // Fallback: check for any sleep session without an endTime (started on another device)
  const openSessions = await db.sleepSessions
    .filter(s => !s._deleted && !s.endTime && s.startTime > 0)
    .sortBy('startTime');

  // Return the most recent open session
  return openSessions.length > 0 ? openSessions[openSessions.length - 1] : undefined;
}

export async function getSleepSessionsForDay(childId: string, date: Date): Promise<SleepSession[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return db.sleepSessions
    .where('childId')
    .equals(childId)
    .and(s => !s._deleted && s.startTime >= startOfDay.getTime() && s.startTime <= endOfDay.getTime())
    .sortBy('startTime');
}

export async function getLastSleepSession(childId: string): Promise<SleepSession | undefined> {
  const sessions = await db.sleepSessions
    .where('childId')
    .equals(childId)
    .and(s => !s._deleted && s.endTime !== undefined)
    .reverse()
    .sortBy('endTime');
  
  return sessions[0];
}

// ============ FEEDING SESSIONS ============

export async function startFeeding(childId: string, type: FeedingType): Promise<FeedingSession> {
  const now = Date.now();
  const session: FeedingSession = {
    id: uuidv4(),
    childId,
    startTime: now,
    type,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    _deleted: false,
  };

  await db.feedingSessions.add(session);

  // Set active timer
  const timer: ActiveTimer = {
    id: 'feeding',
    activityType: 'feeding',
    activityId: session.id,
    startTime: now,
    feedingSide: type === 'breast_left' ? 'left' : type === 'breast_right' ? 'right' : undefined,
  };
  await db.activeTimers.put(timer);

  triggerSync();
  return session;
}

export async function stopFeeding(sessionId: string, amount?: number, vitaminD?: boolean): Promise<FeedingSession | undefined> {
  const now = Date.now();
  
  await db.feedingSessions.update(sessionId, {
    endTime: now,
    amount,
    vitaminD,
    updatedAt: now,
    syncStatus: 'pending',
  });

  // Clear active timer
  await db.activeTimers.delete('feeding');

  triggerSync();
  return db.feedingSessions.get(sessionId);
}

export async function cancelFeeding(sessionId: string): Promise<void> {
  // Delete the feeding session and clear the timer
  await db.feedingSessions.delete(sessionId);
  await db.activeTimers.delete('feeding');
  triggerSync();
}

export async function logFeeding(
  childId: string,
  type: FeedingType,
  startTime: number,
  endTime?: number,
  amount?: number,
  notes?: string,
  vitaminD?: boolean
): Promise<FeedingSession> {
  const now = Date.now();
  const session: FeedingSession = {
    id: uuidv4(),
    childId,
    startTime,
    endTime,
    type,
    amount,
    vitaminD,
    notes,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    _deleted: false,
  };

  await db.feedingSessions.add(session);
  triggerSync();
  return session;
}

export async function getActiveFeeding(): Promise<FeedingSession | undefined> {
  // First check local active timer
  const timer = await db.activeTimers.get('feeding');
  if (timer) {
    const session = await db.feedingSessions.get(timer.activityId);
    if (session) return session;
  }

  // Fallback: check for any feeding session without an endTime (started on another device)
  const openSessions = await db.feedingSessions
    .filter(f => !f._deleted && !f.endTime && f.startTime > 0)
    .sortBy('startTime');

  // Return the most recent open session
  return openSessions.length > 0 ? openSessions[openSessions.length - 1] : undefined;
}

export async function getFeedingsForDay(childId: string, date: Date): Promise<FeedingSession[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return db.feedingSessions
    .where('childId')
    .equals(childId)
    .and(f => !f._deleted && f.startTime >= startOfDay.getTime() && f.startTime <= endOfDay.getTime())
    .sortBy('startTime');
}

// ============ DIAPER CHANGES ============

export async function logDiaper(
  childId: string,
  type: DiaperType,
  time?: number,
  notes?: string
): Promise<DiaperChange> {
  const now = Date.now();
  const change: DiaperChange = {
    id: uuidv4(),
    childId,
    time: time ?? now,
    type,
    notes,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    _deleted: false,
  };

  await db.diaperChanges.add(change);
  triggerSync();
  return change;
}

export async function getDiapersForDay(childId: string, date: Date): Promise<DiaperChange[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return db.diaperChanges
    .where('childId')
    .equals(childId)
    .and(d => !d._deleted && d.time >= startOfDay.getTime() && d.time <= endOfDay.getTime())
    .sortBy('time');
}

// ============ ACTIVE TIMERS ============

export async function getActiveTimer(type: 'sleep' | 'feeding' | 'pump'): Promise<ActiveTimer | undefined> {
  return db.activeTimers.get(type);
}

export async function clearActiveTimer(type: 'sleep' | 'feeding' | 'pump'): Promise<void> {
  await db.activeTimers.delete(type);
}

// ============ STATISTICS ============

export async function getWakeWindowMinutes(childId: string): Promise<number | null> {
  const lastSleep = await getLastSleepSession(childId);
  if (!lastSleep || !lastSleep.endTime) return null;
  
  return Math.floor((Date.now() - lastSleep.endTime) / (1000 * 60));
}

export async function getTotalSleepForDay(childId: string, date: Date): Promise<number> {
  const sessions = await getSleepSessionsForDay(childId, date);
  
  return sessions.reduce((total, session) => {
    if (session.endTime) {
      return total + (session.endTime - session.startTime);
    }
    return total;
  }, 0);
}

// ============ DELETE OPERATIONS (Soft delete) ============

export async function deleteSleepSession(sessionId: string): Promise<void> {
  await db.sleepSessions.update(sessionId, {
    _deleted: true,
    updatedAt: Date.now(),
    syncStatus: 'pending',
  });
  triggerSync();
}

export async function deleteFeedingSession(sessionId: string): Promise<void> {
  await db.feedingSessions.update(sessionId, {
    _deleted: true,
    updatedAt: Date.now(),
    syncStatus: 'pending',
  });
  triggerSync();
}

export async function deleteDiaperChange(changeId: string): Promise<void> {
  await db.diaperChanges.update(changeId, {
    _deleted: true,
    updatedAt: Date.now(),
    syncStatus: 'pending',
  });
  triggerSync();
}

// ============ UPDATE OPERATIONS ============

export async function updateSleepSession(
  sessionId: string,
  updates: Partial<Pick<SleepSession, 'startTime' | 'endTime' | 'type' | 'notes'>>
): Promise<SleepSession | undefined> {
  await db.sleepSessions.update(sessionId, {
    ...updates,
    updatedAt: Date.now(),
    syncStatus: 'pending',
  });
  triggerSync();
  return db.sleepSessions.get(sessionId);
}

export async function updateFeedingSession(
  sessionId: string,
  updates: Partial<Pick<FeedingSession, 'startTime' | 'endTime' | 'type' | 'amount' | 'vitaminD' | 'notes'>>
): Promise<FeedingSession | undefined> {
  await db.feedingSessions.update(sessionId, {
    ...updates,
    updatedAt: Date.now(),
    syncStatus: 'pending',
  });
  triggerSync();
  return db.feedingSessions.get(sessionId);
}

export async function updateDiaperChange(
  changeId: string,
  updates: Partial<Pick<DiaperChange, 'time' | 'type' | 'notes'>>
): Promise<DiaperChange | undefined> {
  await db.diaperChanges.update(changeId, {
    ...updates,
    updatedAt: Date.now(),
    syncStatus: 'pending',
  });
  triggerSync();
  return db.diaperChanges.get(changeId);
}

// ============ GET LAST FEEDING (for showing which side to start) ============

export async function getLastFeeding(childId: string): Promise<FeedingSession | undefined> {
  const feedings = await db.feedingSessions
    .where('childId')
    .equals(childId)
    .and(f => !f._deleted && f.endTime !== undefined)
    .reverse()
    .sortBy('endTime');
  
  return feedings[0];
}

// ============ GET LAST OCCURRENCES (for "last poop" tracking) ============

export async function getLastDiaperByType(
  childId: string,
  type: DiaperType
): Promise<DiaperChange | undefined> {
  const diapers = await db.diaperChanges
    .where('childId')
    .equals(childId)
    .and(d => !d._deleted && (d.type === type || (type === 'dirty' && d.type === 'both')))
    .reverse()
    .sortBy('time');
  
  return diapers[0];
}

export async function getLastPoop(childId: string): Promise<DiaperChange | undefined> {
  const diapers = await db.diaperChanges
    .where('childId')
    .equals(childId)
    .and(d => !d._deleted && (d.type === 'dirty' || d.type === 'both'))
    .reverse()
    .sortBy('time');
  
  return diapers[0];
}

export async function getLastPee(childId: string): Promise<DiaperChange | undefined> {
  const diapers = await db.diaperChanges
    .where('childId')
    .equals(childId)
    .and(d => !d._deleted && (d.type === 'wet' || d.type === 'both'))
    .reverse()
    .sortBy('time');
  
  return diapers[0];
}

// ============ PUMP SESSIONS ============

export async function startPump(childId: string): Promise<PumpSession> {
  const now = Date.now();
  const session: PumpSession = {
    id: uuidv4(),
    childId,
    startTime: now,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    _deleted: false,
  };

  await db.pumpSessions.add(session);

  // Set active timer
  const timer: ActiveTimer = {
    id: 'pump',
    activityType: 'pump',
    activityId: session.id,
    startTime: now,
  };
  await db.activeTimers.put(timer);

  triggerSync();
  return session;
}

export async function stopPump(sessionId: string, amount?: number): Promise<PumpSession | undefined> {
  const now = Date.now();

  await db.pumpSessions.update(sessionId, {
    endTime: now,
    amount,
    updatedAt: now,
    syncStatus: 'pending',
  });

  await db.activeTimers.delete('pump');

  triggerSync();
  return db.pumpSessions.get(sessionId);
}

export async function cancelPump(sessionId: string): Promise<void> {
  await db.pumpSessions.delete(sessionId);
  await db.activeTimers.delete('pump');
  triggerSync();
}

export async function logPump(
  childId: string,
  startTime: number,
  endTime?: number,
  amount?: number,
  notes?: string
): Promise<PumpSession> {
  const now = Date.now();
  const session: PumpSession = {
    id: uuidv4(),
    childId,
    startTime,
    endTime,
    amount,
    notes,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    _deleted: false,
  };

  await db.pumpSessions.add(session);
  triggerSync();
  return session;
}

export async function getActivePump(): Promise<PumpSession | undefined> {
  const timer = await db.activeTimers.get('pump');
  if (timer) {
    const session = await db.pumpSessions.get(timer.activityId);
    if (session) return session;
  }

  const openSessions = await db.pumpSessions
    .filter(p => !p._deleted && !p.endTime && p.startTime > 0)
    .sortBy('startTime');

  return openSessions.length > 0 ? openSessions[openSessions.length - 1] : undefined;
}

export async function getPumpSessionsForDay(childId: string, date: Date): Promise<PumpSession[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return db.pumpSessions
    .where('childId')
    .equals(childId)
    .and(p => !p._deleted && p.startTime >= startOfDay.getTime() && p.startTime <= endOfDay.getTime())
    .sortBy('startTime');
}

export async function deletePumpSession(sessionId: string): Promise<void> {
  await db.pumpSessions.update(sessionId, {
    _deleted: true,
    updatedAt: Date.now(),
    syncStatus: 'pending',
  });
  triggerSync();
}

export async function updatePumpSession(
  sessionId: string,
  updates: Partial<Pick<PumpSession, 'startTime' | 'endTime' | 'amount' | 'notes'>>
): Promise<PumpSession | undefined> {
  await db.pumpSessions.update(sessionId, {
    ...updates,
    updatedAt: Date.now(),
    syncStatus: 'pending',
  });
  triggerSync();
  return db.pumpSessions.get(sessionId);
}

export async function getLastPump(childId: string): Promise<PumpSession | undefined> {
  const pumps = await db.pumpSessions
    .where('childId')
    .equals(childId)
    .and(p => !p._deleted && p.endTime !== undefined)
    .reverse()
    .sortBy('endTime');

  return pumps[0];
}

// ============ OWLET READINGS (Local Ingestion) ============

export interface IngestOwletReadingInput {
  recordedAt: number;
  heartRateBpm?: number;
  oxygenSaturationPct?: number;
  movementLevel?: number;
  sleepState?: OwletSleepState;
  sockConnected?: boolean;
  batteryPct?: number;
  sourceDeviceId?: string;
  sourceSessionId?: string;
  rawPayload?: Record<string, unknown>;
}

export async function ingestOwletReading(
  childId: string,
  input: IngestOwletReadingInput
): Promise<OwletReading> {
  const now = Date.now();
  const reading: OwletReading = {
    id: uuidv4(),
    childId,
    recordedAt: input.recordedAt,
    heartRateBpm: input.heartRateBpm,
    oxygenSaturationPct: input.oxygenSaturationPct,
    movementLevel: input.movementLevel,
    sleepState: input.sleepState,
    sockConnected: input.sockConnected,
    batteryPct: input.batteryPct,
    sourceDeviceId: input.sourceDeviceId,
    sourceSessionId: input.sourceSessionId,
    rawPayload: input.rawPayload,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    _deleted: false,
  };

  await db.owletReadings.add(reading);
  triggerSync();
  return reading;
}

export async function ingestOwletReadings(
  childId: string,
  inputs: IngestOwletReadingInput[]
): Promise<number> {
  if (inputs.length === 0) return 0;

  const now = Date.now();
  const readings: OwletReading[] = inputs.map(input => ({
    id: uuidv4(),
    childId,
    recordedAt: input.recordedAt,
    heartRateBpm: input.heartRateBpm,
    oxygenSaturationPct: input.oxygenSaturationPct,
    movementLevel: input.movementLevel,
    sleepState: input.sleepState,
    sockConnected: input.sockConnected,
    batteryPct: input.batteryPct,
    sourceDeviceId: input.sourceDeviceId,
    sourceSessionId: input.sourceSessionId,
    rawPayload: input.rawPayload,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    _deleted: false,
  }));

  await db.owletReadings.bulkAdd(readings);
  triggerSync();
  return readings.length;
}

export async function getLatestOwletReading(childId: string): Promise<OwletReading | undefined> {
  const readings = await db.owletReadings
    .where('childId')
    .equals(childId)
    .and(r => !r._deleted)
    .reverse()
    .sortBy('recordedAt');

  return readings[0];
}

export async function getOwletReadingsForRange(
  childId: string,
  startTime: number,
  endTime: number,
  limit: number = 500
): Promise<OwletReading[]> {
  const readings = await db.owletReadings
    .where('childId')
    .equals(childId)
    .and(r => !r._deleted && r.recordedAt >= startTime && r.recordedAt <= endTime)
    .sortBy('recordedAt');

  if (readings.length <= limit) return readings;
  return readings.slice(readings.length - limit);
}

export async function pruneOwletReadingsBefore(cutoffTime: number): Promise<number> {
  const oldReadings = await db.owletReadings
    .where('recordedAt')
    .below(cutoffTime)
    .toArray();

  if (oldReadings.length === 0) return 0;

  const ids = oldReadings.map(r => r.id);
  await db.owletReadings.where('id').anyOf(ids).delete();
  return ids.length;
}

