import { maxDrawdown, rsi, sharpeFromDailyValues } from './indicators';
import type { BacktestResult, HistoricalCandle } from './types';

export function runRsiBacktest(symbol: string, candles: HistoricalCandle[], initialCapital = 10000): BacktestResult {
  const values = candles.map((candle) => candle.close);
  const rsiSeries = rsi(values, 14);
  let cash = initialCapital;
  let shares = 0;
  let entryPrice = 0;
  let wins = 0;
  let losses = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let trades = 0;

  const equityCurve = candles.map((candle, index) => {
    const signal = rsiSeries[index];
    const price = candle.close;

    if (signal !== null && signal < 30 && cash > 0) {
      shares = cash / price;
      cash = 0;
      entryPrice = price;
      trades += 1;
    }

    if (signal !== null && signal > 70 && shares > 0) {
      const proceeds = shares * price;
      const pnl = proceeds - shares * entryPrice;
      if (pnl >= 0) {
        wins += 1;
        grossProfit += pnl;
      } else {
        losses += 1;
        grossLoss += Math.abs(pnl);
      }
      cash = proceeds;
      shares = 0;
      entryPrice = 0;
      trades += 1;
    }

    return {
      date: candle.date,
      value: round(cash + shares * price)
    };
  });

  const finalValue = equityCurve.at(-1)?.value ?? initialCapital;
  const closedTrades = wins + losses;

  return {
    strategy: 'RSI Mean Reversion: buy RSI < 30, sell RSI > 70',
    symbol,
    startDate: candles[0]?.date ?? '',
    endDate: candles.at(-1)?.date ?? '',
    initialCapital,
    finalValue,
    totalReturnPercent: round(((finalValue - initialCapital) / initialCapital) * 100),
    maxDrawdownPercent: maxDrawdown(equityCurve.map((item) => item.value)),
    trades,
    winRatePercent: closedTrades ? round((wins / closedTrades) * 100) : 0,
    profitFactor: grossLoss ? round(grossProfit / grossLoss) : grossProfit ? 99 : 0,
    sharpe: sharpeFromDailyValues(equityCurve.map((item) => item.value)),
    equityCurve
  };
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
