import { Heart, Activity, Battery, Wifi, WifiOff, Moon, Baby } from 'lucide-react';
import { formatRelativeTime } from '@/utils/time';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import type { OwletReading } from '@/types';

interface OwletStatusCardProps {
  reading?: OwletReading;
  trendReadings?: OwletReading[];
}

function formatValue(value?: number, suffix: string = ''): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '--';
  return `${value}${suffix}`;
}

export function OwletStatusCard({ reading, trendReadings = [] }: OwletStatusCardProps) {
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
  const isStale = readingAgeMs > 1000 * 60 * 1;
  const isSockConnected = reading.sockConnected === true;
  const sleepState = reading.sleepState || 'unknown';
  const isSockOffOrUnknown = !isSockConnected || sleepState === 'unknown';
  const trendData = trendReadings
    .map(item => ({
      ts: item.recordedAt,
      label: new Date(item.recordedAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
      hr: item.heartRateBpm,
      o2: item.oxygenSaturationPct,
    }))
    .filter(item => item.hr !== undefined || item.o2 !== undefined);

  return (
    <section className="bg-sand-900/60 rounded-2xl p-4 border border-leather-800/50">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-sand-100">Owlet Live</h2>
        <span className={`text-xs ${isStale ? 'text-amber-400' : 'text-lime-400'}`}>
          Updated {formatRelativeTime(reading.recordedAt)}
        </span>
      </div>

      {(isStale || isSockOffOrUnknown) && (
        <div className="mb-3 rounded-xl border border-leather-800/40 bg-sand-950/50 px-3 py-2 text-sm text-sand-300">
          {isStale && (
            <div>
              No recent readings. If you expect live data, make sure the bridge is running.
            </div>
          )}
          {!isSockConnected && (
            <div className={isStale ? 'mt-1' : ''}>
              Sock looks disconnected/off. Put the sock on and ensure it is connected in the Owlet app.
            </div>
          )}
        </div>
      )}

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

        <div className="rounded-xl bg-sand-950/60 p-3 border border-leather-800/40">
          <div className="flex items-center gap-2 text-sand-400 text-xs uppercase tracking-wide">
            <Moon className="w-4 h-4 text-indigo-300" />
            Sleep Status
          </div>
          <div className="text-sand-100 text-xl font-semibold mt-1">
            {sleepState === 'asleep' ? 'Asleep' : sleepState === 'awake' ? 'Awake' : 'Unknown'}
          </div>
        </div>

        <div className="rounded-xl bg-sand-950/60 p-3 border border-leather-800/40">
          <div className="flex items-center gap-2 text-sand-400 text-xs uppercase tracking-wide">
            <Baby className="w-4 h-4 text-emerald-300" />
            Sock Worn
          </div>
          <div className="text-sand-100 text-xl font-semibold mt-1">{isSockConnected ? 'Yes' : 'No'}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-sand-300">Last 60 min trend</h3>
          <span className="text-xs text-sand-500">{trendData.length} points</span>
        </div>
        {trendData.length > 1 ? (
          <div className="h-36 rounded-xl bg-sand-950/60 border border-leather-800/40 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#72543d30" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#b39162', fontSize: 11 }}
                  minTickGap={24}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#fca5a5', fontSize: 11 }}
                  width={28}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#93c5fd', fontSize: 11 }}
                  width={28}
                  domain={[80, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#32241a',
                    border: '1px solid #72543d',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#d4c4a8' }}
                  formatter={(value: number | string, key: string) => {
                    if (key === 'hr') return [`${value ?? '--'} bpm`, 'Heart Rate'];
                    if (key === 'o2') return [`${value ?? '--'}%`, 'Oxygen'];
                    return [value, key];
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="hr"
                  stroke="#f87171"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="o2"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-xl bg-sand-950/60 border border-leather-800/40 p-3 text-sm text-sand-400">
            Not enough trend data yet.
          </div>
        )}
      </div>
    </section>
  );
}
