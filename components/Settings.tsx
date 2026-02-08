import React, { useState, useRef } from 'react';
import { Download, Upload, RotateCcw, Plus, X, List, Layers, Save, Check, FileSpreadsheet, Trash2, Database } from 'lucide-react';
import { UserProfile, Trade } from '../types';
import ExcelJS from 'exceljs';
import { calculateMetrics } from '../utils/analytics';

interface SettingsProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  trades: Trade[];
  onImportTrades: (trades: Trade[]) => void;
  onResetData: () => void;
  onLoadDemo: () => void;
}

const Settings: React.FC<SettingsProps> = ({ userProfile, onUpdateProfile, trades, onImportTrades, onResetData, onLoadDemo }) => {
  const [newStrategy, setNewStrategy] = useState('');
  const [newSetup, setNewSetup] = useState('');
  const [importStatus, setImportStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // --- List Management Logic ---
  const handleAddStrategy = () => {
    if (newStrategy.trim()) {
      const current = userProfile.customStrategies || [];
      if (!current.includes(newStrategy.trim())) {
        onUpdateProfile({
          ...userProfile,
          customStrategies: [...current, newStrategy.trim()]
        });
      }
      setNewStrategy('');
    }
  };

  const handleRemoveStrategy = (item: string) => {
    onUpdateProfile({
      ...userProfile,
      customStrategies: (userProfile.customStrategies || []).filter(s => s !== item)
    });
  };

  const handleAddSetup = () => {
    if (newSetup.trim()) {
      const current = userProfile.customSetups || [];
      if (!current.includes(newSetup.trim())) {
        onUpdateProfile({
          ...userProfile,
          customSetups: [...current, newSetup.trim()]
        });
      }
      setNewSetup('');
    }
  };

  const handleRemoveSetup = (item: string) => {
    onUpdateProfile({
      ...userProfile,
      customSetups: (userProfile.customSetups || []).filter(s => s !== item)
    });
  };

  // --- Data Management Logic ---
  
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(trades, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qj_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Export Styled Excel with ExcelJS
  const handleExportExcel = async () => {
    setIsExporting(true);
    const metrics = calculateMetrics(trades, userProfile.startBalance);
    const workbook = new ExcelJS.Workbook();
    
    workbook.creator = 'QuantJournal Pro';
    workbook.created = new Date();

    // === COLORS ===
    const COLORS = {
        bgDark: 'FF0F172A', // Slate 900
        bgCard: 'FF1E293B', // Slate 800
        textWhite: 'FFFFFFFF',
        textGray: 'FF94A3B8', // Slate 400
        accent: 'FF4F46E5', // Indigo 600
        profit: 'FF10B981', // Emerald 500
        loss: 'FFF43F5E', // Rose 500
        header: 'FF312E81' // Indigo 900
    };

    // ==========================================
    // SHEET 1: DASHBOARD
    // ==========================================
    const wsDash = workbook.addWorksheet('📊 Dashboard', {
        views: [{ showGridLines: false, zoomScale: 100 }]
    });

    // Setup Columns
    wsDash.columns = [
        { width: 5 },  // A: Padding
        { width: 25 }, // B: Label / Strategy Name
        { width: 15 }, // C: Value / Count
        { width: 18 }, // D: Gap / Win Rate
        { width: 25 }, // E: Label 2 / PnL
        { width: 25 }, // F: Value 2
    ];

    // Title
    wsDash.mergeCells('B2:F3');
    const titleCell = wsDash.getCell('B2');
    titleCell.value = 'QUANTJOURNAL PRO REPORT';
    titleCell.style = {
        font: { name: 'Arial', size: 18, bold: true, color: { argb: COLORS.textWhite } },
        alignment: { vertical: 'middle', horizontal: 'center' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accent } },
        border: { bottom: { style: 'medium', color: { argb: COLORS.textWhite } } }
    };

    const dateCell = wsDash.getCell('B4');
    dateCell.value = `Generated: ${new Date().toLocaleDateString()}`;
    dateCell.font = { color: { argb: COLORS.textGray }, italic: true };

    // Stats Section Helper
    const addStatRow = (rowNum: number, label1: string, val1: any, label2: string, val2: any, isMoney = false, isPerc = false) => {
        const c1 = wsDash.getCell(`B${rowNum}`);
        const v1 = wsDash.getCell(`C${rowNum}`);
        const c2 = wsDash.getCell(`E${rowNum}`);
        const v2 = wsDash.getCell(`F${rowNum}`);

        [c1, c2].forEach(c => {
            c.value = label1 === c1.value ? label1 : label2;
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgCard } };
            c.font = { color: { argb: COLORS.textGray }, bold: true };
            c.border = { left: {style:'thin', color: {argb: 'FF334155'}} };
        });

        [v1, v2].forEach(v => {
            const val = label1 === c1.value ? val1 : val2;
            v.value = val;
            v.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgDark } };
            v.font = { color: { argb: COLORS.textWhite }, size: 12, bold: true };
            v.alignment = { horizontal: 'right' };
            v.border = { right: {style:'thin', color: {argb: 'FF334155'}} };
            
            if (typeof val === 'number') {
                if (label1 === c1.value && (label1.includes('Profit') || label1.includes('Win'))) {
                    v.font = { color: { argb: val >= 0 ? COLORS.profit : COLORS.loss }, bold: true };
                }
                if (label2 === c2.value && (label2.includes('Drawdown') || label2.includes('Loss'))) {
                    if (label2.includes('Drawdown')) v.font = { color: { argb: COLORS.loss } };
                }
            }
        });
    };

    // Header for Stats
    wsDash.getCell('B6').value = "ACCOUNT OVERVIEW";
    wsDash.getCell('B6').font = { color: { argb: COLORS.accent }, bold: true };

    addStatRow(7, "Net Profit", metrics.netProfit, "Total Trades", metrics.totalTrades);
    addStatRow(8, "Profit Factor", metrics.profitFactor.toFixed(2), "Win Rate %", metrics.winRate.toFixed(2) + '%');
    addStatRow(9, "Avg Win", metrics.averageWin.toFixed(2), "Avg Loss", metrics.averageLoss.toFixed(2));
    addStatRow(10, "Largest Win", metrics.largestWin.toFixed(2), "Max Drawdown", metrics.maxDrawdownPercent.toFixed(2) + '%');

    // Strategy Breakdown Table
    wsDash.getCell('B13').value = "STRATEGY PERFORMANCE";
    wsDash.getCell('B13').font = { color: { argb: COLORS.accent }, bold: true };

    // Strategy Table Headers
    const stratHeaders = ['Strategy', 'Trades', 'Win Rate', 'PnL'];
    const startRow = 14;
    ['B', 'C', 'D', 'E'].forEach((col, idx) => {
        const cell = wsDash.getCell(`${col}${startRow}`);
        cell.value = stratHeaders[idx];
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.header } };
        cell.font = { color: { argb: COLORS.textWhite }, bold: true };
        cell.alignment = { horizontal: 'center' };
    });

    // Calculate Data
    const strategyStats: Record<string, any> = {};
    trades.forEach(t => {
        if (!strategyStats[t.strategy]) strategyStats[t.strategy] = { count: 0, wins: 0, pnl: 0 };
        strategyStats[t.strategy].count++;
        strategyStats[t.strategy].pnl += t.netPnL;
        if (t.netPnL > 0) strategyStats[t.strategy].wins++;
    });

    let currentRow = startRow + 1;
    Object.entries(strategyStats)
        .sort(([, a], [, b]) => b.pnl - a.pnl)
        .forEach(([name, stats]) => {
            wsDash.getCell(`B${currentRow}`).value = name;
            wsDash.getCell(`C${currentRow}`).value = stats.count;
            wsDash.getCell(`D${currentRow}`).value = (stats.count > 0 ? (stats.wins/stats.count) : 0);
            wsDash.getCell(`D${currentRow}`).numFmt = '0.0%';
            wsDash.getCell(`E${currentRow}`).value = stats.pnl;
            wsDash.getCell(`E${currentRow}`).numFmt = '#,##0.00';
            
            wsDash.getCell(`E${currentRow}`).font = { 
                color: { argb: stats.pnl > 0 ? COLORS.profit : COLORS.loss },
                bold: true
            };

            ['B','C','D','E'].forEach(col => {
                wsDash.getCell(`${col}${currentRow}`).border = { bottom: {style:'dotted', color: {argb: 'FF334155'}} };
                if (col === 'B') wsDash.getCell(`${col}${currentRow}`).font = { bold: true };
            });

            currentRow++;
        });


    // ==========================================
    // SHEET 2: TRADE JOURNAL
    // ==========================================
    const wsJournal = workbook.addWorksheet('📝 Trade Journal', {
        views: [{ state: 'frozen', ySplit: 1 }]
    });

    // Manually set widths since we are using addTable without columns array on worksheet
    wsJournal.getColumn(1).width = 15; // ID
    wsJournal.getColumn(2).width = 18; // Date
    wsJournal.getColumn(3).width = 12; // Symbol
    wsJournal.getColumn(4).width = 8; // Dir
    wsJournal.getColumn(5).width = 12; // Asset
    wsJournal.getColumn(6).width = 20; // Strat
    wsJournal.getColumn(7).width = 20; // Setup
    wsJournal.getColumn(8).width = 10; // Risk
    wsJournal.getColumn(9).width = 15; // PnL
    wsJournal.getColumn(10).width = 12; // Entry
    wsJournal.getColumn(11).width = 12; // Exit
    wsJournal.getColumn(12).width = 50; // Notes
    wsJournal.getColumn(13).width = 40; // Screenshots

    const sortedTrades = [...trades].sort((a, b) => b.entryDate - a.entryDate);

    // Prepare rows for table
    const tableRows = sortedTrades.map(t => [
        t.id,
        new Date(t.entryDate),
        t.symbol,
        t.direction,
        t.assetClass,
        t.strategy,
        t.setup,
        `${t.riskMultiple}R`,
        t.netPnL,
        t.entryPrice,
        t.exitPrice,
        t.notes,
        t.images ? t.images.join(', ') : '' // Join image URLs
    ]);

    // CREATE TABLE to allow specific filter buttons
    wsJournal.addTable({
        name: 'JournalTable',
        ref: 'A1',
        headerRow: true,
        style: { theme: 'TableStyleLight1', showRowStripes: false }, // Use light theme to not mess up our dark override too much
        columns: [
            { name: 'ID', filterButton: false },
            { name: 'Date', filterButton: true },
            { name: 'Symbol', filterButton: true },
            { name: 'Dir', filterButton: true },
            { name: 'Asset', filterButton: true },
            { name: 'Strategy', filterButton: true },
            { name: 'Setup', filterButton: true },
            { name: 'Risk (R)', filterButton: false },
            { name: 'Net PnL', filterButton: false },
            { name: 'Entry', filterButton: false },
            { name: 'Exit', filterButton: false },
            { name: 'Notes', filterButton: false },
            { name: 'Screenshots', filterButton: false },
        ],
        rows: tableRows,
    });

    // OVERRIDE TABLE STYLES TO MATCH DARK MODE
    // 1. Header Row
    wsJournal.getRow(1).eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.header } };
        cell.font = { color: { argb: COLORS.textWhite }, bold: true };
        cell.alignment = { horizontal: 'center' };
        cell.border = { bottom: {style:'thick', color: {argb: 'FFFFFFFF'}} };
    });

    // 2. Data Rows
    wsJournal.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        // Conditional Formatting logic based on data in rows
        const pnlVal = row.getCell(9).value as number;
        const riskStr = row.getCell(8).value as string; // "1.5R"
        
        // PnL Color
        row.getCell(9).font = { 
            color: { argb: pnlVal > 0 ? COLORS.profit : pnlVal < 0 ? COLORS.loss : COLORS.textGray },
            bold: true
        };
        row.getCell(9).numFmt = '#,##0.00';

        // Risk Color (Parse the R string simply for color check)
        const isWin = riskStr && !riskStr.startsWith('-');
        row.getCell(8).font = {
             color: { argb: isWin ? COLORS.profit : COLORS.loss }
        };

        // Date Format
        row.getCell(2).numFmt = 'dd/mm/yyyy hh:mm';

        // Background Alternating Logic
        row.eachCell({ includeEmpty: true }, (cell) => {
            // Re-apply background color (Table styles usually force white/blue, we force dark/light gray)
            if (rowNumber % 2 === 0) {
                 cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // Light gray
            } else {
                 cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }; // White
            }
        });
    });

    // Write File
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `QuantJournal_Pro_${new Date().toISOString().slice(0,10)}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          const isValid = json.every(t => t.id && t.symbol && t.netPnL !== undefined);
          if (isValid) {
            onImportTrades(json);
            setImportStatus('Success: Trades imported.');
            setTimeout(() => setImportStatus(''), 3000);
          } else {
            setImportStatus('Error: Invalid JSON format.');
          }
        } else {
          setImportStatus('Error: File must contain an array of trades.');
        }
      } catch (err) {
        setImportStatus('Error: Failed to parse JSON.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-100">Application Settings</h1>
           <p className="text-slate-400">Configure your journal preferences and manage data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Custom Strategies */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-600/20 rounded-lg text-indigo-400">
                    <List className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-200">My Strategies</h3>
            </div>
            <div className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="Add new strategy..."
                    value={newStrategy}
                    onChange={(e) => setNewStrategy(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddStrategy()}
                />
                <button 
                    onClick={handleAddStrategy}
                    className="p-2 bg-slate-700 hover:bg-indigo-600 rounded-lg text-white transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-60 space-y-2 pr-2 custom-scrollbar">
                {(userProfile.customStrategies || []).length === 0 && <div className="text-slate-500 text-sm italic">No strategies defined.</div>}
                {(userProfile.customStrategies || []).map((strat, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-700/50 group">
                        <span className="text-sm text-slate-300">{strat}</span>
                        <button 
                            onClick={() => handleRemoveStrategy(strat)}
                            className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>

        {/* Custom Setups */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-600/20 rounded-lg text-indigo-400">
                    <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-200">My Setups</h3>
            </div>
            <div className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="Add new setup..."
                    value={newSetup}
                    onChange={(e) => setNewSetup(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSetup()}
                />
                <button 
                    onClick={handleAddSetup}
                    className="p-2 bg-slate-700 hover:bg-indigo-600 rounded-lg text-white transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-60 space-y-2 pr-2 custom-scrollbar">
                {(userProfile.customSetups || []).length === 0 && <div className="text-slate-500 text-sm italic">No setups defined.</div>}
                {(userProfile.customSetups || []).map((setup, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-700/50 group">
                        <span className="text-sm text-slate-300">{setup}</span>
                        <button 
                             onClick={() => handleRemoveSetup(setup)}
                             className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-6 flex items-center gap-2">
            <Save className="w-5 h-5 text-emerald-400" /> Data Management
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 flex flex-col justify-between">
                <div>
                    <div className="font-medium text-slate-200 mb-1">Export Data</div>
                    <div className="text-sm text-slate-500 mb-4">Download your data as a professional Excel report or JSON backup.</div>
                </div>
                <div className="space-y-3">
                    <button 
                        onClick={handleExportExcel}
                        disabled={isExporting}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isExporting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <FileSpreadsheet className="w-4 h-4" />
                        )}
                        {isExporting ? 'Generating...' : 'Export Pro Report (.xlsx)'}
                    </button>
                    <button 
                        onClick={handleExportJSON}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors text-xs"
                    >
                        <Download className="w-3 h-3" /> Backup (JSON)
                    </button>
                </div>
            </div>

            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 flex flex-col justify-between">
                <div>
                    <div className="font-medium text-slate-200 mb-1">Import Journal</div>
                    <div className="text-sm text-slate-500 mb-4">Restore trades from a previously exported JSON backup file.</div>
                    {importStatus && (
                        <div className={`text-xs mb-2 ${importStatus.includes('Error') ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {importStatus}
                        </div>
                    )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
                <button 
                    onClick={handleImportClick}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600"
                >
                    <Upload className="w-4 h-4" /> Import Backup
                </button>
            </div>

            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 flex flex-col justify-between border-l-4 border-l-rose-500/50">
                <div>
                    <div className="font-medium text-slate-200 mb-1">Database Actions</div>
                    <div className="text-sm text-slate-500 mb-4">Clear all trades or restore demo data for testing.</div>
                </div>
                <div className="space-y-3">
                    <button 
                        onClick={onResetData}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-rose-900/20 hover:bg-rose-900/40 text-rose-400 border border-rose-900/30 rounded-lg transition-colors font-medium shadow-lg shadow-rose-900/10"
                    >
                        <Trash2 className="w-4 h-4" /> Delete All Trades
                    </button>
                    <button 
                        onClick={onLoadDemo}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-xs"
                    >
                        <RotateCcw className="w-3 h-3" /> Load Demo Data
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;