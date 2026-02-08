import { Table } from 'dexie';
import { db } from '@/database/db';
import { getSupabase, isSupabaseConfigured } from './supabase';
import type { SyncableEntity } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

type TableName = 'children' | 'sleep_sessions' | 'feeding_sessions' | 'pump_sessions' | 'diaper_changes' | 'growth_measurements' | 'owlet_readings';

interface SyncResult {
  pushed: number;
  pulled: number;
  errors: string[];
}

// Debounced sync - triggers shortly after data changes
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let syncPromise: Promise<void> | null = null;

export function triggerSync(): void {
  if (!isSupabaseConfigured() || !navigator.onLine) return;
  
  // Debounce: wait 2 seconds after last change before syncing
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  
  syncTimeout = setTimeout(async () => {
    // Prevent multiple simultaneous syncs
    if (syncPromise) {
      await syncPromise;
    }
    
    syncPromise = (async () => {
      try {
        const result = await syncAll();
        if (result.totalPushed > 0 || result.totalPulled > 0) {
          console.log(`[Sync] Auto-pushed ${result.totalPushed}, pulled ${result.totalPulled}`);
        }
      } catch (err) {
        console.error('[Sync] Auto-sync failed:', err);
      } finally {
        syncPromise = null;
      }
    })();
  }, 2000);
}

// Map local table names to Supabase table names
const tableMapping: Record<string, TableName> = {
  children: 'children',
  sleepSessions: 'sleep_sessions',
  feedingSessions: 'feeding_sessions',
  pumpSessions: 'pump_sessions',
  diaperChanges: 'diaper_changes',
  growthMeasurements: 'growth_measurements',
  owletReadings: 'owlet_readings',
};

// Get the last sync timestamp for a table
function getLastSyncTime(tableName: string): number {
  const key = `lastSync_${tableName}`;
  const stored = localStorage.getItem(key);
  return stored ? parseInt(stored, 10) : 0;
}

// Set the last sync timestamp for a table
function setLastSyncTime(tableName: string, time: number): void {
  const key = `lastSync_${tableName}`;
  localStorage.setItem(key, time.toString());
}

// Push pending local changes to Supabase
async function pushChanges<T extends SyncableEntity>(
  localTable: Table<T, string>,
  remoteTableName: TableName
): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  
  // Get all pending records
  const pendingRecords = await localTable
    .where('syncStatus')
    .equals('pending')
    .toArray();

  if (pendingRecords.length === 0) {
    return { count: 0, errors };
  }

  // Upsert to Supabase
  const { error } = await getSupabase()
    .from(remoteTableName)
    .upsert(pendingRecords, { onConflict: 'id' });

  if (error) {
    errors.push(`Push error for ${remoteTableName}: ${error.message}`);
    return { count: 0, errors };
  }

  // Mark as synced locally
  const ids = pendingRecords.map((r: T) => r.id);
  await localTable
    .where('id')
    .anyOf(ids)
    .modify((record: T) => {
      record.syncStatus = 'synced';
    });

  return { count: pendingRecords.length, errors };
}

// Pull remote changes using Last-Write-Wins
async function pullChanges<T extends SyncableEntity>(
  localTable: Table<T, string>,
  remoteTableName: TableName
): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  const lastSync = getLastSyncTime(remoteTableName);

  // Fetch records updated since last sync (if lastSync is 0, fetch ALL records)
  let query = getSupabase()
    .from(remoteTableName)
    .select('*');

  if (lastSync > 0) {
    query = query.gt('updatedAt', lastSync);
  }

  const { data: remoteRecords, error } = await query;

  if (error) {
    errors.push(`Pull error for ${remoteTableName}: ${error.message}`);
    return { count: 0, errors };
  }

  if (!remoteRecords || remoteRecords.length === 0) {
    return { count: 0, errors };
  }

  let updated = 0;

  // Apply Last-Write-Wins conflict resolution
  for (const remote of remoteRecords as T[]) {
    const local = await localTable.get(remote.id);

    if (!local || remote.updatedAt > local.updatedAt) {
      // Remote is newer or doesn't exist locally - apply it
      await localTable.put({ ...remote, syncStatus: 'synced' as const });
      updated++;
    }
    // If local is newer, we keep local (it will be pushed on next sync)
  }

  // Update last sync time to the newest record's updatedAt
  const maxUpdatedAt = Math.max(...remoteRecords.map((r: T) => r.updatedAt));
  setLastSyncTime(remoteTableName, maxUpdatedAt);

  return { count: updated, errors };
}

