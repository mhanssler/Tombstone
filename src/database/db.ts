import Dexie, { Table } from 'dexie';
import type {
  Child,
  SleepSession,
  FeedingSession,
  PumpSession,
  DiaperChange,
  GrowthMeasurement,
  ActiveTimer,
  AppSettings,
} from '@/types';

export class BabySleepTrackerDB extends Dexie {
  children!: Table<Child>;
  sleepSessions!: Table<SleepSession>;
  feedingSessions!: Table<FeedingSession>;
  pumpSessions!: Table<PumpSession>;
  diaperChanges!: Table<DiaperChange>;
  growthMeasurements!: Table<GrowthMeasurement>;
  activeTimers!: Table<ActiveTimer>;
  settings!: Table<AppSettings>;

  constructor() {
    super('BabySleepTrackerDB');

    this.version(1).stores({
      // Primary key is id, indexes on syncStatus, updatedAt, childId for queries
      children: 'id, syncStatus, updatedAt, _deleted',
      sleepSessions: 'id, childId, startTime, endTime, syncStatus, updatedAt, _deleted',
      feedingSessions: 'id, childId, startTime, syncStatus, updatedAt, _deleted',
      diaperChanges: 'id, childId, time, syncStatus, updatedAt, _deleted',
      growthMeasurements: 'id, childId, date, syncStatus, updatedAt, _deleted',
      activeTimers: 'id, activityType',
      settings: 'id',
    });

    // v2: Add pump sessions table and vitaminD field on feeding sessions
    this.version(2).stores({
      children: 'id, syncStatus, updatedAt, _deleted',
      sleepSessions: 'id, childId, startTime, endTime, syncStatus, updatedAt, _deleted',
      feedingSessions: 'id, childId, startTime, syncStatus, updatedAt, _deleted',
      pumpSessions: 'id, childId, startTime, syncStatus, updatedAt, _deleted',
      diaperChanges: 'id, childId, time, syncStatus, updatedAt, _deleted',
      growthMeasurements: 'id, childId, date, syncStatus, updatedAt, _deleted',
      activeTimers: 'id, activityType',
      settings: 'id',
    });
  }
}

export const db = new BabySleepTrackerDB();

// Request persistent storage on first load
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    const granted = await navigator.storage.persist();
    console.log(`Persistent storage ${granted ? 'granted' : 'denied'}`);
    return granted;
  }
  return false;
}

// Initialize default settings if not exists
export async function initializeSettings(): Promise<AppSettings> {
  const existing = await db.settings.get('default');
  if (existing) return existing;

  const defaultSettings: AppSettings = {
    id: 'default',
    timeFormat: '12h',
    theme: 'dark',
    notificationsEnabled: false,
  };

  await db.settings.add(defaultSettings);
  return defaultSettings;
}

// Fixed child ID — every device uses this same ID so there's never a duplicate
const DEFAULT_CHILD_ID = '00000000-0000-0000-0000-000000000001';

// Get or create the single child (single-child mode)
// Uses a fixed ID so every device always references the same child
export async function getOrCreateDefaultChild(name: string = 'Baby'): Promise<Child> {
  // Check if canonical child already exists
  const existing = await db.children.get(DEFAULT_CHILD_ID);
  if (existing && !existing._deleted) {
    return existing;
  }

  const now = Date.now();

  // Migrate: find any old children and re-assign their data to the fixed ID
  const allChildren = await db.children.toArray();
  const oldChildren = allChildren.filter(c => c.id !== DEFAULT_CHILD_ID && !c._deleted);

  if (oldChildren.length > 0) {
    const oldChild = oldChildren[0]; // Use the first old child's name/birthDate
    console.log(`[Migration] Re-assigning data from ${oldChildren.length} old child(ren) to fixed ID`);

    // Collect all old child IDs
    const oldIds = oldChildren.map(c => c.id);

    // Re-assign all data tables
    const tables = [
      db.sleepSessions,
      db.feedingSessions,
      db.pumpSessions,
      db.diaperChanges,
    ] as const;

    for (const table of tables) {
      const records = await table.where('childId').anyOf(oldIds).toArray();
      for (const record of records) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (table as any).update(record.id, {
          childId: DEFAULT_CHILD_ID,
          updatedAt: now,
          syncStatus: 'pending',
        });
      }
      if (records.length > 0) {
        console.log(`[Migration] Re-assigned ${records.length} records in ${table.name}`);
      }
    }

    // Soft-delete old children
    for (const old of oldChildren) {
      await db.children.update(old.id, { _deleted: true, updatedAt: now, syncStatus: 'pending' });
    }

    // Create the canonical child using old child's info
    const canonicalChild: Child = {
      id: DEFAULT_CHILD_ID,
      name: oldChild.name,
      birthDate: oldChild.birthDate,
      createdAt: oldChild.createdAt,
      updatedAt: now,
      syncStatus: 'pending',
      _deleted: false,
    };
    await db.children.put(canonicalChild);
    return canonicalChild;
  }

  // No old children — create fresh
  const newChild: Child = {
    id: DEFAULT_CHILD_ID,
    name,
    birthDate: new Date().toISOString().split('T')[0],
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    _deleted: false,
  };

  await db.children.put(newChild);
  return newChild;
}
