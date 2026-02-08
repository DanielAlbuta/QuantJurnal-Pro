import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine } from 'recharts';
import { Trade, UserProfile } from '../types';
import { generateEquityCurve, calculateMetrics, formatCurrency } from '../utils/analytics';

interface AnalyticsProps {
  trades: Trade[];
  userProfile: UserProfile;
}

const Analytics: React.FC<AnalyticsProps> = ({ trades, userProfile }) => {
  const equityData = useMemo(() => generateEquityCurve(trades, userProfile.startBalance), [trades, userProfile.startBalance]);
  const metrics = useMemo(() => calculateMetrics(trades, userProfile.startBalance), [trades, userProfile.startBalance]);
  const currency = userProfile.currency;

  // Strategy Performance Data
  const strategyData = useMemo(() => {
    const strategies: Record<string, { name: string; pnl: number; count: number }> = {};
    trades.forEach(t => {
      if (!strategies[t.strategy]) strategies[t.strategy] = { name: t.strategy, pnl: 0, count: 0 };
      strategies[t.strategy].pnl += t.netPnL;
      strategies[t.strategy].count += 1;
    });
    return Object.values(strategies).sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  // Hourly Performance Distribution
  const hourlyData = useMemo(() => {
    const hours = Array(24).fill(0).map((_, i) => ({ hour: i, pnl: 0, wins: 0, total: 0 }));
    trades.forEach(t => {
      const hour = new Date(t.entryDate).getHours();
      hours[hour].pnl += t.netPnL;
      hours[hour].total += 1;
      if (t.netPnL > 0) hours[hour].wins += 1;
    });
    return hours;
  }, [trades]);

  return (
    <div className="space-y-6">
      {/* Equity Curve */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-100 mb-6">Equity Curve</h3>
        <div className="h-[350px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityData}>
              <defs>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8" 
                tick={{fill: '#94a3b8', fontSize: 12}} 
                tickMargin={10} 
                minTickGap={30}
              />
              <YAxis 
                stroke="#94a3b8" 
                tick={{fill: '#94a3b8', fontSize: 12}} 
                tickFormatter={(val) => val >= 1000 ? `${val / 1000}k` : `${val}`}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                itemStyle={{ color: '#818cf8' }}
                formatter={(val: number) => [formatCurrency(val, currency), 'Equity']}
              />
              <Area 
                type="monotone" 
                dataKey="equity" 
                stroke="#6366f1" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorEquity)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategy Performance */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-100 mb-6">Performance by Strategy</h3>
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strategyData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : `${val}`} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={100} tick={{ fontSize: 12 }} />
                <Tooltip 
                  cursor={{fill: '#334155', opacity: 0.2}}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                  formatter={(val: number) => formatCurrency(val, currency)}
                />
                <ReferenceLine x={0} stroke="#475569" />
                <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                  {strategyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl > 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-100 mb-6">Hourly PnL Distribution</h3>
          <div className="h-[300px] w-full min-w-0">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="hour" stroke="#94a3b8" tickFormatter={(val) => `${val}:00`} interval={2} />
                <YAxis stroke="#94a3b8" tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : `${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                  formatter={(val: number) => formatCurrency(val, currency)}
                />
                <ReferenceLine y={0} stroke="#475569" />
                <Bar dataKey="pnl">
                  {hourlyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl > 0 ? '#10b981' : '#f43f5e'} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;