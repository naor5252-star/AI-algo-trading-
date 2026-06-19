import type { HistoricalCandle } from './types';

export function sma(values: number[], period: number): Array<number | null> {
  return values.map((_, index) => {
    if (index + 1 < period) return null;
    const slice = values.slice(index + 1 - period, index + 1);
    return round(slice.reduce((sum, value) => sum + value, 0) / period);
  });
}

export function ema(values: number[], period: number): Array<number | null> {
  const multiplier = 2 / (period + 1);
  const result: Array<number | null> = [];
  let previous: number | null = null;

  values.forEach((value, index) => {
    if (index + 1 < period) {
      result.push(null);
      return;
    }
    if (previous === null) {
      previous = values.slice(0, period).reduce((sum, item) => sum + item, 0) / period;
    } else {
      previous = value * multiplier + previous * (1 - multiplier);
    }
    result.push(round(previous));
  });

  return result;
}

export function rsi(values: number[], period = 14): Array<number | null> {
  const result: Array<number | null> = Array(Math.min(period, values.length)).fill(null);
  if (values.length <= period) return result;

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i += 1) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  result[period] = calculateRsi(avgGain, avgLoss);

  for (let i = period + 1; i < values.length; i += 1) {
    const diff = values[i] - values[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
    result[i] = calculateRsi(avgGain, avgLoss);
  }

  return result;
}

export function macd(values: number[]) {
  const ema12 = ema(values, 12);
  const ema26 = ema(values, 26);
  const macdLine = values.map((_, index) => {
    if (ema12[index] === null || ema26[index] === null) return null;
    return round((ema12[index] as number) - (ema26[index] as number));
  });
  const signal = ema(macdLine.map((value) => value ?? 0), 9).map((value, index) => (macdLine[index] === null ? null : value));
  const histogram = macdLine.map((value, index) => (value === null || signal[index] === null ? null : round(value - (signal[index] as number))));
  return { macdLine, signal, histogram };
}

export function maxDrawdown(values: number[]): number {
  let peak = values[0] ?? 0;
  let maxDd = 0;
  values.forEach((value) => {
    peak = Math.max(peak, value);
    if (peak > 0) maxDd = Math.min(maxDd, (value - peak) / peak);
  });
  return round(maxDd * 100);
}

export function sharpeFromDailyValues(values: number[]): number {
  if (values.length < 3) return 0;
  const returns = values.slice(1).map((value, index) => value / values[index] - 1).filter(Number.isFinite);
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(returns.length - 1, 1);
  const stdev = Math.sqrt(variance);
  if (!stdev) return 0;
  return round((mean / stdev) * Math.sqrt(252));
}

export function enrichCandles(candles: HistoricalCandle[]) {
  const closes = candles.map((candle) => candle.close);
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const rsi14 = rsi(closes, 14);
  const macdResult = macd(closes);

  return candles.map((candle, index) => ({
    ...candle,
    sma20: sma20[index],
    sma50: sma50[index],
    rsi14: rsi14[index],
    macd: macdResult.macdLine[index],
    macdSignal: macdResult.signal[index]
  }));
}

function calculateRsi(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return round(100 - 100 / (1 + rs));
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
