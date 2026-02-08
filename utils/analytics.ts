import { Trade, Metrics, EquityPoint, TradeStatus, UserProfile } from '../types';

export const calculateMetrics = (trades: Trade[], initialBalance: number = 100000): Metrics => {
  const closedTrades = trades.filter(t => t.status === TradeStatus.CLOSED).sort((a, b) => (a.exitDate || 0) - (b.exitDate || 0));

  let wins = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let maxEquity = initialBalance;
  let currentEquity = initialBalance;
  let maxDD = 0;
  let maxDDPercent = 0;
  let largestWin = 0;
  let largestLoss = 0;

  // Streak calculation
  let currentStreak = 0;

  closedTrades.forEach(trade => {
    const pnl = trade.netPnL;
    currentEquity += pnl;

    // DD Calculation
    if (currentEquity > maxEquity) {
      maxEquity = currentEquity;
    }
    const dd = maxEquity - currentEquity;
    const ddPercent = (dd / maxEquity) * 100;
    
    if (dd > maxDD) maxDD = dd;
    if (ddPercent > maxDDPercent) maxDDPercent = ddPercent;

    // Win/Loss stats
    if (pnl > 0) {
      wins++;
      grossProfit += pnl;
      if (pnl > largestWin) largestWin = pnl;
      
      if (currentStreak >= 0) currentStreak++;
      else currentStreak = 1;

    } else {
      grossLoss += Math.abs(pnl);
      if (pnl < largestLoss) largestLoss = pnl; // largestLoss is negative usually, store actual value
      
      if (currentStreak <= 0) currentStreak--;
      else currentStreak = -1;
    }
  });

  const totalTrades = closedTrades.length;
  const losses = totalTrades - wins;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
  const averageWin = wins > 0 ? grossProfit / wins : 0;
  const averageLoss = losses > 0 ? grossLoss / losses : 0; // Absolute value
  const netProfit = currentEquity - initialBalance;
  
  // Expectancy = (Win% * AvgWin) - (Loss% * AvgLoss)
  const winPct = wins / totalTrades;
  const lossPct = losses / totalTrades;
  const expectancy = totalTrades > 0 ? (winPct * averageWin) - (lossPct * averageLoss) : 0;

  return {
    totalTrades,
    winRate,
    profitFactor,
    expectancy,
    averageWin,
    averageLoss,
    maxDrawdown: maxDD,
    maxDrawdownPercent: maxDDPercent,
    netProfit,
    largestWin,
    largestLoss,
    currentStreak
  };
};

export const generateEquityCurve = (trades: Trade[], initialBalance: number): EquityPoint[] => {
  const sortedTrades = trades
    .filter(t => t.status === TradeStatus.CLOSED)
    .sort((a, b) => (a.exitDate || 0) - (b.exitDate || 0));

  let currentBalance = initialBalance;
  let maxBalance = initialBalance;
  
  const curve: EquityPoint[] = [
    {
      date: 'Start',
      timestamp: sortedTrades.length > 0 ? sortedTrades[0].entryDate - 86400000 : Date.now(),
      equity: initialBalance,
      drawdown: 0
    }
  ];

  sortedTrades.forEach(trade => {
    currentBalance += trade.netPnL;
    if (currentBalance > maxBalance) maxBalance = currentBalance;
    
    const ddPercent = maxBalance > 0 ? ((maxBalance - currentBalance) / maxBalance) * 100 : 0;

    curve.push({
      date: new Date(trade.exitDate || 0).toLocaleDateString(),
      timestamp: trade.exitDate || 0,
      equity: Number(currentBalance.toFixed(2)),
      drawdown: Number(ddPercent.toFixed(2))
    });
  });

  return curve;
};

export const formatCurrency = (val: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(val);
};

export const formatNumber = (val: number, decimals = 2) => {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(val);
};

export const getTradeViolations = (trade: Trade, allTrades: Trade[], profile?: UserProfile): string[] => {
  const violations: string[] = [];
  
  // Dynamic Limits from Profile or Fallback
  const MAX_RISK_AMOUNT = profile ? (profile.startBalance * profile.maxRiskPerTrade / 100) : 2000;
  const MAX_LOSS_MULTIPLIER = 1.5; // If loss is > 1.5x planned risk

  // 1. Over-risking
  if (trade.riskAmount > MAX_RISK_AMOUNT) {
    violations.push(`Risk ($${trade.riskAmount}) exceeds max limit ($${MAX_RISK_AMOUNT.toFixed(0)})`);
  }
  if (trade.netPnL < 0 && Math.abs(trade.netPnL) > (trade.riskAmount * MAX_LOSS_MULTIPLIER) && trade.riskAmount > 0) {
    violations.push('Loss exceeded planned risk significantly (Slippage/Discipline)');
  }

  // 2. Trading outside session (Simple heuristic based on UTC hours)
  const entryHour = new Date(trade.entryDate).getUTCHours();
  
  // Approximate UTC windows for sessions
  const SESSIONS = {
    'LONDON': { start: 7, end: 17 },
    'NY': { start: 12, end: 22 },
    'ASIA': { start: 22, end: 9 } // Crossing midnight logic needed
  };

  if (trade.session === 'LONDON') {
    if (entryHour < SESSIONS.LONDON.start || entryHour >= SESSIONS.LONDON.end) {
      violations.push('Trade executed outside London session');
    }
  } else if (trade.session === 'NY') {
    if (entryHour < SESSIONS.NY.start || entryHour >= SESSIONS.NY.end) {
      violations.push('Trade executed outside NY session');
    }
  } else if (trade.session === 'ASIA') {
    // Asia is 22:00 to 09:00. So valid if hour >= 22 OR hour < 9
    const isAsiaTime = (entryHour >= SESSIONS.ASIA.start) || (entryHour < SESSIONS.ASIA.end);
    if (!isAsiaTime) {
      violations.push('Trade executed outside Asia session');
    }
  }

  // 3. Revenge Trading
  // Logic: Current trade opened within 30 mins of a previous LOSS closing
  // Find closest previous trade by exit time
  const REVENGE_WINDOW_MS = 30 * 60 * 1000; // 30 mins

  const previousTrades = allTrades.filter(t => 
    t.id !== trade.id && 
    t.exitDate && 
    t.exitDate <= trade.entryDate
  ).sort((a, b) => (b.exitDate || 0) - (a.exitDate || 0));

  if (previousTrades.length > 0) {
    const lastTrade = previousTrades[0];
    if (lastTrade.netPnL < 0 && lastTrade.exitDate) {
      if ((trade.entryDate - lastTrade.exitDate) < REVENGE_WINDOW_MS) {
        violations.push('Potential revenge trading (entry <30m after loss)');
      }
    }
  }

  return violations;
};