// Full sync for a single table
async function syncTable<T extends SyncableEntity>(
  localTableName: string,
  localTable: Table<T, string>
): Promise<SyncResult> {
  const remoteTableName = tableMapping[localTableName];
  if (!remoteTableName) {
    return { pushed: 0, pulled: 0, errors: [`Unknown table: ${localTableName}`] };
  }

  const pushResult = await pushChanges(localTable, remoteTableName);
  const pullResult = await pullChanges(localTable, remoteTableName);

  return {
    pushed: pushResult.count,
    pulled: pullResult.count,
    errors: [...pushResult.errors, ...pullResult.errors],
  };
}

// Main sync function - syncs all tables
export async function syncAll(): Promise<{
  success: boolean;
  results: Record<string, SyncResult>;
  totalPushed: number;
  totalPulled: number;
  errors: string[];
}> {
  if (!isSupabaseConfigured()) {
    return {
      success: true,
      results: {},
      totalPushed: 0,
      totalPulled: 0,
      errors: ['Supabase not configured - running in offline-only mode'],
    };
  }

  // Check if we're online
  if (!navigator.onLine) {
    return {
      success: false,
      results: {},
      totalPushed: 0,
      totalPulled: 0,
      errors: ['No network connection'],
    };
  }

  const results: Record<string, SyncResult> = {};
  const allErrors: string[] = [];
  let totalPushed = 0;
  let totalPulled = 0;

  try {
    // Sync each table
    results.children = await syncTable('children', db.children);
    results.sleepSessions = await syncTable('sleepSessions', db.sleepSessions);
    results.feedingSessions = await syncTable('feedingSessions', db.feedingSessions);
    results.pumpSessions = await syncTable('pumpSessions', db.pumpSessions);
    results.diaperChanges = await syncTable('diaperChanges', db.diaperChanges);
    results.growthMeasurements = await syncTable('growthMeasurements', db.growthMeasurements);
    results.owletReadings = await syncTable('owletReadings', db.owletReadings);

    // Aggregate results
    for (const result of Object.values(results)) {
      totalPushed += result.pushed;
      totalPulled += result.pulled;
      allErrors.push(...result.errors);
    }

    // Update global last sync time
    if (allErrors.length === 0) {
      localStorage.setItem('lastGlobalSync', Date.now().toString());
    }

    return {
      success: allErrors.length === 0,
      results,
      totalPushed,
      totalPulled,
      errors: allErrors,
    };
  } catch (error) {
    return {
      success: false,
      results,
      totalPushed,
      totalPulled,
      errors: [error instanceof Error ? error.message : 'Unknown sync error'],
    };
  }
}

// Get last global sync time
export function getLastGlobalSyncTime(): number | null {
  const stored = localStorage.getItem('lastGlobalSync');
  return stored ? parseInt(stored, 10) : null;
}

// Run an initial sync (awaitable) — use this during app startup
// to ensure remote data is available before creating local records
export async function initialSync(): Promise<void> {
  if (!isSupabaseConfigured() || !navigator.onLine) return;

  try {
    const result = await syncAll();
    if (result.errors.length > 0) {
      console.warn('[Sync] Initial sync errors:', result.errors);
    } else {
      console.log(`[Sync] Initial sync complete: pushed ${result.totalPushed}, pulled ${result.totalPulled}`);
    }

    // After sync, merge any duplicate children so all devices share one child
    await mergeChildren();
  } catch (err) {
    console.warn('[Sync] Initial sync failed:', err);
  }
}

// Fixed child ID — must match the one in db.ts
const DEFAULT_CHILD_ID = '00000000-0000-0000-0000-000000000001';

// Migrate Supabase: re-assign all data from old random child IDs to the fixed ID
// This runs once on startup to clean up the mess of multiple children
async function mergeChildren(): Promise<void> {
  if (!isSupabaseConfigured() || !navigator.onLine) return;

  try {
    // Get all children from Supabase
    const { data: allChildren, error } = await getSupabase()
      .from('children')
      .select('*')
      .eq('_deleted', false);

    if (error || !allChildren || allChildren.length === 0) return;

    // Collect IDs of old children that aren't the fixed one
    const oldIds = allChildren
      .filter((c: { id: string }) => c.id !== DEFAULT_CHILD_ID)
      .map((c: { id: string }) => c.id);

    if (oldIds.length === 0) return; // Nothing to migrate

    console.log(`[Merge] Found ${oldIds.length} old child ID(s) to migrate to fixed ID`);
    const now = Date.now();

    // Use the first old child's info for the canonical record (name, birthDate)
    const oldChild = allChildren.find((c: { id: string }) => c.id !== DEFAULT_CHILD_ID) || allChildren[0];

    // Re-assign all data in Supabase from old child IDs to the fixed ID
    const dataTables = ['sleep_sessions', 'feeding_sessions', 'pump_sessions', 'diaper_changes', 'owlet_readings'] as const;

    for (const table of dataTables) {
      const { data: records, error: fetchError } = await getSupabase()
        .from(table)
        .select('*')
        .in('childId', oldIds);

      if (fetchError || !records || records.length === 0) continue;

      console.log(`[Merge] Re-assigning ${records.length} records in ${table} to fixed child ID`);

      const updated = records.map((r: Record<string, unknown>) => ({
        ...r,
        childId: DEFAULT_CHILD_ID,
        updatedAt: now,
      }));

      await getSupabase()
        .from(table)
        .upsert(updated, { onConflict: 'id' });
    }

    // Upsert the canonical child record into Supabase
    await getSupabase()
      .from('children')
      .upsert({
        id: DEFAULT_CHILD_ID,
        name: oldChild.name,
        birthDate: oldChild.birthDate,
        createdAt: oldChild.createdAt,
        updatedAt: now,
        syncStatus: 'synced',
        _deleted: false,
      }, { onConflict: 'id' });

    // Soft-delete old children in Supabase
    for (const oldId of oldIds) {
      await getSupabase()
        .from('children')
        .update({ _deleted: true, updatedAt: now })
        .eq('id', oldId);
    }

    console.log(`[Merge] Migration complete. All data under fixed child ID.`);

    // Final sync to pull the cleaned-up state
    await syncAll();
  } catch (err) {
    console.error('[Merge] Failed to merge children:', err);
  }
}

