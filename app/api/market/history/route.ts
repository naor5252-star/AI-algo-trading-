import { NextResponse } from 'next/server';
import { runRsiBacktest } from '@/lib/backtest';
import { enrichCandles } from '@/lib/indicators';
import { fetchHistory, normalizeSymbol } from '@/lib/market';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = normalizeSymbol(searchParams.get('symbol') ?? 'AAPL');
  const days = Number(searchParams.get('days') ?? '252');

  try {
    const candles = await fetchHistory(symbol, Number.isFinite(days) ? days : 252);
    const enriched = enrichCandles(candles);
    const backtest = runRsiBacktest(symbol, candles);

    return NextResponse.json(
      {
        ok: true,
        symbol,
        count: enriched.length,
        data: enriched,
        backtest,
        source: 'Stooq delayed historical market data'
      },
      {
        headers: {
          'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400'
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        symbol,
        error: error instanceof Error ? error.message : 'Unknown historical data error',
        data: []
      },
      { status: 502 }
    );
  }
}
