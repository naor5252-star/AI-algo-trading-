import { NextResponse } from 'next/server';
import { DISCLAIMER } from '@/lib/portfolio';
import type { AiInsight, MarketQuote, PortfolioMetrics } from '@/lib/types';

type Body = {
  metrics?: PortfolioMetrics;
  quotes?: MarketQuote[];
};

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const metrics = body.metrics;
    const quotes = body.quotes ?? [];

    if (!metrics) {
      return NextResponse.json({ ok: false, error: 'Portfolio metrics are required' }, { status: 400 });
    }

    const insight = createEducationalInsight(metrics, quotes);
    return NextResponse.json({ ok: true, data: insight });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unable to generate educational insight' },
      { status: 500 }
    );
  }
}

function createEducationalInsight(metrics: PortfolioMetrics, quotes: MarketQuote[]): AiInsight {
  const momentum = calculateMomentumScore(quotes);
  const concentrationRisk = metrics.concentrationRisk;
  const riskScore = Math.min(100, Math.max(0, Math.round(concentrationRisk * 0.8 + Math.abs(metrics.dayChangePercent) * 4)));
  const valuationScore = Math.max(20, Math.min(80, 55 + Math.round(metrics.totalReturnPercent / 3)));

  let rating: AiInsight['rating'] = 'Neutral';
  if (riskScore > 70) rating = 'Risk Alert';
  else if (momentum > 65 && metrics.totalReturnPercent >= 0) rating = 'Bullish';
  else if (momentum < 35 || metrics.dayChangePercent < -2) rating = 'Bearish';

  const biggestMover = quotes.toSorted((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))[0];

  return {
    title: 'Educational portfolio readout',
    rating,
    summary: buildSummary(metrics, momentum, riskScore, biggestMover),
    evidence: [
      `Total simulated value is $${metrics.totalValue.toLocaleString()} with total return of ${metrics.totalReturnPercent.toFixed(2)}%.`,
      metrics.largestPositionSymbol
        ? `Largest position is ${metrics.largestPositionSymbol}, representing ${metrics.concentrationRisk.toFixed(2)}% of total simulated value.`
        : 'No equity concentration risk is visible yet because the portfolio is mostly cash or empty.',
      biggestMover
        ? `${biggestMover.symbol} has the largest latest move in the watch universe: ${biggestMover.changePercent.toFixed(2)}% from the provider reference price.`
        : 'No live quote movement was available for the current watch universe.',
      `The insight uses delayed market data and deterministic scoring; it is not a personalized investment recommendation.`
    ],
    riskScore,
    momentumScore: momentum,
    valuationScore,
    generatedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER
  };
}

function calculateMomentumScore(quotes: MarketQuote[]): number {
  if (!quotes.length) return 50;
  const avg = quotes.reduce((sum, quote) => sum + quote.changePercent, 0) / quotes.length;
  return Math.max(0, Math.min(100, Math.round(50 + avg * 8)));
}

function buildSummary(metrics: PortfolioMetrics, momentum: number, riskScore: number, biggestMover?: MarketQuote): string {
  const parts: string[] = [];
  parts.push(metrics.totalReturn >= 0 ? 'Your simulated portfolio is currently profitable versus deposits.' : 'Your simulated portfolio is below total deposits.');
  parts.push(momentum >= 55 ? 'Recent market momentum in the tracked symbols is positive.' : momentum <= 45 ? 'Recent market momentum in the tracked symbols is soft.' : 'Recent market momentum is mixed.');
  if (riskScore > 70) parts.push('Concentration or daily movement risk is elevated, so diversification and position sizing deserve attention.');
  if (biggestMover) parts.push(`${biggestMover.symbol} is the symbol creating the strongest latest signal in this snapshot.`);
  return parts.join(' ');
}
