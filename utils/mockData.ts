import { Trade, TradeStatus, Direction, AssetClass } from '../types';

export const DEFAULT_STRATEGIES = ['Trend Following', 'Mean Reversion', 'Breakout', 'Scalp'];
export const DEFAULT_SETUPS = ['Golden Cross', 'Support Bounce', 'Flag Break', 'Supply Zone', 'Liquidity Sweep'];

// Map assets to appropriate symbols so data looks realistic
const ASSET_SYMBOLS: Record<AssetClass, string[]> = {
    [AssetClass.FOREX]: ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'AUDUSD', 'NZDUSD', 'USDCHF'],
    [AssetClass.CRYPTO]: ['BTCUSD', 'ETHUSD', 'SOLUSD', 'XRPUSD', 'DOGE', 'ADAUSD', 'MATIC'],
    [AssetClass.INDICES]: ['ES_F', 'NQ_F', 'YM_F', 'DAX', 'UK100', 'NIKKEI', 'RTY_F'],
    [AssetClass.STOCKS]: ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMD', 'META', 'GOOGL', 'AMZN'],
    [AssetClass.COMMODITIES]: ['XAUUSD', 'XAGUSD', 'CL_F', 'NG_F', 'HG_F', 'ZC_F']
};

const assetClasses = Object.values(AssetClass);

const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

// Sample TradingView generic placeholder charts since real ones expire or vary
const SAMPLE_CHARTS = [
    'https://s3.tradingview.com/snapshots/x/XABCD.png', // Fallback pattern usually works visually in mock
    'https://www.tradingview.com/x/e6Z7p8yD/',
    'https://www.tradingview.com/x/8bL1j9mN/'
];

export const generateMockTrades = (count: number, initialDate: Date): Trade[] => {
  const trades: Trade[] = [];
  let currentDate = initialDate.getTime();

  for (let i = 0; i < count; i++) {
    const isWin = Math.random() > 0.45; // 55% win rate bias
    const risk = 500; // Fixed risk approx
    const rMultiple = isWin ? randomFloat(1.5, 3.5) : randomFloat(-1.0, -0.5); // Winners 1.5-3.5R, Losers 0.5-1.0R
    
    const grossPnL = risk * rMultiple;
    const comms = 5;
    const netPnL = grossPnL - comms;
    
    // Time progression
    const duration = randomFloat(3600 * 1000, 86400 * 1000 * 3); // 1 hour to 3 days
    currentDate += randomFloat(3600 * 1000 * 4, 3600 * 1000 * 24); // Gap between trades

    // 20% chance to have a chart image attached
    const hasImage = Math.random() > 0.8;

    // 1. Pick Asset Class first
    const selectedAssetClass = randomItem(assetClasses);
    
    // 2. Pick Symbol belonging to that class
    const selectedSymbol = randomItem(ASSET_SYMBOLS[selectedAssetClass]);

    trades.push({
      id: `TRD-${1000 + i}`,
      accountId: 'ACC-001',
      symbol: selectedSymbol,
      assetClass: selectedAssetClass,
      direction: Math.random() > 0.5 ? Direction.LONG : Direction.SHORT,
      entryDate: currentDate,
      exitDate: currentDate + duration,
      entryPrice: randomFloat(100, 2000),
      exitPrice: randomFloat(100, 2000), // Dummy prices, PnL is what matters for analytics here
      size: 1,
      grossPnL: Number(grossPnL.toFixed(2)),
      commission: comms,
      swap: 0,
      netPnL: Number(netPnL.toFixed(2)),
      initialStopLoss: 0,
      riskAmount: risk,
      riskMultiple: Number(rMultiple.toFixed(2)),
      strategy: randomItem(DEFAULT_STRATEGIES),
      setup: randomItem(DEFAULT_SETUPS),
      timeframe: 'H1',
      session: randomItem(['LONDON', 'NY', 'ASIA']),
      confidence: Math.floor(randomFloat(3, 6)),
      notes: isWin ? "Good follow through." : "Choppy market, got stopped out.",
      images: hasImage ? [randomItem(SAMPLE_CHARTS)] : [],
      status: TradeStatus.CLOSED
    });
  }
  return trades;
};

export const MOCK_TRADES = generateMockTrades(150, new Date('2023-01-01'));
