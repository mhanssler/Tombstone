import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/database/db';
import { useCurrentChild } from '@/hooks';

interface DayData {
  date: string;
  sleepHours: number;
  naps: number;
  feedings: number;
  bottleMl: number;
  vitaminDCount: number;
  diapers: number;
  wet: number;
  dirty: number;
  pumpSessions: number;
  pumpMl: number;
}

const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#32241a',
    border: '1px solid #72543d',
    borderRadius: '8px',
    fontSize: '13px',
  },
  labelStyle: { color: '#d4c4a8' },
};

const axisProps = {
  axisLine: false as const,
  tickLine: false as const,
  tick: { fill: '#b39162', fontSize: 12 },
};

export function StatsScreen() {
  const child = useCurrentChild();

  // Get last 14 days of all data
  const allData = useLiveQuery(async () => {
    if (!child) return [];

    const days: DayData[] = [];
    const today = new Date();

    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const startMs = startOfDay.getTime();
      const endMs = endOfDay.getTime();

      // Sleep data
      const sleepSessions = await db.sleepSessions
        .where('childId')
        .equals(child.id)
        .and(s => !s._deleted && s.startTime >= startMs && s.startTime <= endMs)
        .toArray();

      const totalSleepMs = sleepSessions.reduce((sum, s) => {
        if (s.endTime) return sum + (s.endTime - s.startTime);
        return sum;
      }, 0);
      const napCount = sleepSessions.filter(s => s.type === 'nap' && s.endTime).length;

      // Feeding data
      const feedingSessions = await db.feedingSessions
        .where('childId')
        .equals(child.id)
        .and(f => !f._deleted && f.startTime >= startMs && f.startTime <= endMs)
        .toArray();

      const bottleMl = feedingSessions
        .filter(f => f.type === 'bottle')
        .reduce((sum, f) => sum + (f.amount || 0), 0);

      const vitaminDCount = feedingSessions.filter(f => f.vitaminD).length;

      // Diaper data
      const diaperChanges = await db.diaperChanges
        .where('childId')
        .equals(child.id)
        .and(d => !d._deleted && d.time >= startMs && d.time <= endMs)
        .toArray();

      const wetCount = diaperChanges.filter(d => d.type === 'wet' || d.type === 'both').length;
      const dirtyCount = diaperChanges.filter(d => d.type === 'dirty' || d.type === 'both').length;

      // Pump data
      const pumpSessions = await db.pumpSessions
        .where('childId')
        .equals(child.id)
        .and(p => !p._deleted && p.startTime >= startMs && p.startTime <= endMs)
        .toArray();

      const pumpMl = pumpSessions.reduce((sum, p) => sum + (p.amount || 0), 0);

      days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sleepHours: Math.round((totalSleepMs / (1000 * 60 * 60)) * 10) / 10,
        naps: napCount,
        feedings: feedingSessions.length,
        bottleMl: Math.round(bottleMl),
        vitaminDCount,
        diapers: diaperChanges.length,
        wet: wetCount,
        dirty: dirtyCount,
        pumpSessions: pumpSessions.length,
        pumpMl: Math.round(pumpMl),
      });
    }

    return days;
  }, [child?.id]);

  // Calculate averages
  const averages = useMemo(() => {
    if (!allData || allData.length === 0) {
      return { avgSleep: 0, avgNaps: 0, avgFeedings: 0, avgDiapers: 0, avgPumpMl: 0 };
    }

    const len = allData.length;
    return {
      avgSleep: Math.round((allData.reduce((s, d) => s + d.sleepHours, 0) / len) * 10) / 10,
      avgNaps: Math.round((allData.reduce((s, d) => s + d.naps, 0) / len) * 10) / 10,
      avgFeedings: Math.round((allData.reduce((s, d) => s + d.feedings, 0) / len) * 10) / 10,
      avgDiapers: Math.round((allData.reduce((s, d) => s + d.diapers, 0) / len) * 10) / 10,
      avgPumpMl: Math.round(allData.reduce((s, d) => s + d.pumpMl, 0) / len),
    };
  }, [allData]);

  return (
    <div className="min-h-screen bg-sand-950 pb-24">
      <header className="px-4 pt-4 pb-4">
        <h1 className="text-2xl western-title">Statistics</h1>
        <p className="text-sand-400 text-sm">Last 14 days — trends at a glance</p>
      </header>

      <div className="px-4 space-y-6">
        {/* Averages Row */}
        <div className="grid grid-cols-5 gap-2">
          <div className="bg-sand-900/60 rounded-2xl p-3 border border-leather-800/50 text-center">
            <div className="text-xs text-sand-400 mb-1">Sleep</div>
            <div className="text-xl font-bold text-indigo-400">{averages.avgSleep}h</div>
          </div>
          <div className="bg-sand-900/60 rounded-2xl p-3 border border-leather-800/50 text-center">
            <div className="text-xs text-sand-400 mb-1">Naps</div>
            <div className="text-xl font-bold text-amber-400">{averages.avgNaps}</div>
          </div>
          <div className="bg-sand-900/60 rounded-2xl p-3 border border-leather-800/50 text-center">
            <div className="text-xs text-sand-400 mb-1">Feeds</div>
            <div className="text-xl font-bold text-red-400">{averages.avgFeedings}</div>
          </div>
          <div className="bg-sand-900/60 rounded-2xl p-3 border border-leather-800/50 text-center">
            <div className="text-xs text-sand-400 mb-1">Diapers</div>
            <div className="text-xl font-bold text-lime-400">{averages.avgDiapers}</div>
          </div>
          <div className="bg-sand-900/60 rounded-2xl p-3 border border-leather-800/50 text-center">
            <div className="text-xs text-sand-400 mb-1">Pump</div>
            <div className="text-xl font-bold text-purple-400">{averages.avgPumpMl}<span className="text-xs">ml</span></div>
          </div>
        </div>

        {/* Sleep Trend - Line Chart */}
        <div className="bg-sand-900/60 rounded-2xl p-4 border border-leather-800/50">
          <h2 className="text-lg font-semibold text-sand-100 mb-1">Sleep Trend</h2>
          <p className="text-xs text-sand-500 mb-3">Total hours per day</p>

          {allData && allData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={allData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#72543d30" />
                  <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" />
                  <YAxis {...axisProps} width={30} />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(value: number) => [`${value}h`, 'Sleep']}
                  />
                  <Line
                    type="monotone"
                    dataKey="sleepHours"
                    stroke="#818cf8"
                    strokeWidth={2.5}
                    dot={{ fill: '#818cf8', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-sand-400">No data available</div>
          )}
        </div>

        {/* Nap Count - Bar Chart */}
        <div className="bg-sand-900/60 rounded-2xl p-4 border border-leather-800/50">
          <h2 className="text-lg font-semibold text-sand-100 mb-1">Naps Per Day</h2>
          <p className="text-xs text-sand-500 mb-3">Daily nap count</p>

          {allData && allData.length > 0 ? (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={allData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#72543d30" />
                  <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" />
                  <YAxis {...axisProps} width={25} allowDecimals={false} />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(value: number) => [value, 'Naps']}
                  />
                  <Bar dataKey="naps" fill="#fbbf24" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-sand-400">No data available</div>
          )}
        </div>

        {/* Feedings - Line + Bar */}
        <div className="bg-sand-900/60 rounded-2xl p-4 border border-leather-800/50">
          <h2 className="text-lg font-semibold text-sand-100 mb-1">Feedings</h2>
          <p className="text-xs text-sand-500 mb-3">Count per day</p>

          {allData && allData.length > 0 ? (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={allData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#72543d30" />
                  <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" />
                  <YAxis {...axisProps} width={25} allowDecimals={false} />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(value: number) => [value, 'Feedings']}
                  />
                  <Line
                    type="monotone"
                    dataKey="feedings"
                    stroke="#f87171"
                    strokeWidth={2.5}
                    dot={{ fill: '#f87171', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-sand-400">No data available</div>
          )}
        </div>

        {/* Bottle Volume - Bar Chart */}
        <div className="bg-sand-900/60 rounded-2xl p-4 border border-leather-800/50">
          <h2 className="text-lg font-semibold text-sand-100 mb-1">Bottle Volume</h2>
          <p className="text-xs text-sand-500 mb-3">Total ml per day</p>

          {allData && allData.length > 0 ? (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={allData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#72543d30" />
                  <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" />
                  <YAxis {...axisProps} width={35} />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(value: number) => [`${value}ml`, 'Bottle']}
                  />
                  <Bar dataKey="bottleMl" fill="#fb923c" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-sand-400">No data available</div>
          )}
        </div>

        {/* Pump Output - Line + Bar */}
        <div className="bg-sand-900/60 rounded-2xl p-4 border border-leather-800/50">
          <h2 className="text-lg font-semibold text-sand-100 mb-1">Pump Output</h2>
          <p className="text-xs text-sand-500 mb-3">Total ml pumped per day</p>

          {allData && allData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={allData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#72543d30" />
                  <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" />
                  <YAxis {...axisProps} width={35} />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(value: number, name: string) => {
                      if (name === 'pumpMl') return [`${value}ml`, 'Volume'];
                      return [value, 'Sessions'];
                    }}
                  />
                  <Bar dataKey="pumpMl" fill="#a78bfa" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-sand-400">No data available</div>
          )}
        </div>

        {/* Diapers - Stacked Bar */}
        <div className="bg-sand-900/60 rounded-2xl p-4 border border-leather-800/50">
          <h2 className="text-lg font-semibold text-sand-100 mb-1">Diapers</h2>
          <p className="text-xs text-sand-500 mb-3">Wet vs Dirty per day</p>

          {allData && allData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={allData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#72543d30" />
                  <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" />
                  <YAxis {...axisProps} width={25} allowDecimals={false} />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(value: number, name: string) => {
                      if (name === 'wet') return [value, 'Wet'];
                      return [value, 'Dirty'];
                    }}
                  />
                  <Bar dataKey="wet" stackId="diapers" fill="#84cc16" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="dirty" stackId="diapers" fill="#a16207" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-sand-400">No data available</div>
          )}
        </div>
      </div>
    </div>
  );
}
