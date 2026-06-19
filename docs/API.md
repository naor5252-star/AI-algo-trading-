# API Specification

## GET /api/health

Returns app health and timestamp.

## GET /api/market/quote

Query params:

- `symbols`: comma-separated uppercase symbols

Example:

```text
/api/market/quote?symbols=AAPL,MSFT,NVDA,SPY,QQQ
```

Response:

```json
{
  "ok": true,
  "count": 5,
  "data": [
    {
      "symbol": "AAPL",
      "price": 195.23,
      "change": 1.2,
      "changePercent": 0.62,
      "source": "Stooq delayed market data",
      "timestamp": "2026-06-19T20:00:00.000Z"
    }
  ]
}
```

## GET /api/market/history

Query params:

- `symbol`
- `days`

Returns historical candles, indicators, and the first built-in RSI backtest.

## POST /api/ai/analyze

Body:

```json
{
  "metrics": {},
  "quotes": []
}
```

Returns an educational, explainable insight. This is not financial advice.
