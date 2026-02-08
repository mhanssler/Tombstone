import { Heart, Activity, Battery, Wifi, WifiOff } from 'lucide-react';
import { formatRelativeTime } from '@/utils/time';
import type { OwletReading } from '@/types';

interface OwletStatusCardProps {
  reading?: OwletReading;
}

function formatValue(value?: number, suffix: string = ''): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '--';
  return `${value}${suffix}`;
}

export function OwletStatusCard({ reading }: OwletStatusCardProps) {
  if (!reading) {
    return (
      <section className="bg-sand-900/60 rounded-2xl p-4 border border-leather-800/50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-sand-100">Owlet Live</h2>
          <span className="text-xs text-sand-500">No data yet</span>
        </div>
        <p className="text-sm text-sand-400">
          Waiting for bridge data. Start `scripts/owlet_bridge.py` to stream readings.
        </p>
      </section>
    );
  }

  const readingAgeMs = Date.now() - reading.recordedAt;
  const isStale = readingAgeMs > 1000 * 60 * 5;
  const isSockConnected = reading.sockConnected === true;

  return (
    <section className="bg-sand-900/60 rounded-2xl p-4 border border-leather-800/50">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-sand-100">Owlet Live</h2>
        <span className={`text-xs ${isStale ? 'text-amber-400' : 'text-lime-400'}`}>
          Updated {formatRelativeTime(reading.recordedAt)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-sand-950/60 p-3 border border-leather-800/40">
          <div className="flex items-center gap-2 text-sand-400 text-xs uppercase tracking-wide">
            <Heart className="w-4 h-4 text-red-400" />
            Heart Rate
          </div>
          <div className="text-sand-100 text-xl font-semibold mt-1">{formatValue(reading.heartRateBpm, ' bpm')}</div>
        </div>

        <div className="rounded-xl bg-sand-950/60 p-3 border border-leather-800/40">
          <div className="flex items-center gap-2 text-sand-400 text-xs uppercase tracking-wide">
            <Activity className="w-4 h-4 text-blue-400" />
            Oxygen
          </div>
          <div className="text-sand-100 text-xl font-semibold mt-1">{formatValue(reading.oxygenSaturationPct, '%')}</div>
        </div>

        <div className="rounded-xl bg-sand-950/60 p-3 border border-leather-800/40">
          <div className="flex items-center gap-2 text-sand-400 text-xs uppercase tracking-wide">
            <Battery className="w-4 h-4 text-amber-400" />
            Sock Battery
          </div>
          <div className="text-sand-100 text-xl font-semibold mt-1">{formatValue(reading.batteryPct, '%')}</div>
        </div>

        <div className="rounded-xl bg-sand-950/60 p-3 border border-leather-800/40">
          <div className="flex items-center gap-2 text-sand-400 text-xs uppercase tracking-wide">
            {isSockConnected ? <Wifi className="w-4 h-4 text-lime-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
            Sock Link
          </div>
          <div className="text-sand-100 text-xl font-semibold mt-1">{isSockConnected ? 'Connected' : 'Disconnected'}</div>
        </div>
      </div>
    </section>
  );
}
