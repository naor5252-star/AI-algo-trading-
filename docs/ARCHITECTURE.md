# Architecture

## MVP architecture

```text
iPhone Safari / PWA
        |
        | HTTPS
        v
Next.js App Router
        |
        +-- Mobile UI
        +-- Serverless API Route: /api/market/quote
        +-- Serverless API Route: /api/market/history
        +-- Serverless API Route: /api/ai/analyze
        +-- Serverless API Route: /api/health
        |
        v
Market Data Provider Adapter
        |
        v
External market data provider
```

## Client-side modules

- Dashboard UI
- Portfolio state
- Watchlist state
- Trade simulation actions
- Chart rendering
- PWA install guidance

## Server-side modules

- Market quote provider
- Historical data provider
- Technical indicators
- Backtesting engine
- AI educational insight generator

## Data storage in MVP

For personal MVP speed, data is stored in browser localStorage:

- Portfolio
- Holdings
- Transactions
- Watchlist

## Production storage upgrade

Recommended next storage upgrade:

- Supabase Auth
- Supabase PostgreSQL
- Row Level Security
- Daily backups
- Serverless API using authenticated session

## Provider architecture

Current provider:

- Stooq delayed quotes and historical CSV data through serverless route handlers

Future providers:

- Financial Modeling Prep
- Twelve Data
- Finnhub
- Polygon.io
- IEX Cloud

Future provider interface:

```ts
interface MarketDataProvider {
  getQuotes(symbols: string[]): Promise<MarketQuote[]>;
  getHistory(symbol: string, range: HistoryRange): Promise<HistoricalCandle[]>;
  getFundamentals(symbol: string): Promise<FundamentalSnapshot>;
  getNews(symbols: string[]): Promise<MarketNewsItem[]>;
}
```
