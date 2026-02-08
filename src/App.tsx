import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';

// Lazy load screens
const HomeScreen = lazy(() => import('@/screens/HomeScreen').then(m => ({ default: m.HomeScreen })));
const HistoryScreen = lazy(() => import('@/screens/HistoryScreen').then(m => ({ default: m.HistoryScreen })));
const StatsScreen = lazy(() => import('@/screens/StatsScreen').then(m => ({ default: m.StatsScreen })));
const SettingsScreen = lazy(() => import('@/screens/SettingsScreen').then(m => ({ default: m.SettingsScreen })));
const BottomNav = lazy(() => import('@/components/BottomNav').then(m => ({ default: m.BottomNav })));

function LoadingScreen({ message }: { message: string }) {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#32241a', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      backgroundImage: 'radial-gradient(ellipse at top, rgba(180, 83, 9, 0.1) 0%, transparent 50%)'
    }}>
      <p style={{ 
        color: '#f19132', 
        fontSize: '28px', 
        marginBottom: '10px',
        fontFamily: 'Georgia, serif',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
      }}>Tombstone</p>
      <p style={{ color: '#d4c4a8', fontSize: '14px', fontStyle: 'italic' }}>&quot;I'm your huckleberry&quot;</p>
      <p style={{ color: '#b39162', fontSize: '14px', marginTop: '20px' }}>{message}</p>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#32241a', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      padding: '20px'
    }}>
      <p style={{ color: '#dc2626', fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Error</p>
      <p style={{ color: '#dc2626', fontSize: '16px', textAlign: 'center', maxWidth: '300px' }}>{message}</p>
    </div>
  );
}

function AppContent() {
  const [status, setStatus] = useState('Starting...');
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    async function init() {
      try {
        setStatus('Loading database...');
        const dbModule = await import('@/database/db');
        
        setStatus('Requesting storage...');
        await dbModule.requestPersistentStorage();
        
        setStatus('Initializing settings...');
        await dbModule.initializeSettings();
        
        setStatus('Setting up sync...');
        // Import sync module and setup
        const syncModule = await import('@/lib/sync');
        
        // Run initial sync FIRST so remote data (child, sessions) is available locally
        // This is critical so a second device finds the existing child instead of creating a new one
        setStatus('Syncing data...');
        await syncModule.initialSync();
        
        // Setup auto-sync (on visibility/online changes)
        const cleanupAutoSync = syncModule.setupAutoSync((result) => {
          if (result.errors.length > 0) {
            console.warn('[Sync] Errors:', result.errors);
          } else if (result.totalPushed > 0 || result.totalPulled > 0) {
            console.log(`[Sync] Pushed ${result.totalPushed}, pulled ${result.totalPulled}`);
          }
        });
        
        // Setup real-time subscriptions for instant updates
        const cleanupRealtime = syncModule.setupRealtimeSync();
        
        // Store cleanup functions for later
        (window as unknown as { __syncCleanup?: () => void }).__syncCleanup = () => {
          cleanupAutoSync();
          cleanupRealtime();
        };
        
        setStatus('Ready!');
        setReady(true);
      } catch (err) {
        console.error('Init error:', err);
        setError(err instanceof Error ? err.message : String(err));
      }
    }
    init();
    
    // Cleanup on unmount
    return () => {
      const cleanup = (window as unknown as { __syncCleanup?: () => void }).__syncCleanup;
      if (cleanup) cleanup();
    };
  }, []);

  if (error) {
    return <ErrorScreen message={error} />;
  }

  if (!ready) {
    return <LoadingScreen message={status} />;
  }

  return (
    <div className="max-w-lg mx-auto bg-sand-950 min-h-screen relative">
      <Suspense fallback={<LoadingScreen message="Loading screen..." />}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
          <Route path="/stats" element={<StatsScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Routes>
        <BottomNav />
      </Suspense>
      {needRefresh && (
        <div className="fixed bottom-24 left-4 right-4 z-50 max-w-lg mx-auto">
          <div className="rounded-xl border border-red-600/50 bg-red-950/95 p-4 shadow-xl backdrop-blur-sm">
            <p className="text-sand-100 text-sm font-medium">Update available</p>
            <p className="text-sand-300 text-xs mt-1">A newer version is ready. Update now to load the latest changes.</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => updateServiceWorker(true)}
                className="flex-1 rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white"
              >
                Update now
              </button>
              <button
                type="button"
                onClick={() => setNeedRefresh(false)}
                className="rounded-lg bg-leather-800 px-3 py-2 text-sm font-medium text-sand-100"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
