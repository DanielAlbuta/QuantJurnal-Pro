import React, { useState, useEffect } from 'react';
import { X, Save, Calculator, RefreshCw, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { Trade, Direction, AssetClass, TradeStatus, UserProfile } from '../types';

interface TradeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Trade) => void;
  onDelete?: (id: string) => void;
  tradeToEdit?: Trade;
  userProfile?: UserProfile;
}

const INITIAL_FORM_STATE: Partial<Trade> = {
  symbol: '',
  direction: Direction.LONG,
  assetClass: AssetClass.FOREX,
  status: TradeStatus.CLOSED,
  size: 1,
  entryPrice: 0,
  exitPrice: 0,
  netPnL: 0,
  commission: 0,
  swap: 0,
  riskAmount: 0,
  initialStopLoss: 0,
  strategy: '',
  setup: '',
  timeframe: 'H1',
  session: 'LONDON',
  confidence: 3,
  notes: '',
  images: []
};

// Helper to convert timestamp to datetime-local string (YYYY-MM-DDThh:mm) in Local Time
const toDateTimeString = (timestamp: number) => {
  if (!timestamp) return new Date().toLocaleTimeString('sv').slice(0, 16).replace(' ', 'T'); // Hacky fallback

  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const TradeEntryModal: React.FC<TradeEntryModalProps> = ({ isOpen, onClose, onSave, onDelete, tradeToEdit, userProfile }) => {
  const [formData, setFormData] = useState<Partial<Trade>>(INITIAL_FORM_STATE);

  // Date strings for inputs
  const [entryDateStr, setEntryDateStr] = useState('');
  const [exitDateStr, setExitDateStr] = useState('');

  // Local state for image input
  const [newImageUrl, setNewImageUrl] = useState('');

  // Use profile strategies or fallbacks if not available (though App.tsx ensures they are)
  const availableStrategies = userProfile?.customStrategies || ['Trend Following', 'Breakout'];
  const availableSetups = userProfile?.customSetups || ['General'];

  // Reset or Populate form when opening
  useEffect(() => {
    if (isOpen) {
      if (tradeToEdit) {
        setFormData({ ...tradeToEdit, images: tradeToEdit.images || [] });
        setEntryDateStr(toDateTimeString(tradeToEdit.entryDate));
        setExitDateStr(tradeToEdit.exitDate ? toDateTimeString(tradeToEdit.exitDate) : toDateTimeString(Date.now()));
      } else {
        setFormData(INITIAL_FORM_STATE);
        const now = Date.now();
        setEntryDateStr(toDateTimeString(now));
        setExitDateStr(toDateTimeString(now));
      }
      setNewImageUrl('');
    }
  }, [isOpen, tradeToEdit]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Trade, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), newImageUrl.trim()]
    }));
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }));
  };

  const calculatePnL = () => {
    const entry = Number(formData.entryPrice) || 0;
    const exit = Number(formData.exitPrice) || 0;
    const size = Number(formData.size) || 0;
    const comm = Number(formData.commission) || 0;
    const swp = Number(formData.swap) || 0;

    // Basic calculation: (Exit - Entry) * Size
    let gross = (exit - entry) * size;

    // Adjust for Short direction
    if (formData.direction === Direction.SHORT) {
      gross = (entry - exit) * size;
    }

    // Heuristic for Forex Lots: If Forex and size < 1000, assume Standard Lots (100k units)
    if (formData.assetClass === AssetClass.FOREX && size < 1000) {
      gross *= 100000;
    }

    // Net = Gross - Commission - Swap (assuming comm/swap are entered as positive costs)
    const net = gross - comm - swp;

    if (!isNaN(net)) {
      handleChange('netPnL', parseFloat(net.toFixed(2)));
    } else {
      handleChange('netPnL', 0);
    }
  };

  const calculateR = () => {
    if (formData.netPnL && formData.riskAmount && formData.riskAmount !== 0) {
      const r = Number(formData.netPnL) / Number(formData.riskAmount);
      if (!isNaN(r) && isFinite(r)) {
        handleChange('riskMultiple', parseFloat(r.toFixed(2)));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-calculate basic financials if missing
    // Logic: Net PnL is the anchor. Gross is derived for record keeping if not explicitly tracked in separate field in this form state (derived).
    const gross = (Number(formData.netPnL) || 0) + (Number(formData.commission) || 0) + (Number(formData.swap) || 0);

    // Calculate R if not set manually
    let rMult = Number(formData.riskMultiple) || 0;
    if (rMult === 0 && formData.riskAmount && formData.riskAmount > 0) {
      const net = formData.netPnL || 0;
      const risk = formData.riskAmount;
      const calculatedR = net / risk;

      if (!isNaN(calculatedR) && isFinite(calculatedR)) {
        rMult = parseFloat(calculatedR.toFixed(2));
      }
    }

    const newTrade: Trade = {
      // Use existing ID if editing, otherwise generate new one
      id: formData.id || `TRD-${Date.now()}`,
      accountId: formData.accountId || 'ACC-MANUAL',
      symbol: formData.symbol?.toUpperCase() || 'UNKNOWN',
      assetClass: formData.assetClass as AssetClass,
      direction: formData.direction as Direction,
      entryDate: new Date(entryDateStr).getTime(),
      exitDate: new Date(exitDateStr).getTime(),
      entryPrice: Number(formData.entryPrice) || 0,
      exitPrice: Number(formData.exitPrice) || 0,
      size: Number(formData.size) || 0,
      grossPnL: !isNaN(gross) ? Number(gross.toFixed(2)) : 0,
      commission: Number(formData.commission) || 0,
      swap: Number(formData.swap) || 0,
      netPnL: Number(formData.netPnL) || 0,
      initialStopLoss: Number(formData.initialStopLoss) || 0,
      riskAmount: Number(formData.riskAmount) || 0,
      riskMultiple: rMult,
      strategy: formData.strategy || 'Discretionary',
      setup: formData.setup || 'General',
      timeframe: formData.timeframe || 'H1',
      session: formData.session as any,
      confidence: Number(formData.confidence),
      notes: formData.notes || '',
      images: formData.images || [],
      status: formData.status as TradeStatus,
    };

    onSave(newTrade);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-100">{tradeToEdit ? 'Edit Trade' : 'Log New Trade'}</h2>
            <p className="text-sm text-slate-400">
              {tradeToEdit ? `Updating details for ${tradeToEdit.symbol}` : 'Manually record a closed trade execution'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">

          {/* Section 1: Core Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Symbol</label>
              <input
                required
                type="text"
                placeholder="EURUSD"
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none uppercase"
                value={formData.symbol}
                onChange={e => handleChange('symbol', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Direction</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                value={formData.direction}
                onChange={e => handleChange('direction', e.target.value)}
              >
                <option value={Direction.LONG}>LONG</option>
                <option value={Direction.SHORT}>SHORT</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Asset Class</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                value={formData.assetClass}
                onChange={e => handleChange('assetClass', e.target.value)}
              >
                <option value={AssetClass.FOREX}>Forex</option>
                <option value={AssetClass.CRYPTO}>Crypto</option>
                <option value={AssetClass.INDICES}>Indices</option>
                <option value={AssetClass.STOCKS}>Stocks</option>
                <option value={AssetClass.COMMODITIES}>Commodities</option>
              </select>
            </div>
          </div>

          {/* Section 2: Execution */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
              Execution Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-800">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Entry Time</label>
                <input
                  type="datetime-local"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  value={entryDateStr}
                  onChange={e => setEntryDateStr(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Exit Time</label>
                <input
                  type="datetime-local"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  value={exitDateStr}
                  onChange={e => setExitDateStr(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Entry Price</label>
                <input
                  type="number" step="0.00000001"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none font-mono"
                  value={formData.entryPrice}
                  onChange={e => handleChange('entryPrice', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Exit Price</label>
                <input
                  type="number" step="0.00000001"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none font-mono"
                  value={formData.exitPrice}
                  onChange={e => handleChange('exitPrice', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Size (Lots/Units)</label>
                <input
                  type="number" step="0.01"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none font-mono"
                  value={formData.size}
                  onChange={e => handleChange('size', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Financials & Risk */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
              Financials & Risk
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-800">
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Net PnL ($)</label>
                <div className="relative">
                  <input
                    type="number" step="0.01"
                    className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none font-bold font-mono ${Number(formData.netPnL) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                    value={formData.netPnL}
                    onChange={e => handleChange('netPnL', e.target.value)}
                  />
                  <button type="button" onClick={calculatePnL} className="absolute right-2 top-1.5 text-slate-500 hover:text-indigo-400" title="Calculate PnL from Price & Size">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Commission ($)</label>
                <input
                  type="number" step="0.01"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none font-mono"
                  value={formData.commission}
                  onChange={e => handleChange('commission', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Swap ($)</label>
                <input
                  type="number" step="0.01"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none font-mono"
                  value={formData.swap}
                  onChange={e => handleChange('swap', e.target.value)}
                />
              </div>
              <div>
                {/* Spacer */}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Risk Amount ($)</label>
                <input
                  type="number" step="0.01"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none font-mono"
                  value={formData.riskAmount}
                  onChange={e => handleChange('riskAmount', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Stop Loss Price</label>
                <input
                  type="number" step="0.00000001"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none font-mono"
                  value={formData.initialStopLoss}
                  onChange={e => handleChange('initialStopLoss', e.target.value)}
                />
              </div>
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">R-Multiple</label>
                <div className="relative">
                  <input
                    type="number" step="0.01"
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none font-mono"
                    value={formData.riskMultiple}
                    onChange={e => handleChange('riskMultiple', e.target.value)}
                  />
                  <button type="button" onClick={calculateR} className="absolute right-2 top-1.5 text-slate-500 hover:text-indigo-400" title="Calculate R from Net PnL & Risk">
                    <Calculator className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Classification */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
              Classification & Strategy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-800">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Strategy Name</label>
                <input
                  type="text" list="strategies"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  value={formData.strategy}
                  onChange={e => handleChange('strategy', e.target.value)}
                  placeholder="Select or type..."
                />
                <datalist id="strategies">
                  {availableStrategies.map(strat => (
                    <option key={strat} value={strat} />
                  ))}
                </datalist>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Setup / Pattern</label>
                <input
                  type="text" list="setups"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  value={formData.setup}
                  onChange={e => handleChange('setup', e.target.value)}
                  placeholder="Select or type..."
                />
                <datalist id="setups">
                  {availableSetups.map(setup => (
                    <option key={setup} value={setup} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Timeframe</label>
                <select
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  value={formData.timeframe}
                  onChange={e => handleChange('timeframe', e.target.value)}
                >
                  <option value="M1">M1</option>
                  <option value="M5">M5</option>
                  <option value="M15">M15</option>
                  <option value="H1">H1</option>
                  <option value="H4">H4</option>
                  <option value="D1">D1</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Session</label>
                <select
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  value={formData.session}
                  onChange={e => handleChange('session', e.target.value)}
                >
                  <option value="ASIA">Asia</option>
                  <option value="LONDON">London</option>
                  <option value="NY">New York</option>
                  <option value="OVERLAP">Overlap</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Psychology */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
              Psychology & Notes
            </h3>
            <div className="space-y-4 bg-slate-800/50 p-4 rounded-lg border border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Confidence (1-5)</label>
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map(level => (
                    <label key={level} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="confidence"
                        value={level}
                        checked={Number(formData.confidence) === level}
                        onChange={() => handleChange('confidence', level)}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-600"
                      />
                      <span className={`text-sm ${Number(formData.confidence) === level ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}>{level}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Trade Journal / Notes</label>
                <textarea
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none h-24 resize-none"
                  placeholder="What was your thought process? Emotions? Execution quality?"
                  value={formData.notes}
                  onChange={e => handleChange('notes', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 6: Charts & Screenshots */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-sky-500 rounded-full"></span>
              Charts & Screenshots
            </h3>
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-800">
              <div className="flex gap-2 mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Paste TradingView image link (e.g. https://www.tradingview.com/x/...)"
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Image Grid */}
              {formData.images && formData.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((url, idx) => (
                    <div key={idx} className="relative group aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                      <img src={url} alt={`Chart ${idx + 1}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a href={url} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-700 hover:bg-indigo-600 rounded-full text-white">
                          <ImageIcon className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1.5 bg-slate-700 hover:bg-rose-600 rounded-full text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-slate-700 rounded-lg">
                  No charts attached. Paste a link above.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <div>
              {tradeToEdit && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(tradeToEdit.id)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-900/30 border border-transparent hover:border-rose-900 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Trade
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/50 flex items-center gap-2 transition-all hover:scale-105"
              >
                <Save className="w-4 h-4" />
                {tradeToEdit ? 'Update Trade' : 'Save Trade'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default TradeEntryModal;
