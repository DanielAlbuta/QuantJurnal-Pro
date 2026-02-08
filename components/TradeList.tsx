import React, { useState, useRef, useEffect } from 'react';
import { Trade, Direction, AssetClass, UserProfile } from '../types';
import { formatCurrency, getTradeViolations } from '../utils/analytics';
import { Filter, Search, ChevronDown, ChevronUp, Edit2, Image as ImageIcon, Eye, Trash2, AlertTriangle, X, Check, Calendar, List as ListIcon } from 'lucide-react';

interface TradeListProps {
  trades: Trade[];
  userProfile?: UserProfile;
  onAddTrade?: () => void;
  onEditTrade?: (trade: Trade) => void;
  onDeleteTrade?: (id: string) => void;
  onDeleteAll?: () => void;
  onPreviewTrade?: (trade: Trade) => void;
}

const TradeList: React.FC<TradeListProps> = ({ trades, userProfile, onAddTrade, onEditTrade, onDeleteTrade, onDeleteAll, onPreviewTrade }) => {
  const [filter, setFilter] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const currency = userProfile?.currency || 'USD';

  // Filter States
  const [activeFilters, setActiveFilters] = useState({
    startDate: '',
    endDate: '',
    direction: 'ALL' as 'ALL' | Direction,
    result: 'ALL' as 'ALL' | 'WIN' | 'LOSS',
    assetClass: 'ALL' as 'ALL' | AssetClass
  });

  // Dropdown UI states
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);

  const [sortField, setSortField] = useState<keyof Trade>('entryDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Close filter panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target as Node)) {
        setIsFilterPanelOpen(false);
        setIsAssetDropdownOpen(false); // Also close inner dropdowns
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredTrades = trades.filter(t => {
    // Text Search (Symbol or Strategy)
    const matchesText = t.symbol.toLowerCase().includes(filter.toLowerCase()) || 
                        t.strategy.toLowerCase().includes(filter.toLowerCase());
    if (!matchesText) return false;

    // Direction Filter
    if (activeFilters.direction !== 'ALL' && t.direction !== activeFilters.direction) return false;

    // Result Filter
    if (activeFilters.result !== 'ALL') {
        const isWin = t.netPnL > 0;
        if (activeFilters.result === 'WIN' && !isWin) return false;
        if (activeFilters.result === 'LOSS' && isWin) return false;
    }

    // Asset Class Filter
    if (activeFilters.assetClass !== 'ALL' && t.assetClass !== activeFilters.assetClass) return false;

    // Date Range
    if (activeFilters.startDate) {
        const startTs = new Date(activeFilters.startDate).setHours(0,0,0,0);
        if (t.entryDate < startTs) return false;
    }
    if (activeFilters.endDate) {
        const endTs = new Date(activeFilters.endDate).setHours(23,59,59,999);
        if (t.entryDate > endTs) return false;
    }

    return true;
  });

  const sortedTrades = filteredTrades.sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    
    if (valA === undefined || valB === undefined) return 0;

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: keyof Trade) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const clearFilters = () => {
      setActiveFilters({
        startDate: '',
        endDate: '',
        direction: 'ALL',
        result: 'ALL',
        assetClass: 'ALL'
      });
      setFilter('');
  };
  
  const activeFilterCount = (activeFilters.direction !== 'ALL' ? 1 : 0) + 
                            (activeFilters.result !== 'ALL' ? 1 : 0) + 
                            (activeFilters.assetClass !== 'ALL' ? 1 : 0) + 
                            (activeFilters.startDate ? 1 : 0) + 
                            (activeFilters.endDate ? 1 : 0);

  const SortIcon = ({ field }: { field: keyof Trade }) => {
    if (sortField !== field) return <div className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-30 inline-block" />;
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 ml-1 inline-block text-indigo-400" />
      : <ChevronDown className="w-4 h-4 ml-1 inline-block text-indigo-400" />;
  };

  const formatAssetClass = (s: string) => {
      if (s === 'ALL') return 'All Assets';
      return s.charAt(0) + s.slice(1).toLowerCase();
  };

  return (
    <div className="space-y-4 h-full flex flex-col relative">
      <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 z-20 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search symbol or strategy..." 
            className="bg-slate-900 border border-slate-700 text-slate-200 pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex gap-2 relative" ref={filterPanelRef}>
            <button 
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors border ${
                    isFilterPanelOpen || activeFilterCount > 0 
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-600/50' 
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-transparent'
                }`}
            >
                <Filter className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                    <span className="ml-1 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {activeFilterCount}
                    </span>
                )}
            </button>
            <button 
              onClick={onAddTrade}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
                New Trade
            </button>

            {/* Filter Panel Dropdown */}
            {isFilterPanelOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700">
                        <h3 className="font-semibold text-slate-200">Filter Trades</h3>
                        <button onClick={clearFilters} className="text-xs text-indigo-400 hover:text-indigo-300">
                            Clear All
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {/* Date Range */}
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Date Range</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input 
                                        type="date" 
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                        value={activeFilters.startDate}
                                        onChange={(e) => setActiveFilters(prev => ({...prev, startDate: e.target.value}))}
                                    />
                                </div>
                                <div className="relative flex-1">
                                    <input 
                                        type="date" 
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                        value={activeFilters.endDate}
                                        onChange={(e) => setActiveFilters(prev => ({...prev, endDate: e.target.value}))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Direction */}
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Direction</label>
                            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                                {['ALL', Direction.LONG, Direction.SHORT].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => setActiveFilters(prev => ({...prev, direction: opt as any}))}
                                        className={`flex-1 py-1 text-xs rounded-md transition-colors font-medium ${
                                            activeFilters.direction === opt 
                                            ? 'bg-indigo-600 text-white shadow-sm' 
                                            : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Result */}
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Result</label>
                             <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                                {['ALL', 'WIN', 'LOSS'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => setActiveFilters(prev => ({...prev, result: opt as any}))}
                                        className={`flex-1 py-1 text-xs rounded-md transition-colors font-medium ${
                                            activeFilters.result === opt 
                                            ? opt === 'WIN' ? 'bg-emerald-600 text-white' : opt === 'LOSS' ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'
                                            : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Asset Class Custom Dropdown */}
                         <div className="relative">
                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Asset Class</label>
                            <button
                                onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 flex justify-between items-center focus:outline-none focus:border-indigo-500 hover:border-slate-600 transition-colors"
                            >
                                <span>{formatAssetClass(activeFilters.assetClass)}</span>
                                <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isAssetDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isAssetDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                                    {['ALL', ...Object.values(AssetClass)].map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => {
                                                setActiveFilters(prev => ({...prev, assetClass: option as any}));
                                                setIsAssetDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-xs transition-colors border-l-2 ${
                                                (option === 'ALL' && activeFilters.assetClass === 'ALL') || activeFilters.assetClass === option
                                                ? 'bg-indigo-600/10 text-indigo-300 font-medium border-indigo-500'
                                                : 'text-slate-300 hover:bg-slate-800 border-transparent'
                                            }`}
                                        >
                                            {formatAssetClass(option)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                         {/* DANGER ZONE - DELETE ALL BUTTON */}
                         {onDeleteAll && (
                            <div className="pt-4 mt-4 border-t border-slate-700">
                                <button 
                                    onClick={() => {
                                        setIsFilterPanelOpen(false);
                                        // Slight delay to allow dropdown to close cleanly before blocking alert appears
                                        setTimeout(() => {
                                            if (onDeleteAll) onDeleteAll();
                                        }, 50);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-900/20 hover:bg-rose-900/40 text-rose-400 border border-rose-900/30 rounded-lg transition-colors text-xs font-bold group"
                                >
                                    <Trash2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                    DELETE ALL TRADES
                                </button>
                            </div>
                         )}

                    </div>
                </div>
            )}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-800 rounded-xl border border-slate-700 shadow-inner z-10">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-900/50 sticky top-0 z-10 backdrop-blur-sm">
            <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-700">
              <th className="p-4 cursor-pointer group hover:text-slate-200" onClick={() => handleSort('entryDate')}>
                Date <SortIcon field="entryDate" />
              </th>
              <th className="p-4 cursor-pointer group hover:text-slate-200" onClick={() => handleSort('symbol')}>
                Symbol <SortIcon field="symbol" />
              </th>
              <th className="p-4">Direction</th>
              <th className="p-4 cursor-pointer group hover:text-slate-200" onClick={() => handleSort('setup')}>
                Setup <SortIcon field="setup" />
              </th>
              <th className="p-4 text-right cursor-pointer group hover:text-slate-200" onClick={() => handleSort('riskMultiple')}>
                R-Mult <SortIcon field="riskMultiple" />
              </th>
              <th className="p-4 text-right cursor-pointer group hover:text-slate-200" onClick={() => handleSort('netPnL')}>
                Net PnL <SortIcon field="netPnL" />
              </th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {sortedTrades.map(trade => {
              const violations = getTradeViolations(trade, trades, userProfile);
              const hasViolations = violations.length > 0;

              return (
              <tr key={trade.id} className="hover:bg-slate-700/30 transition-colors group">
                <td className="p-4 text-slate-400 text-sm whitespace-nowrap">
                  {new Date(trade.entryDate).toLocaleDateString()} <span className="text-slate-600 text-xs ml-1">{new Date(trade.entryDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </td>
                <td className="p-4 font-mono font-medium text-slate-200">
                  <div className="flex items-center gap-2">
                    {trade.symbol}
                    {trade.images && trade.images.length > 0 && (
                      <a 
                        href={trade.images[0]} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-slate-500 hover:text-sky-400 transition-colors"
                        title="View Chart"
                        onClick={(e) => e.stopPropagation()} 
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    trade.direction === Direction.LONG ? 'bg-emerald-900/30 text-emerald-400' : 'bg-rose-900/30 text-rose-400'
                  }`}>
                    {trade.direction}
                  </span>
                </td>
                <td className="p-4 text-sm text-slate-300">
                  <div className="flex flex-col">
                    <span>{trade.strategy}</span>
                    <span className="text-xs text-slate-500">{trade.setup}</span>
                  </div>
                </td>
                <td className={`p-4 text-right font-mono text-sm ${trade.riskMultiple > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {trade.riskMultiple > 0 ? '+' : ''}{trade.riskMultiple}R
                </td>
                <td className={`p-4 text-right font-mono font-medium ${trade.netPnL > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(trade.netPnL, currency)}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                     {hasViolations && (
                        <div className="group/tooltip relative">
                           <AlertTriangle className="w-4 h-4 text-amber-500" />
                           <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-900 border border-amber-900/50 text-amber-100 text-xs rounded-lg p-2 opacity-0 group-hover/tooltip:opacity-100 pointer-events-none shadow-xl z-20">
                              <div className="font-bold text-amber-500 mb-1 border-b border-amber-500/20 pb-1">Rule Violations</div>
                              <ul className="list-disc list-inside">
                                {violations.map((v, i) => <li key={i}>{v}</li>)}
                              </ul>
                           </div>
                        </div>
                     )}
                     <button 
                      onClick={() => onPreviewTrade && onPreviewTrade(trade)}
                      className="text-slate-500 hover:text-sky-400 transition-colors text-sm flex items-center gap-1"
                      title="Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => onEditTrade && onEditTrade(trade)}
                      className="text-slate-500 hover:text-indigo-400 transition-colors text-sm flex items-center gap-1"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => onDeleteTrade && onDeleteTrade(trade.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors text-sm flex items-center gap-1"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )})}
            
            {/* Empty State Logic */}
            {trades.length === 0 ? (
                 <tr>
                    <td colSpan={7} className="text-center py-20">
                        <div className="flex flex-col items-center justify-center text-slate-500">
                             <div className="bg-slate-700/30 p-4 rounded-full mb-3">
                                <ListIcon className="w-8 h-8 opacity-50 text-slate-400" />
                             </div>
                             <p className="text-lg font-medium text-slate-300">Journal is empty</p>
                             <p className="text-sm mb-4">No trades recorded in the database.</p>
                             <button onClick={onAddTrade} className="text-indigo-400 hover:text-indigo-300 font-medium text-sm border border-indigo-500/30 px-4 py-2 rounded-lg hover:bg-indigo-500/10 transition-colors">
                                + Log First Trade
                             </button>
                        </div>
                    </td>
                </tr>
            ) : sortedTrades.length === 0 && (
                <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                        No trades found matching your filters.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradeList;