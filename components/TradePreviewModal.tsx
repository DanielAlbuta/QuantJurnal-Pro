import React from 'react';
import { X, Calendar, Clock, Target, TrendingUp, DollarSign, Image as ImageIcon, Brain, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { Trade, Direction, UserProfile } from '../types';
import { formatCurrency, formatNumber, getTradeViolations } from '../utils/analytics';

interface TradePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade?: Trade;
  allTrades?: Trade[];
  userProfile?: UserProfile;
  onEdit?: (trade: Trade) => void;
  onDelete?: (id: string) => void;
}

const TradePreviewModal: React.FC<TradePreviewModalProps> = ({ isOpen, onClose, trade, allTrades = [], userProfile, onEdit, onDelete }) => {
  if (!isOpen || !trade) return null;

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString();
  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  const currency = userProfile?.currency || 'USD';

  const violations = getTradeViolations(trade, allTrades, userProfile);

  const handleEditClick = () => {
    if (onEdit) {
        onEdit(trade);
        onClose(); // Close preview when opening edit
    }
  };

  const handleDeleteClick = () => {
      if (onDelete) {
          onDelete(trade.id);
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight font-mono">{trade.symbol}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
                trade.direction === Direction.LONG ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50' : 'bg-rose-900/30 text-rose-400 border border-rose-900/50'
            }`}>
                {trade.direction}
            </span>
            <div className="h-4 w-px bg-slate-700 mx-2"></div>
            <span className="text-slate-400 text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(trade.entryDate)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
                <button onClick={handleEditClick} className="p-2 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors" title="Edit Trade">
                    <Edit2 className="w-5 h-5" />
                </button>
            )}
             {onDelete && (
                <button onClick={handleDeleteClick} className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors" title="Delete Trade">
                    <Trash2 className="w-5 h-5" />
                </button>
            )}
            <div className="h-6 w-px bg-slate-700 mx-1"></div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
            {/* Violations Banner */}
            {violations.length > 0 && (
                <div className="bg-amber-900/20 border border-amber-900/50 rounded-xl p-4 flex items-start gap-4">
                    <div className="p-2 bg-amber-900/30 rounded-lg text-amber-500 mt-1">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wide mb-1">Trading Rule Violations</h3>
                        <ul className="space-y-1">
                            {violations.map((v, i) => (
                                <li key={i} className="text-amber-200/80 text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    {v}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Net PnL</div>
                    <div className={`text-2xl font-bold font-mono ${trade.netPnL > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(trade.netPnL, currency)}
                    </div>
                </div>
                 <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">R-Multiple</div>
                    <div className={`text-2xl font-bold font-mono ${trade.riskMultiple > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trade.riskMultiple > 0 ? '+' : ''}{trade.riskMultiple}R
                    </div>
                </div>
                 <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Strategy</div>
                    <div className="text-lg font-medium text-slate-200 truncate" title={trade.strategy}>
                        {trade.strategy}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{trade.setup}</div>
                </div>
                 <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Confidence</div>
                    <div className="flex gap-1 mt-1">
                        {[1,2,3,4,5].map(i => (
                             <div key={i} className={`h-2 flex-1 rounded-full ${i <= trade.confidence ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Execution */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Execution Timeline
                        </h3>
                        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 grid grid-cols-2 gap-6 relative overflow-hidden">
                             {/* Connector Line */}
                             <div className="absolute left-1/2 top-4 bottom-4 w-px bg-slate-700 transform -translate-x-1/2 hidden md:block"></div>

                            <div className="space-y-1">
                                <div className="text-xs text-slate-500 uppercase">Entry</div>
                                <div className="text-xl font-mono text-slate-200">{trade.entryPrice}</div>
                                <div className="text-sm text-slate-400">{formatDate(trade.entryDate)} {formatTime(trade.entryDate)}</div>
                            </div>
                             <div className="space-y-1 text-right md:text-left md:pl-8">
                                <div className="text-xs text-slate-500 uppercase">Exit</div>
                                <div className="text-xl font-mono text-slate-200">{trade.exitPrice}</div>
                                <div className="text-sm text-slate-400">
                                    {trade.exitDate ? `${formatDate(trade.exitDate)} ${formatTime(trade.exitDate)}` : '-'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Images */}
                    <div>
                         <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> Charts & Evidence
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {trade.images && trade.images.length > 0 ? (
                                trade.images.map((url, idx) => (
                                    <a key={idx} href={url} target="_blank" rel="noreferrer" className="group block relative aspect-video bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-indigo-500 transition-colors">
                                        <img src={url} alt={`Chart ${idx}`} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/10 transition-colors flex items-center justify-center">
                                            <div className="bg-slate-900/80 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                                                <TrendingUp className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </a>
                                ))
                            ) : (
                                <div className="col-span-2 bg-slate-800/30 rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-500">
                                    No charts attached to this trade.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Financials & Notes */}
                <div className="space-y-6">
                    {/* Financial Breakdown */}
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                         <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                             <DollarSign className="w-4 h-4 text-indigo-400" /> Financials
                         </h3>
                         <div className="space-y-3 text-sm">
                             <div className="flex justify-between text-slate-400">
                                 <span>Gross PnL</span>
                                 <span className="text-slate-200 font-mono">{formatCurrency(trade.grossPnL, currency)}</span>
                             </div>
                             <div className="flex justify-between text-slate-400">
                                 <span>Commission</span>
                                 <span className="text-rose-400 font-mono">-{formatCurrency(trade.commission, currency)}</span>
                             </div>
                             <div className="flex justify-between text-slate-400">
                                 <span>Swap</span>
                                 <span className="text-rose-400 font-mono">{trade.swap !== 0 ? `-${formatCurrency(trade.swap, currency)}` : `${formatCurrency(0, currency)}`}</span>
                             </div>
                             <div className="h-px bg-slate-700 my-2"></div>
                             <div className="flex justify-between font-medium">
                                 <span className="text-slate-200">Net PnL</span>
                                 <span className={`font-mono ${trade.netPnL > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(trade.netPnL, currency)}</span>
                             </div>
                         </div>
                    </div>

                    {/* Risk Stats */}
                     <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                         <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                             <Target className="w-4 h-4 text-indigo-400" /> Risk Management
                         </h3>
                          <div className="space-y-3 text-sm">
                             <div className="flex justify-between text-slate-400">
                                 <span>Risk Amount</span>
                                 <span className="text-slate-200 font-mono">{formatCurrency(trade.riskAmount, currency)}</span>
                             </div>
                             <div className="flex justify-between text-slate-400">
                                 <span>Size</span>
                                 <span className="text-slate-200 font-mono">{trade.size}</span>
                             </div>
                              <div className="flex justify-between text-slate-400">
                                 <span>Initial SL</span>
                                 <span className="text-slate-200 font-mono">{trade.initialStopLoss}</span>
                             </div>
                          </div>
                     </div>

                    {/* Notes */}
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 flex-1">
                        <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                             <Brain className="w-4 h-4 text-indigo-400" /> Journal Notes
                        </h3>
                        <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {trade.notes || "No notes recorded for this trade."}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TradePreviewModal;
