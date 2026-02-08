import { useState } from 'react';
import { User, Calendar, Cloud, CloudOff, Download, Trash2, RefreshCw } from 'lucide-react';
import { useCurrentChild } from '@/hooks';
import { isSupabaseConfigured } from '@/lib/supabase';
import { syncAll, getLastGlobalSyncTime } from '@/lib/sync';
import { db } from '@/database/db';
import { formatRelativeTime } from '@/utils/time';

export function SettingsScreen() {
  const child = useCurrentChild();
  const isConfigured = isSupabaseConfigured();
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isEditingChild, setIsEditingChild] = useState(false);
  const [childName, setChildName] = useState(child?.name || '');
  const [childBirthDate, setChildBirthDate] = useState(child?.birthDate || '');

  const lastSyncTime = getLastGlobalSyncTime();

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    
    try {
      const result = await syncAll();
      if (result.success) {
        setSyncMessage(`Synced! ↑${result.totalPushed} ↓${result.totalPulled}`);
      } else {
        setSyncMessage(result.errors[0] || 'Sync failed');
      }
    } catch {
      setSyncMessage('Sync error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveChild = async () => {
    if (!child) return;

    await db.children.update(child.id, {
      name: childName,
      birthDate: childBirthDate,
      updatedAt: Date.now(),
      syncStatus: 'pending',
    });

    setIsEditingChild(false);
  };

  const handleExportData = async () => {
    const [children, sleepSessions, feedingSessions, diaperChanges] = await Promise.all([
      db.children.toArray(),
      db.sleepSessions.toArray(),
      db.feedingSessions.toArray(),
      db.diaperChanges.toArray(),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      children,
      sleepSessions,
      feedingSessions,
      diaperChanges,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sleep-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearData = async () => {
    if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
      await Promise.all([
        db.children.clear(),
        db.sleepSessions.clear(),
        db.feedingSessions.clear(),
        db.diaperChanges.clear(),
        db.activeTimers.clear(),
      ]);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-sand-950 pb-24">
      <header className="px-4 pt-4 pb-4">
        <h1 className="text-2xl western-title">Settings</h1>
      </header>

      <div className="px-4 space-y-6">
        {/* Child Profile */}
        <section className="bg-sand-900/60 rounded-2xl p-4 border border-leather-800/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-sand-100">Child Profile</h2>
          </div>

          {isEditingChild ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-sand-400 mb-1">Name</label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="input"
                  placeholder="Baby's name"
                />
              </div>
              <div>
                <label className="block text-sm text-sand-400 mb-1">Birth Date</label>
                <input
                  type="date"
                  value={childBirthDate}
                  onChange={(e) => setChildBirthDate(e.target.value)}
                  className="input"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveChild} className="btn-primary btn-md flex-1">
                  Save
                </button>
                <button
                  onClick={() => setIsEditingChild(false)}
                  className="btn-secondary btn-md flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sand-100 font-medium">{child?.name || 'Baby'}</span>
              </div>
              {child?.birthDate && (
                <div className="flex items-center gap-2 text-sm text-sand-400 mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>Born {new Date(child.birthDate).toLocaleDateString()}</span>
                </div>
              )}
              <button
                onClick={() => {
                  setChildName(child?.name || '');
                  setChildBirthDate(child?.birthDate || '');
                  setIsEditingChild(true);
                }}
                className="btn-secondary btn-sm"
              >
                Edit Profile
              </button>
            </div>
          )}
        </section>

        {/* Sync Status */}
        <section className="bg-sand-900/60 rounded-2xl p-4 border border-leather-800/50">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isConfigured && navigator.onLine ? 'bg-lime-700' : 'bg-leather-700'
            }`}>
              {isConfigured && navigator.onLine ? (
                <Cloud className="w-5 h-5 text-white" />
              ) : (
                <CloudOff className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-sand-100">Sync</h2>
              <p className="text-sm text-sand-400">
                {isConfigured 
                  ? navigator.onLine ? 'Connected' : 'Offline' 
                  : 'Not configured'}
              </p>
            </div>
          </div>

          {lastSyncTime && (
            <p className="text-sm text-sand-400 mb-3">
              Last synced {formatRelativeTime(lastSyncTime)}
            </p>
          )}

          {syncMessage && (
            <p className="text-sm text-primary-400 mb-3">{syncMessage}</p>
          )}

          <button
            onClick={handleSync}
            disabled={isSyncing || !navigator.onLine}
            className="btn-primary btn-md w-full flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>

          {!isConfigured && (
            <p className="text-xs text-sand-500 mt-2 text-center">
              Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable sync
            </p>
          )}
        </section>

        {/* Data Management */}
        <section className="bg-sand-900/60 rounded-2xl p-4 border border-leather-800/50">
          <h2 className="text-lg font-semibold text-sand-100 mb-4">Data</h2>
          
          <div className="space-y-3">
            <button
              onClick={handleExportData}
              className="btn-secondary btn-md w-full flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Backup
            </button>

            <button
              onClick={handleClearData}
              className="btn w-full btn-md bg-red-700/20 text-red-400 hover:bg-red-700/30 
                flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Data
            </button>
          </div>
        </section>

        {/* App Info */}
        <section className="text-center text-sm text-sand-500 py-4">
          <p className="western-title text-lg">Tombstone v0.1.0</p>
          <p className="mt-2 italic">"I'm your huckleberry"</p>
          <p className="mt-1">Made with 🤠 for tired parents</p>
        </section>
      </div>
    </div>
  );
}
