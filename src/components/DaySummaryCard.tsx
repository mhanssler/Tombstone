import { Moon, Baby, Droplets, AlertCircle } from 'lucide-react';

interface DaySummaryCardProps {
  totalSleepHours: number;
  napCount: number;
  feedingCount: number;
  diaperCount: number;
  bottleCount?: number;
  totalBottleMl?: number;
  lastPoopTime?: number;
  lastPeeTime?: number;
}

// Helper to format time ago
function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return 'just now';
}

// Helper to determine if poop is overdue (more than 2 days)
function isPoopOverdue(timestamp: number | undefined): boolean {
  if (!timestamp) return false;
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
  return Date.now() - timestamp > twoDaysMs;
}

export function DaySummaryCard({
  totalSleepHours,
  napCount,
  feedingCount,
  diaperCount,
  bottleCount = 0,
  totalBottleMl = 0,
  lastPoopTime,
  lastPeeTime,
}: DaySummaryCardProps) {
  const poopOverdue = isPoopOverdue(lastPoopTime);
  
  return (
    <div className="bg-sand-900/60 rounded-2xl p-4 border border-leather-800/50 backdrop-blur-sm">
      <div className="text-sm text-sand-400 mb-3">Today's Roundup</div>
      
      <div className="grid grid-cols-4 gap-3">
        {/* Sleep */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-indigo-900/40 flex items-center justify-center mb-2">
            <Moon className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-sand-100">{totalSleepHours}h</div>
          <div className="text-xs text-sand-500">{napCount} naps</div>
        </div>

        {/* Feedings */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-red-900/40 flex items-center justify-center mb-2">
            <Baby className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-xl font-bold text-sand-100">{feedingCount}</div>
          <div className="text-xs text-sand-500">feedings</div>
        </div>

        {/* Diapers */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-lime-900/40 flex items-center justify-center mb-2">
            <Droplets className="w-5 h-5 text-lime-400" />
          </div>
          <div className="text-xl font-bold text-sand-100">{diaperCount}</div>
          <div className="text-xs text-sand-500">diapers</div>
        </div>

        {/* Bottles */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-purple-900/40 flex items-center justify-center mb-2">
            <span className="text-lg">🍼</span>
          </div>
          <div className="text-xl font-bold text-sand-100">
            {Math.round(totalBottleMl)}
            <span className="text-xs">ml</span>
          </div>
          <div className="text-xs text-sand-500">{bottleCount} bottles</div>
        </div>
      </div>
      
      {/* Last Occurrences Section */}
      <div className="mt-4 pt-3 border-t border-leather-800/30">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Last Poop */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            poopOverdue 
              ? 'bg-amber-900/30 border border-amber-600/30' 
              : 'bg-sand-800/40'
          }`}>
            <span className="text-lg">💩</span>
            <div className="flex-1">
              <div className="text-sand-400 text-xs">Last poop</div>
              <div className={`font-medium ${poopOverdue ? 'text-amber-400' : 'text-sand-200'}`}>
                {lastPoopTime ? formatTimeAgo(lastPoopTime) : 'No data'}
              </div>
            </div>
            {poopOverdue && (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            )}
          </div>
          
          {/* Last Pee */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sand-800/40">
            <span className="text-lg">💧</span>
            <div className="flex-1">
              <div className="text-sand-400 text-xs">Last pee</div>
              <div className="font-medium text-sand-200">
                {lastPeeTime ? formatTimeAgo(lastPeeTime) : 'No data'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
