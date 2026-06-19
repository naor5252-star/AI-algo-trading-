export type AssetType = 'stock' | 'etf' | 'index' | 'custom';

export type MarketQuote = {
  symbol: string;
  providerSymbol: string;
  name?: string;
  assetType: AssetType;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  previousClose?: number;
  change: number;
  changePercent: number;
  currency: string;
  marketSession: 'pre-market' | 'regular' | 'after-hours' | 'closed' | 'unknown';
  source: string;
  timestamp: string;
  isFallback?: boolean;
};

export type HistoricalCandle = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Holding = {
  id: string;
  symbol: string;
  name?: string;
  quantity: number;
  averageCost: number;
  assetType: AssetType;
};

export type Transaction = {
  id: string;
  type: 'buy' | 'sell' | 'deposit';
  symbol?: string;
  quantity?: number;
  price?: number;
  amount: number;
  createdAt: string;
};

export type Portfolio = {
  id: string;
  name: string;
  baseCurrency: 'USD';
  cash: number;
  initialDeposit: number;
  recurringDeposit: number;
  holdings: Holding[];
  transactions: Transaction[];
  createdAt: string;
  updatedAt: string;
};

export type PortfolioMetrics = {
  totalValue: number;
  investedValue: number;
  holdingsValue: number;
  cash: number;
  totalCostBasis: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayChange: number;
  dayChangePercent: number;
  concentrationRisk: number;
  largestPositionSymbol?: string;
  allocation: Array<{ symbol: string; value: number; percent: number }>;
};

export type BacktestResult = {
  strategy: string;
  symbol: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalValue: number;
  totalReturnPercent: number;
  maxDrawdownPercent: number;
  trades: number;
  winRatePercent: number;
  profitFactor: number;
  sharpe: number;
  equityCurve: Array<{ date: string; value: number }>;
};

export type AiInsight = {
  title: string;
  rating: 'Bullish' | 'Neutral' | 'Bearish' | 'Risk Alert';
  summary: string;
  evidence: string[];
  riskScore: number;
  momentumScore: number;
  valuationScore: number;
  generatedAt: string;
  disclaimer: string;
};
