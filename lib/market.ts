import type { HistoricalCandle, MarketQuote } from './types';

const SOURCE = 'Stooq delayed market data';

const ASSET_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft Corp.',
  NVDA: 'NVIDIA Corp.',
  TSLA: 'Tesla Inc.',
  AMZN: 'Amazon.com Inc.',
  GOOGL: 'Alphabet Inc.',
  META: 'Meta Platforms Inc.',
  SPY: 'SPDR S&P 500 ETF Trust',
  QQQ: 'Invesco QQQ Trust',
  VOO: 'Vanguard S&P 500 ETF',
  DIA: 'SPDR Dow Jones Industrial Average ETF'
};

export function normalizeSymbol(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9.^-]/g, '');
}

export function toStooqSymbol(symbol: string): string {
  const normalized = normalizeSymbol(symbol);
  if (normalized.startsWith('^')) return normalized.toLowerCase();
  if (normalized.includes('.')) return normalized.toLowerCase();
  return `${normalized.toLowerCase()}.us`;
}

export function inferAssetType(symbol: string): MarketQuote['assetType'] {
  if (symbol.startsWith('^')) return 'index';
  if (['SPY', 'QQQ', 'VOO', 'DIA', 'IWM', 'VTI'].includes(symbol)) return 'etf';
  return 'stock';
}

export function getMarketSession(now = new Date()): MarketQuote['marketSession'] {
  const eastern = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour12: false,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).formatToParts(now);

  const weekday = eastern.find((part) => part.type === 'weekday')?.value ?? 'Sat';
  const hour = Number(eastern.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(eastern.find((part) => part.type === 'minute')?.value ?? '0');
  const minutes = hour * 60 + minute;

  if (weekday === 'Sat' || weekday === 'Sun') return 'closed';
  if (minutes >= 4 * 60 && minutes < 9 * 60 + 30) return 'pre-market';
  if (minutes >= 9 * 60 + 30 && minutes <= 16 * 60) return 'regular';
  if (minutes > 16 * 60 && minutes <= 20 * 60) return 'after-hours';
  return 'closed';
}

export async function fetchQuotes(symbols: string[]): Promise<MarketQuote[]> {
  const unique = Array.from(new Set(symbols.map(normalizeSymbol).filter(Boolean))).slice(0, 20);
  if (!unique.length) return [];

  const providerSymbols = unique.map(toStooqSymbol);
  const url = `https://stooq.com/q/l/?s=${providerSymbols.join(',')}&f=sd2t2ohlcv&h&e=csv`;
  const response = await fetch(url, {
    next: { revalidate: 30 },
    headers: {
      'User-Agent': 'iphone-paper-lab-pwa/0.1 educational paper trading app'
    }
  });

  if (!response.ok) {
    throw new Error(`Market data provider returned ${response.status}`);
  }

  const text = await response.text();
  const rows = parseCsv(text);
  const session = getMarketSession();

  return rows
    .map((row, index) => {
      const original = unique[index];
      const close = toNumber(row.Close);
      const open = toNumber(row.Open);
      const high = toNumber(row.High);
      const low = toNumber(row.Low);
      const previousClose = Number.isFinite(open) ? open : close;
      const change = close && previousClose ? close - previousClose : 0;
      const changePercent = previousClose ? (change / previousClose) * 100 : 0;

      if (!Number.isFinite(close) || close <= 0) return null;

      return {
        symbol: original,
        providerSymbol: providerSymbols[index],
        name: ASSET_NAMES[original],
        assetType: inferAssetType(original),
        price: round(close),
        open: finiteOrUndefined(open),
        high: finiteOrUndefined(high),
        low: finiteOrUndefined(low),
        volume: finiteOrUndefined(toNumber(row.Volume)),
        previousClose: finiteOrUndefined(previousClose),
        change: round(change),
        changePercent: round(changePercent),
        currency: 'USD',
        marketSession: session,
        source: SOURCE,
        timestamp: combineDateTime(row.Date, row.Time)
      } satisfies MarketQuote;
    })
    .filter(Boolean) as MarketQuote[];
}

export async function fetchHistory(symbol: string, days = 252): Promise<HistoricalCandle[]> {
  const normalized = normalizeSymbol(symbol);
  const providerSymbol = toStooqSymbol(normalized);
  const url = `https://stooq.com/q/d/l/?s=${providerSymbol}&i=d`;
  const response = await fetch(url, {
    next: { revalidate: 60 * 60 },
    headers: {
      'User-Agent': 'iphone-paper-lab-pwa/0.1 educational paper trading app'
    }
  });

  if (!response.ok) {
    throw new Error(`Historical market data provider returned ${response.status}`);
  }

  const rows = parseCsv(await response.text());
  return rows
    .map((row) => ({
      date: row.Date,
      open: toNumber(row.Open),
      high: toNumber(row.High),
      low: toNumber(row.Low),
      close: toNumber(row.Close),
      volume: toNumber(row.Volume)
    }))
    .filter((row) => row.date && Number.isFinite(row.close) && row.close > 0)
    .slice(-Math.min(Math.max(days, 20), 1500));
}

export function parseCsv(csv: string): Record<string, string>[] {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines[0] ?? '');
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = values[index] ?? '';
      return acc;
    }, {});
  });
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function toNumber(value: string | undefined): number {
  if (!value || value === 'N/D' || value === '-') return Number.NaN;
  return Number(value.replace(/,/g, ''));
}

function finiteOrUndefined(value: number): number | undefined {
  return Number.isFinite(value) ? round(value) : undefined;
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

function combineDateTime(date?: string, time?: string): string {
  if (!date) return new Date().toISOString();
  if (!time || time === 'N/D') return new Date(`${date}T21:00:00Z`).toISOString();
  return new Date(`${date}T${time}Z`).toISOString();
}