// Setup auto-sync on network/visibility changes AND periodic interval
export function setupAutoSync(onSyncComplete?: (result: Awaited<ReturnType<typeof syncAll>>) => void): () => void {
  if (!isSupabaseConfigured()) {
    console.log('[Sync] Supabase not configured - auto-sync disabled');
    return () => {};
  }

  const handleSync = async () => {
    const result = await syncAll();
    onSyncComplete?.(result);
  };

  // Sync when coming online
  window.addEventListener('online', handleSync);

  // Sync when app becomes visible
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      handleSync();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Initial sync
  handleSync();

  // Periodic sync every 30 seconds
  const intervalId = setInterval(() => {
    if (navigator.onLine && document.visibilityState === 'visible') {
      handleSync();
    }
  }, 10000);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleSync);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    clearInterval(intervalId);
  };
}

// Map Supabase table names to local Dexie tables
const localTableMapping: Record<TableName, keyof typeof db> = {
  children: 'children',
  sleep_sessions: 'sleepSessions',
  feeding_sessions: 'feedingSessions',
  pump_sessions: 'pumpSessions',
  diaper_changes: 'diaperChanges',
  growth_measurements: 'growthMeasurements',
  owlet_readings: 'owletReadings',
};

// Handle real-time database changes from Supabase
async function handleRealtimeChange<T extends SyncableEntity>(
  tableName: TableName,
  payload: { eventType: string; new?: Record<string, unknown>; old?: Record<string, unknown> }
) {
  const localTableName = localTableMapping[tableName];
  const localTable = db[localTableName] as Table<T, string>;

  if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
    const record = payload.new as T;
    if (!record?.id) return;
    
    const local = await localTable.get(record.id);

    // Only update if remote is newer or doesn't exist locally
    if (!local || record.updatedAt > local.updatedAt) {
      await localTable.put({ ...record, syncStatus: 'synced' as const });
      console.log(`[Realtime] ${payload.eventType} ${tableName}:`, record.id);
    }
  } else if (payload.eventType === 'DELETE') {
    const oldRecord = payload.old as Partial<T>;
    if (oldRecord?.id) {
      await localTable.delete(oldRecord.id);
      console.log(`[Realtime] DELETE ${tableName}:`, oldRecord.id);
    }
  }
}

// Setup real-time subscriptions for instant updates between devices
let realtimeChannel: RealtimeChannel | null = null;

export function setupRealtimeSync(): () => void {
  if (!isSupabaseConfigured()) {
    console.log('[Realtime] Supabase not configured - skipping realtime setup');
    return () => {};
  }

  // Clean up existing subscription
  if (realtimeChannel) {
    getSupabase().removeChannel(realtimeChannel);
  }

  // Subscribe to all relevant tables
  realtimeChannel = getSupabase()
    .channel('db-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'children' },
      (payload) => handleRealtimeChange('children', payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sleep_sessions' },
      (payload) => handleRealtimeChange('sleep_sessions', payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'feeding_sessions' },
      (payload) => handleRealtimeChange('feeding_sessions', payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pump_sessions' },
      (payload) => handleRealtimeChange('pump_sessions', payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'diaper_changes' },
      (payload) => handleRealtimeChange('diaper_changes', payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'growth_measurements' },
      (payload) => handleRealtimeChange('growth_measurements', payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'owlet_readings' },
      (payload) => handleRealtimeChange('owlet_readings', payload)
    )
    .subscribe((status) => {
      console.log('[Realtime] Subscription status:', status);
    });

  // Return cleanup function
  return () => {
    if (realtimeChannel) {
      getSupabase().removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  };
}



