import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  formatDurationShort,
  formatTime,
  formatRelativeTime,
  formatDate,
  isSameDay,
  getStartOfDay,
  getEndOfDay,
  getDaysBetween,
  getRecommendedWakeWindow,
  getAgeInMonths,
  classifySleepType,
} from '../utils/time';

describe('Time Utilities', () => {
  describe('formatDuration', () => {
    it('should format seconds only', () => {
      expect(formatDuration(45000)).toBe('45s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(125000)).toBe('2m 5s');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(3725000)).toBe('1h 2m');
    });

    it('should handle zero', () => {
      expect(formatDuration(0)).toBe('0s');
    });
  });

  describe('formatDurationShort', () => {
    it('should format minutes only for short durations', () => {
      expect(formatDurationShort(1800000)).toBe('30m');
    });

    it('should format hours and minutes', () => {
      expect(formatDurationShort(5400000)).toBe('1h 30m');
    });
  });

  describe('formatTime', () => {
    it('should format time in 12-hour format by default', () => {
      const date = new Date('2026-02-04T14:30:00');
      const formatted = formatTime(date.getTime());
      expect(formatted).toMatch(/2:30\s*PM/i);
    });

    it('should format time in 24-hour format', () => {
      const date = new Date('2026-02-04T14:30:00');
      const formatted = formatTime(date.getTime(), '24h');
      expect(formatted).toMatch(/14:30/);
    });
  });

  describe('formatRelativeTime', () => {
    it('should show "just now" for very recent times', () => {
      expect(formatRelativeTime(Date.now() - 30000)).toBe('just now');
    });

    it('should show minutes ago', () => {
      expect(formatRelativeTime(Date.now() - 5 * 60 * 1000)).toBe('5m ago');
    });

    it('should show hours ago', () => {
      expect(formatRelativeTime(Date.now() - 3 * 60 * 60 * 1000)).toBe('3h ago');
    });

    it('should show days ago', () => {
      expect(formatRelativeTime(Date.now() - 2 * 24 * 60 * 60 * 1000)).toBe('2d ago');
    });
  });

  describe('formatDate', () => {
    it('should return "Today" for today', () => {
      expect(formatDate(Date.now())).toBe('Today');
    });

    it('should return "Yesterday" for yesterday', () => {
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      expect(formatDate(yesterday)).toBe('Yesterday');
    });

    it('should format older dates', () => {
      const oldDate = new Date('2026-01-15T12:00:00');
      const formatted = formatDate(oldDate.getTime());
      expect(formatted).toContain('Jan');
      // Check that it formats as a day of week + date
      expect(formatted).toMatch(/\w+, Jan \d+/);
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const date1 = new Date('2026-02-04T10:00:00');
      const date2 = new Date('2026-02-04T22:00:00');
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date('2026-02-04T10:00:00');
      const date2 = new Date('2026-02-05T10:00:00');
      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('getStartOfDay', () => {
    it('should return start of day', () => {
      const date = new Date('2026-02-04T15:30:45');
      const start = getStartOfDay(date);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
      expect(start.getMilliseconds()).toBe(0);
    });
  });

  describe('getEndOfDay', () => {
    it('should return end of day', () => {
      const date = new Date('2026-02-04T15:30:45');
      const end = getEndOfDay(date);
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
      expect(end.getMilliseconds()).toBe(999);
    });
  });

  describe('getDaysBetween', () => {
    it('should calculate days between dates', () => {
      const start = new Date('2026-02-01');
      const end = new Date('2026-02-04');
      expect(getDaysBetween(start, end)).toBe(3);
    });

    it('should return 0 for same day', () => {
      const date = new Date('2026-02-04');
      expect(getDaysBetween(date, date)).toBe(0);
    });
  });

  describe('getRecommendedWakeWindow', () => {
    it('should return appropriate window for newborn', () => {
      const { min, max } = getRecommendedWakeWindow(0);
      expect(min).toBe(35);
      expect(max).toBe(60);
    });

    it('should return appropriate window for 3 month old', () => {
      const { min, max } = getRecommendedWakeWindow(3);
      expect(min).toBe(75);
      expect(max).toBe(120);
    });

    it('should return appropriate window for 6 month old', () => {
      const { min, max } = getRecommendedWakeWindow(6);
      expect(min).toBe(120);
      expect(max).toBe(180);
    });

    it('should return appropriate window for 12 month old', () => {
      const { min, max } = getRecommendedWakeWindow(12);
      expect(min).toBe(210);
      expect(max).toBe(300);
    });

    it('should return appropriate window for toddler (18+ months)', () => {
      const { min, max } = getRecommendedWakeWindow(24);
      expect(min).toBe(300);
      expect(max).toBe(420);
    });
  });

  describe('getAgeInMonths', () => {
    it('should calculate age in months correctly', () => {
      // Assuming current date is Feb 4, 2026
      const birthDate = '2025-08-04'; // 6 months ago
      const age = getAgeInMonths(birthDate);
      expect(age).toBe(6);
    });

    it('should handle birth date in same month', () => {
      const birthDate = '2026-02-01';
      const age = getAgeInMonths(birthDate);
      expect(age).toBe(0);
    });

    it('should not return negative age', () => {
      const birthDate = '2026-12-01'; // Future date
      const age = getAgeInMonths(birthDate);
      expect(age).toBe(0);
    });
  });

  describe('classifySleepType', () => {
    it('should classify evening sleep as night', () => {
      const evening = new Date('2026-02-04T19:00:00');
      expect(classifySleepType(evening.getTime())).toBe('night');
    });

    it('should classify late night sleep as night', () => {
      const lateNight = new Date('2026-02-04T23:00:00');
      expect(classifySleepType(lateNight.getTime())).toBe('night');
    });

    it('should classify early morning sleep as night', () => {
      const earlyMorning = new Date('2026-02-04T04:00:00');
      expect(classifySleepType(earlyMorning.getTime())).toBe('night');
    });

    it('should classify morning sleep as nap', () => {
      const morning = new Date('2026-02-04T10:00:00');
      expect(classifySleepType(morning.getTime())).toBe('nap');
    });

    it('should classify afternoon sleep as nap', () => {
      const afternoon = new Date('2026-02-04T14:00:00');
      expect(classifySleepType(afternoon.getTime())).toBe('nap');
    });

    it('should classify 6 AM as nap (boundary)', () => {
      const sixAM = new Date('2026-02-04T06:00:00');
      expect(classifySleepType(sixAM.getTime())).toBe('nap');
    });

    it('should classify 6 PM as night (boundary)', () => {
      const sixPM = new Date('2026-02-04T18:00:00');
      expect(classifySleepType(sixPM.getTime())).toBe('night');
    });
  });
});
