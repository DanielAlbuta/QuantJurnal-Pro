
export enum Direction {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

export enum TradeStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  PENDING = 'PENDING'
}

export enum AssetClass {
  FOREX = 'FOREX',
  CRYPTO = 'CRYPTO',
  INDICES = 'INDICES',
  COMMODITIES = 'COMMODITIES',
  STOCKS = 'STOCKS'
}

export interface UserProfile {
  name: string;
  accountType: string;
  startBalance: number;
  currency: string;
  maxRiskPerTrade: number; // Percent
  maxDailyLoss: number; // Percent
  monthlyGoal: number; // Percent
  avatarUrl?: string;
  bio?: string;
  // Custom Lists
  customStrategies?: string[];
  customSetups?: string[];
}

export interface TradingAccount {
  id: string;
  name: string;
  balance: number;
  currency: string;
  type: 'LIVE' | 'DEMO' | 'PROP';
  isArchived: boolean;
}

export interface Trade {
  id: string;
  accountId: string;
  symbol: string;
  assetClass: AssetClass;
  direction: Direction;
  entryDate: number; // timestamp
  exitDate?: number; // timestamp
  entryPrice: number;
  exitPrice?: number;
  size: number;
  
  // Financials
  grossPnL: number;
  commission: number;
  swap: number;
  netPnL: number;
  
  // Risk
  initialStopLoss: number;
  takeProfit?: number;
  riskAmount: number; // Absolute currency risk
  riskMultiple: number; // R-Multiple realized
  
  // Strategy & Tags
  strategy: string;
  setup: string;
  timeframe: string;
  session: 'ASIA' | 'LONDON' | 'NY' | 'OVERLAP';
  
  // Psychology
  confidence: number; // 1-5
  mistake?: string[];
  notes: string;
  
  // Media
  images?: string[]; // URLs for TradingView charts etc.

  status: TradeStatus;
}

export interface Metrics {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  expectancy: number;
  averageWin: number;
  averageLoss: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  netProfit: number;
  largestWin: number;
  largestLoss: number;
  currentStreak: number;
}

export interface EquityPoint {
  date: string;
  timestamp: number;
  equity: number;
  drawdown: number;
}
