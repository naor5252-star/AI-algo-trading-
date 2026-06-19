import { NextResponse } from 'next/server';
import { fetchQuotes, normalizeSymbol } from '@/lib/market';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = (searchParams.get('symbols') ?? 'AAPL,MSFT,NVDA,SPY,QQQ')
    .split(',')
    .map(normalizeSymbol)
    .filter(Boolean);

  try {
    const quotes = await fetchQuotes(symbols);
    return NextResponse.json(
      {
        ok: true,
        count: quotes.length,
        data: quotes,
        note: 'Prices are for educational paper-trading simulation and may be delayed by the provider.'
      },
      {
        headers: {
          'Cache-Control': 's-maxage=30, stale-while-revalidate=120'
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown market data error',
        data: []
      },
      { status: 502 }
    );
  }
}
