# Prompt For A Cloud Builder / Developer

Use this if you ask a cloud AI builder or developer to publish the app for you.

```text
I have a ZIP package called iphone-paper-lab-pwa.zip. Deploy it as a Next.js PWA so I can use it from my iPhone only.

Requirements:
- Do not ask me to use a computer.
- Do not ask me to open terminal.
- Do not ask me to run npm commands.
- Create a GitHub repository if needed.
- Import the project into Vercel or another Next.js-capable host.
- Use the default Next.js build settings.
- No environment variables are required for the MVP.
- After deployment, send me only the final public URL.
- Verify these routes work:
  - /
  - /api/health
  - /api/market/quote?symbols=AAPL,MSFT,NVDA,SPY,QQQ
  - /api/market/history?symbol=AAPL&days=252

The app is for personal educational paper trading only and must not execute real trades.
```
