import React, { useMemo } from 'react';
import { Trade, Metrics, UserProfile } from '../types';
import { calculateMetrics, formatCurrency, formatNumber, generateEquityCurve } from '../utils/analytics';
import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp, DollarSign, Target, Sparkles, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  trades: Trade[];
  userProfile: UserProfile;
  onViewJournal?: () => void;
  onPreviewTrade?: (trade: Trade) => void;
}

const StatCard: React.FC<{ 
  title: string; 
  value: string; 
  subValue?: string; 
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}> = ({ title, value, subValue, icon, trend }) => (
  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm hover:border-slate-600 transition-colors">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-700/50 rounded-lg text-slate-300">
        {icon}
      </div>
      {trend && (
        <span className={`flex items-center text-sm font-medium ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-400'}`}>
          {trend === 'up' ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
        </span>
      )}
    </div>
    <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold text-slate-100">{value}</span>
      {subValue && <span className="text-xs text-slate-500 font-mono">{subValue}</span>}
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ trades, userProfile, onViewJournal, onPreviewTrade }) => {
  const metrics = useMemo(() => calculateMetrics(trades, userProfile.startBalance), [trades, userProfile.startBalance]);
  const equityData = useMemo(() => generateEquityCurve(trades, userProfile.startBalance), [trades, userProfile.startBalance]);
  const currency = userProfile.currency;

  // Ensure consistent sorting (Newest first) regardless of insertion order
  const recentTrades = useMemo(() => {
    return [...trades].sort((a, b) => b.entryDate - a.entryDate).slice(0, 5);
  }, [trades]);

  return (
    <div className="space-y-6">
      <header className="mb-8 rounded-2xl p-8 gradient-header-bg border border-slate-800/50 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Performance Overview</h1>
            <Sparkles className="w-5 h-5 text-indigo-400 opacity-75" />
          </div>
          <p className="text-slate-300 max-w-xl text-lg font-light leading-relaxed">
            Real-time trading analytics and journal for <span className="text-indigo-200 font-medium">{userProfile.name}</span> <span className="text-indigo-200 font-mono font-medium bg-indigo-900/30 px-2 py-0.5 rounded border border-indigo-500/30 text-sm align-middle ml-1">{userProfile.accountType}</span>
          </p>
        </div>
        
        {/* Abstract decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/5 rounded-full blur-2xl transform -translate-x-1/3 translate-y-1/3"></div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Net Profit" 
          value={formatCurrency(metrics.netProfit, currency)} 
          subValue={`${metrics.totalTrades} Trades`}
          icon={<DollarSign className="w-5 h-5" />}
          trend={metrics.netProfit > 0 ? 'up' : 'down'}
        />
        <StatCard 
          title="Profit Factor" 
          value={formatNumber(metrics.profitFactor)} 
          subValue={`Win Rate: ${formatNumber(metrics.winRate)}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={metrics.profitFactor > 1.5 ? 'up' : 'neutral'}
        />
        <StatCard 
          title="Average R" 
          value={`${formatNumber(metrics.expectancy / metrics.averageLoss || 0)}R`} 
          subValue={`Exp: ${formatCurrency(metrics.expectancy, currency)}`}
          icon={<Target className="w-5 h-5" />}
          trend="up"
        />
        <StatCard 
          title="Max Drawdown" 
          value={`${formatNumber(metrics.maxDrawdownPercent)}%`} 
          subValue={formatCurrency(metrics.maxDrawdown, currency)}
          icon={<Activity className="w-5 h-5" />}
          trend="down"
        />
      </div>

      {/* Equity Chart - Main Visual */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-100">Account Growth</h3>
            <div className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-700">All Time</div>
        </div>
        <div className="h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityData}>
              <defs>
                <linearGradient id="colorEquityDash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8" 
                tick={{fill: '#94a3b8', fontSize: 10}} 
                tickMargin={10} 
                minTickGap={50}
                hide={true} // Cleaner look for dashboard
              />
              <YAxis 
                stroke="#94a3b8" 
                tick={{fill: '#94a3b8', fontSize: 11}} 
                tickFormatter={(val) => val >= 1000 ? `${val / 1000}k` : `${val}`}
                domain={['auto', 'auto']}
                width={40}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                itemStyle={{ color: '#818cf8' }}
                formatter={(val: number) => [formatCurrency(val, currency), 'Equity']}
                labelStyle={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}
              />
              <Area 
                type="monotone" 
                dataKey="equity" 
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorEquityDash)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold text-slate-100">Recent Activity</h3>
             {onViewJournal && (
               <button 
                 onClick={onViewJournal}
                 className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
               >
                 View Journal <ArrowRight className="w-4 h-4" />
               </button>
             )}
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-700">
                  <th className="pb-3 pl-2">Symbol</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Setup</th>
                  <th className="pb-3 text-right">R-Mult</th>
                  <th className="pb-3 text-right pr-2">PnL</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentTrades.map(trade => (
                  <tr 
                    key={trade.id} 
                    onClick={() => onPreviewTrade && onPreviewTrade(trade)}
                    className="border-b border-slate-700/50 hover:bg-slate-700/40 transition-colors cursor-pointer group"
                    title="Click to view details"
                  >
                    <td className="py-3 pl-2 font-mono text-slate-300 font-medium group-hover:text-indigo-300 transition-colors">{trade.symbol}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${trade.direction === 'LONG' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{trade.setup}</td>
                    <td className={`py-3 text-right font-mono ${trade.riskMultiple > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {trade.riskMultiple > 0 ? '+' : ''}{trade.riskMultiple}R
                    </td>
                    <td className={`py-3 text-right font-mono pr-2 font-bold ${trade.netPnL > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(trade.netPnL, currency)}
                    </td>
                  </tr>
                ))}
                {recentTrades.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">No trades recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Psychology / Mini Stats */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Psychology Check</h3>
              <div className="space-y-4">
                <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-700/50">
                  <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Current Streak</div>
                  <div className={`text-3xl font-bold ${metrics.currentStreak > 0 ? 'text-emerald-400' : metrics.currentStreak < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {metrics.currentStreak > 0 ? `+${metrics.currentStreak} Wins` : metrics.currentStreak < 0 ? `${metrics.currentStreak} Losses` : 'Neutral'}
                  </div>
                </div>
                 <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-700/50">
                  <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Win Rate (Last 20)</div>
                  <div className="text-3xl font-bold text-slate-100">
                    {formatNumber(calculateMetrics(trades.slice(-20), userProfile.startBalance).winRate)}%
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-slate-400">Avg Win</span>
                    <span className="text-emerald-400 font-mono">{formatCurrency(metrics.averageWin, currency)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Avg Loss</span>
                    <span className="text-rose-400 font-mono">{formatCurrency(metrics.averageLoss, currency)}</span>
                </div>
                 {/* Mini Bar Visual */}
                 <div className="mt-3 flex h-2 rounded-full overflow-hidden bg-slate-700">
                    <div className="bg-emerald-500" style={{ width: `${(metrics.averageWin / (metrics.averageWin + metrics.averageLoss)) * 100}%` }}></div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;