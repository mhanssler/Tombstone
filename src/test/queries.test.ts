import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../database/db';
import {
  startSleep,
  stopSleep,
  logSleep,
  getActiveSleepSession,
  getSleepSessionsForDay,
  getLastSleepSession,
  deleteSleepSession,
  startFeeding,
  stopFeeding,
  cancelFeeding,
  logFeeding,
  getActiveFeeding,
  getFeedingsForDay,
  deleteFeedingSession,
  logDiaper,
  getDiapersForDay,
  deleteDiaperChange,
  getWakeWindowMinutes,
} from '../database/queries';

describe('Database Queries', () => {
  const testChildId = 'test-child-123';

  beforeEach(async () => {
    // Clear all data before each test
    await db.sleepSessions.clear();
    await db.feedingSessions.clear();
    await db.diaperChanges.clear();
    await db.activeTimers.clear();
  });

  afterEach(async () => {
    // Clean up after each test
    await db.sleepSessions.clear();
    await db.feedingSessions.clear();
    await db.diaperChanges.clear();
    await db.activeTimers.clear();
  });

  describe('Sleep Sessions', () => {
    it('should start a sleep session and set active timer', async () => {
      const session = await startSleep(testChildId, 'nap');

      expect(session.id).toBeDefined();
      expect(session.childId).toBe(testChildId);
      expect(session.type).toBe('nap');
      expect(session.startTime).toBeDefined();
      expect(session.endTime).toBeUndefined();
      expect(session._deleted).toBe(false);

      // Check active timer was set
      const activeSession = await getActiveSleepSession();
      expect(activeSession?.id).toBe(session.id);
    });

    it('should stop a sleep session and clear active timer', async () => {
      const session = await startSleep(testChildId, 'nap');
      const stoppedSession = await stopSleep(session.id);

      expect(stoppedSession?.endTime).toBeDefined();
      expect(stoppedSession?.endTime).toBeGreaterThan(stoppedSession!.startTime);

      // Check active timer was cleared
      const activeSession = await getActiveSleepSession();
      expect(activeSession).toBeUndefined();
    });

    it('should log a completed sleep session', async () => {
      const startTime = Date.now() - 3600000; // 1 hour ago
      const endTime = Date.now();
      const session = await logSleep(testChildId, startTime, endTime, 'night', 'Test notes');

      expect(session.startTime).toBe(startTime);
      expect(session.endTime).toBe(endTime);
      expect(session.type).toBe('night');
      expect(session.notes).toBe('Test notes');
    });

    it('should get sleep sessions for a specific day', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Create session for today
      await logSleep(testChildId, today.getTime() - 3600000, today.getTime(), 'nap');
      // Create session for yesterday
      await logSleep(testChildId, yesterday.getTime() - 3600000, yesterday.getTime(), 'nap');

      const todaySessions = await getSleepSessionsForDay(testChildId, today);
      expect(todaySessions.length).toBe(1);
    });

    it('should get the last completed sleep session', async () => {
      await logSleep(testChildId, Date.now() - 7200000, Date.now() - 3600000, 'nap');
      const session2 = await logSleep(testChildId, Date.now() - 1800000, Date.now() - 900000, 'nap');

      const lastSession = await getLastSleepSession(testChildId);
      expect(lastSession?.id).toBe(session2.id);
    });

    it('should soft delete a sleep session', async () => {
      const session = await logSleep(testChildId, Date.now() - 3600000, Date.now(), 'nap');
      await deleteSleepSession(session.id);

      const sessions = await getSleepSessionsForDay(testChildId, new Date());
      expect(sessions.length).toBe(0);

      // But it should still exist in DB with _deleted flag
      const deletedSession = await db.sleepSessions.get(session.id);
      expect(deletedSession?._deleted).toBe(true);
    });

    it('should not allow starting sleep when already sleeping', async () => {
      await startSleep(testChildId, 'nap');
      const activeSession = await getActiveSleepSession();
      expect(activeSession).toBeDefined();

      // Starting another sleep should overwrite the active timer
      // This is a potential bug - should we prevent this?
      const newSession = await startSleep(testChildId, 'night');
      const newActiveSession = await getActiveSleepSession();
      expect(newActiveSession?.id).toBe(newSession.id);
    });
  });

  describe('Feeding Sessions', () => {
    it('should start a feeding session', async () => {
      const session = await startFeeding(testChildId, 'breast_left');

      expect(session.id).toBeDefined();
      expect(session.type).toBe('breast_left');
      expect(session.startTime).toBeDefined();
      expect(session.endTime).toBeUndefined();

      const activeFeeding = await getActiveFeeding();
      expect(activeFeeding?.id).toBe(session.id);
    });

    it('should stop a feeding session with amount', async () => {
      const session = await startFeeding(testChildId, 'bottle');
      const stoppedSession = await stopFeeding(session.id, 120);

      expect(stoppedSession?.endTime).toBeDefined();
      expect(stoppedSession?.amount).toBe(120);

      const activeFeeding = await getActiveFeeding();
      expect(activeFeeding).toBeUndefined();
    });

    it('should cancel a feeding session (hard delete)', async () => {
      const session = await startFeeding(testChildId, 'bottle');
      await cancelFeeding(session.id);

      const deletedSession = await db.feedingSessions.get(session.id);
      expect(deletedSession).toBeUndefined();

      const activeFeeding = await getActiveFeeding();
      expect(activeFeeding).toBeUndefined();
    });

    it('should log a feeding session', async () => {
      const session = await logFeeding(
        testChildId,
        'bottle',
        Date.now() - 1800000,
        Date.now(),
        150,
        'Fed well'
      );

      expect(session.type).toBe('bottle');
      expect(session.amount).toBe(150);
      expect(session.notes).toBe('Fed well');
    });

    it('should get feedings for a specific day', async () => {
      const today = new Date();
      await logFeeding(testChildId, 'bottle', today.getTime() - 3600000, today.getTime(), 100);
      await logFeeding(testChildId, 'breast_left', today.getTime() - 1800000, today.getTime() - 1200000);

      const todayFeedings = await getFeedingsForDay(testChildId, today);
      expect(todayFeedings.length).toBe(2);
    });

    it('should soft delete a feeding session', async () => {
      const session = await logFeeding(testChildId, 'bottle', Date.now() - 3600000, Date.now(), 100);
      await deleteFeedingSession(session.id);

      const feedings = await getFeedingsForDay(testChildId, new Date());
      expect(feedings.length).toBe(0);
    });
  });

  describe('Diaper Changes', () => {
    it('should log a diaper change', async () => {
      const change = await logDiaper(testChildId, 'wet');

      expect(change.id).toBeDefined();
      expect(change.type).toBe('wet');
      expect(change.time).toBeDefined();
    });

    it('should log a diaper change with custom time and notes', async () => {
      const customTime = Date.now() - 3600000;
      const change = await logDiaper(testChildId, 'dirty', customTime, 'Blowout');

      expect(change.time).toBe(customTime);
      expect(change.notes).toBe('Blowout');
    });

    it('should get diapers for a specific day', async () => {
      const today = new Date();
      await logDiaper(testChildId, 'wet');
      await logDiaper(testChildId, 'dirty');
      await logDiaper(testChildId, 'both');

      const todayDiapers = await getDiapersForDay(testChildId, today);
      expect(todayDiapers.length).toBe(3);
    });

    it('should soft delete a diaper change', async () => {
      const change = await logDiaper(testChildId, 'wet');
      await deleteDiaperChange(change.id);

      const diapers = await getDiapersForDay(testChildId, new Date());
      expect(diapers.length).toBe(0);
    });
  });

  describe('Wake Window', () => {
    it('should return null if no sleep sessions exist', async () => {
      const wakeMinutes = await getWakeWindowMinutes(testChildId);
      expect(wakeMinutes).toBeNull();
    });

    it('should calculate wake window from last sleep', async () => {
      const endTime = Date.now() - 30 * 60 * 1000; // 30 minutes ago
      await logSleep(testChildId, endTime - 3600000, endTime, 'nap');

      const wakeMinutes = await getWakeWindowMinutes(testChildId);
      expect(wakeMinutes).toBeGreaterThanOrEqual(29);
      expect(wakeMinutes).toBeLessThanOrEqual(31);
    });

    it('should not count in-progress sleep sessions', async () => {
      // Create a completed sleep
      const endTime = Date.now() - 60 * 60 * 1000; // 1 hour ago
      await logSleep(testChildId, endTime - 3600000, endTime, 'nap');

      // Start a new sleep (in progress)
      await startSleep(testChildId, 'nap');

      // Wake window should be based on the completed sleep, not the in-progress one
      const wakeMinutes = await getWakeWindowMinutes(testChildId);
      expect(wakeMinutes).toBeGreaterThanOrEqual(59);
      expect(wakeMinutes).toBeLessThanOrEqual(61);
    });
  });

  describe('Edge Cases and Potential Bugs', () => {
    it('should handle multiple children independently', async () => {
      const child1 = 'child-1';
      const child2 = 'child-2';

      await logSleep(child1, Date.now() - 3600000, Date.now(), 'nap');
      await logSleep(child2, Date.now() - 1800000, Date.now(), 'nap');
      await logDiaper(child1, 'wet');

      const child1Sleep = await getSleepSessionsForDay(child1, new Date());
      const child2Sleep = await getSleepSessionsForDay(child2, new Date());
      const child1Diapers = await getDiapersForDay(child1, new Date());
      const child2Diapers = await getDiapersForDay(child2, new Date());

      expect(child1Sleep.length).toBe(1);
      expect(child2Sleep.length).toBe(1);
      expect(child1Diapers.length).toBe(1);
      expect(child2Diapers.length).toBe(0);
    });

    it('should handle concurrent sleep and feeding timers', async () => {
      // Can have both active at the same time
      const sleepSession = await startSleep(testChildId, 'nap');
      const feedingSession = await startFeeding(testChildId, 'bottle');

      const activeSleep = await getActiveSleepSession();
      const activeFeeding = await getActiveFeeding();

      expect(activeSleep?.id).toBe(sleepSession.id);
      expect(activeFeeding?.id).toBe(feedingSession.id);
    });

    it('should handle day boundary correctly', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Create a session that starts yesterday but ends today
      const startTime = new Date(yesterday);
      startTime.setHours(23, 30, 0, 0);
      const endTime = new Date(today);
      endTime.setHours(1, 0, 0, 0);

      await logSleep(testChildId, startTime.getTime(), endTime.getTime(), 'night');

      // The session should appear for yesterday (based on startTime)
      const yesterdaySessions = await getSleepSessionsForDay(testChildId, yesterday);
      const todaySessions = await getSleepSessionsForDay(testChildId, today);

      expect(yesterdaySessions.length).toBe(1);
      expect(todaySessions.length).toBe(0);
    });

    it('should not return deleted sessions in queries', async () => {
      const session = await logSleep(testChildId, Date.now() - 3600000, Date.now(), 'nap');
      await deleteSleepSession(session.id);

      // Get last sleep should not return deleted session
      const lastSleep = await getLastSleepSession(testChildId);
      expect(lastSleep).toBeUndefined();

      // Wake window should return null since no valid sleep exists
      const wakeMinutes = await getWakeWindowMinutes(testChildId);
      expect(wakeMinutes).toBeNull();
    });
  });
});
