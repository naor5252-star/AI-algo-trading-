# PaperLab AI — iPhone-First Paper Trading PWA

PaperLab AI is a personal-use, iPhone-first investment simulation and algorithmic trading **Progressive Web App**.

It is designed for the constraint: **no computer, no local terminal, no Xcode, no local build, and no local backend** for the user.

The app is implemented as a hosted-ready Next.js PWA. Once deployed, the user opens a URL on iPhone Safari and can add it to the Home Screen.

## What is implemented in this MVP

- iPhone-first dark FinTech UI
- PWA manifest and service worker
- Bottom-tab mobile navigation
- Personal paper portfolio stored in browser storage
- Initial cash balance and deposits
- Simulated buy/sell paper trades
- Watchlist management
- Serverless real-market quote API route
- Serverless historical market data API route
- Data source timestamp and market-session label
- Portfolio metrics
  - Total value
  - Cash
  - Invested deposits
  - Unrealized P/L
  - Total return
  - Daily change estimate
  - Concentration risk
- Technical indicators
  - SMA 20
  - SMA 50
  - RSI 14
  - MACD calculation foundation
- Mobile charts
- Built-in RSI backtest
- Educational AI-style portfolio insight route
- Mandatory disclaimer
- Health endpoint

## Important limitation

This repository/package cannot become a public iPhone URL until it is deployed to a hosting provider such as Vercel, Netlify, or another cloud platform.

The user does **not** need a computer to use the final app after deployment, but somebody or a cloud AI builder must publish it once.

## Market data

The MVP uses a no-key delayed market-data provider through serverless routes:

- `/api/market/quote?symbols=AAPL,MSFT,NVDA,SPY,QQQ`
- `/api/market/history?symbol=AAPL&days=252`

The frontend never calls the external market-data provider directly. This keeps provider logic server-side and allows paid providers to be added later without exposing private keys.

## App screens

- Dashboard
- Trade
- Watchlist
- Backtest
- AI
- Settings / Install instructions

## PWA install flow on iPhone

After deployment:

1. Open the hosted URL in Safari on iPhone.
2. Tap Share.
3. Tap Add to Home Screen.
4. Launch PaperLab AI from the new icon.

## Future cloud upgrades

- Supabase Auth
- Supabase PostgreSQL
- Row Level Security
- Server-side market data cache
- Paid market data providers
- Real push notifications
- User accounts and cloud sync
- More strategy templates
- News sentiment pipeline
- Portfolio-level Monte Carlo simulation

## Disclaimer

This application is for educational and simulation purposes only. It does not provide financial advice, investment recommendations, or execute real trades. Users are solely responsible for their investment decisions.
