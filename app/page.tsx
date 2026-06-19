'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  BrainCircuit,
  CandlestickChart,
  CircleDollarSign,
  Download,
  Eye,
  LineChart as LineIcon,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  WalletCards
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { addDeposit, buyHolding, calculatePortfolioMetrics, createDefaultPortfolio, DISCLAIMER, sellHolding } from '@/lib/portfolio';
import type { AiInsight, BacktestResult, HistoricalCandle, MarketQuote, Portfolio } from '@/lib/types';

type Tab = 'dashboard' | 'trade' | 'watchlist' | 'backtest' | 'ai' | 'settings';

type HistoryResponse = {
  ok: boolean;
  symbol: string;
  data: Array<HistoricalCandle & { sma20?: number | null; sma50?: number | null; rsi14?: number | null }>;
  backtest: BacktestResult;
  source: string;
};

type AiResponse = { ok: boolean; data: AiInsight };

const STORAGE_KEY = 'paperlab-ai-personal-portfolio-v1';
const WATCHLIST_KEY = 'paperlab-ai-watchlist-v1';
const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'NVDA', 'SPY', 'QQQ', 'TSLA'];

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [portfolio, setPortfolio] = useState<Portfolio>(() => createDefaultPortfolio());
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [orderSymbol, setOrderSymbol] = useState('AAPL');
  const [orderQuantity, setOrderQuantity] = useState('1');
  const [depositAmount, setDepositAmount] = useState('500');
  const [installHintVisible, setInstallHintVisible] = useState(false);

  useEffect(() => {
    const savedPortfolio = window.localStorage.getItem(STORAGE_KEY);
    const savedWatchlist = window.localStorage.getItem(WATCHLIST_KEY);
    if (savedPortfolio) setPortfolio(JSON.parse(savedPortfolio) as Portfolio);
    if (savedWatchlist) setWatchlist(JSON.parse(savedWatchlist) as string[]);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
  }, [portfolio]);

  useEffect(() => {
    window.localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const allSymbols = useMemo(() => {
    const symbols = new Set([...watchlist, ...portfolio.holdings.map((holding) => holding.symbol)]);
    return Array.from(symbols).filter(Boolean);
  }, [portfolio.holdings, watchlist]);

  const quotesQuery = useQuery({
    queryKey: ['quotes', allSymbols.join(',')],
    queryFn: async () => {
      const response = await fetch(`/api/market/quote?symbols=${allSymbols.join(',')}`);
      if (!response.ok) throw new Error('Unable to load market quotes');
      const payload = (await response.json()) as { data: MarketQuote[] };
      return payload.data;
    },
    refetchInterval: 45_000
  });

  const quoteMap = useMemo(() => {
    return Object.fromEntries((quotesQuery.data ?? []).map((quote) => [quote.symbol, quote]));
  }, [quotesQuery.data]);

  const metrics = useMemo(() => calculatePortfolioMetrics(portfolio, quoteMap), [portfolio, quoteMap]);

  const historyQuery = useQuery({
    queryKey: ['history', selectedSymbol],
    queryFn: async () => {
      const response = await fetch(`/api/market/history?symbol=${selectedSymbol}&days=252`);
      if (!response.ok) throw new Error('Unable to load history');
      return (await response.json()) as HistoryResponse;
    }
  });

  const aiMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics, quotes: quotesQuery.data ?? [] })
      });
      if (!response.ok) throw new Error('Unable to generate insight');
      const payload = (await response.json()) as AiResponse;
      return payload.data;
    }
  });

  useEffect(() => {
    if (quotesQuery.data?.length) aiMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotesQuery.dataUpdatedAt]);

  const selectedQuote = quoteMap[selectedSymbol];
  const marketTimestamp = quotesQuery.data?.[0]?.timestamp ? new Date(quotesQuery.data[0].timestamp).toLocaleString() : 'Waiting for data';

  function handleBuy() {
    const quote = quoteMap[orderSymbol.toUpperCase()];
    if (!quote) return;
    setPortfolio((current) => buyHolding(current, quote.symbol, quote.name, Number(orderQuantity), quote.price));
  }

  function handleSell() {
    const quote = quoteMap[orderSymbol.toUpperCase()];
    if (!quote) return;
    setPortfolio((current) => sellHolding(current, quote.symbol, Number(orderQuantity), quote.price));
  }

  function handleAddDeposit() {
    setPortfolio((current) => addDeposit(current, Number(depositAmount)));
  }

  function addToWatchlist(symbol: string) {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized || watchlist.includes(normalized)) return;
    setWatchlist((current) => [normalized, ...current].slice(0, 20));
    setSelectedSymbol(normalized);
    setOrderSymbol(normalized);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col overflow-hidden bg-slate-950/70 text-slate-50 shadow-2xl">
      <header className="safe-top sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 px-4 pb-3 backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">PaperLab AI</p>
            <h1 className="text-xl font-semibold">iPhone paper trading lab</h1>
          </div>
          <button
            type="button"
            onClick={() => quotesQuery.refetch()}
            className="rounded-full border border-cyan-300/30 bg-cyan-300/10 p-3 text-cyan-200"
            aria-label="Refresh market data"
          >
            <RefreshCcw className={`h-5 w-5 ${quotesQuery.isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300">
          <span>{selectedQuote?.marketSession ?? 'unknown'} session</span>
          <span>{marketTimestamp}</span>
        </div>
      </header>

      <section className="flex-1 overflow-y-auto px-4 pb-28 pt-4">
        {tab === 'dashboard' && (
          <DashboardView
            metrics={metrics}
            quotes={quotesQuery.data ?? []}
            portfolio={portfolio}
            history={historyQuery.data?.data ?? []}
            aiInsight={aiMutation.data}
            loading={quotesQuery.isLoading}
          />
        )}

        {tab === 'trade' && (
          <TradeView
            portfolio={portfolio}
            quoteMap={quoteMap}
            orderSymbol={orderSymbol}
            orderQuantity={orderQuantity}
            depositAmount={depositAmount}
            setOrderSymbol={setOrderSymbol}
            setOrderQuantity={setOrderQuantity}
            setDepositAmount={setDepositAmount}
            onBuy={handleBuy}
            onSell={handleSell}
            onDeposit={handleAddDeposit}
          />
        )}

        {tab === 'watchlist' && (
          <WatchlistView
            quotes={quotesQuery.data ?? []}
            watchlist={watchlist}
            selectedSymbol={selectedSymbol}
            onSelect={(symbol) => {
              setSelectedSymbol(symbol);
              setOrderSymbol(symbol);
            }}
            onAdd={addToWatchlist}
            onRemove={(symbol) => setWatchlist((current) => current.filter((item) => item !== symbol))}
            history={historyQuery.data?.data ?? []}
          />
        )}

        {tab === 'backtest' && (
          <BacktestView
            selectedSymbol={selectedSymbol}
            setSelectedSymbol={setSelectedSymbol}
            history={historyQuery.data?.data ?? []}
            backtest={historyQuery.data?.backtest}
            isLoading={historyQuery.isLoading}
          />
        )}

        {tab === 'ai' && (
          <AiView insight={aiMutation.data} isLoading={aiMutation.isPending} onRefresh={() => aiMutation.mutate()} />
        )}

        {tab === 'settings' && (
          <SettingsView
            portfolio={portfolio}
            onReset={() => {
              const next = createDefaultPortfolio();
              setPortfolio(next);
              setWatchlist(DEFAULT_WATCHLIST);
              window.localStorage.removeItem(STORAGE_KEY);
              window.localStorage.removeItem(WATCHLIST_KEY);
            }}
            installHintVisible={installHintVisible}
            setInstallHintVisible={setInstallHintVisible}
          />
        )}
      </section>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] border-t border-white/10 bg-slate-950/90 px-3 pt-2 backdrop-blur-2xl">
        <div className="grid grid-cols-6 gap-1">
          <TabButton icon={<WalletCards />} label="Home" active={tab === 'dashboard'} onClick={() => setTab('dashboard')} />
          <TabButton icon={<CircleDollarSign />} label="Trade" active={tab === 'trade'} onClick={() => setTab('trade')} />
          <TabButton icon={<Eye />} label="Watch" active={tab === 'watchlist'} onClick={() => setTab('watchlist')} />
          <TabButton icon={<BarChart3 />} label="Test" active={tab === 'backtest'} onClick={() => setTab('backtest')} />
          <TabButton icon={<Bot />} label="AI" active={tab === 'ai'} onClick={() => setTab('ai')} />
          <TabButton icon={<Settings />} label="More" active={tab === 'settings'} onClick={() => setTab('settings')} />
        </div>
      </nav>
    </main>
  );
}

function DashboardView({
  metrics,
  quotes,
  portfolio,
  history,
  aiInsight,
  loading
}: {
  metrics: ReturnType<typeof calculatePortfolioMetrics>;
  quotes: MarketQuote[];
  portfolio: Portfolio;
  history: Array<HistoricalCandle & { sma20?: number | null }>;
  aiInsight?: AiInsight;
  loading: boolean;
}) {
  const chartData = history.slice(-90).map((item) => ({ date: item.date.slice(5), close: item.close, sma20: item.sma20 }));
  return (
    <div className="space-y-4">
      <section className="glass-card rounded-[2rem] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-400">Total simulated value</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight">{formatUsd(metrics.totalValue)}</p>
          </div>
          <Pill positive={metrics.dayChange >= 0}>{formatSigned(metrics.dayChange)} today</Pill>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <MetricCard label="Total return" value={`${metrics.totalReturnPercent.toFixed(2)}%`} positive={metrics.totalReturn >= 0} />
          <MetricCard label="Unrealized P/L" value={formatUsd(metrics.unrealizedPnL)} positive={metrics.unrealizedPnL >= 0} />
          <MetricCard label="Cash" value={formatUsd(metrics.cash)} />
          <MetricCard label="Invested" value={formatUsd(metrics.investedValue)} />
        </div>
      </section>

      <section className="glass-card rounded-[1.75rem] p-4">
        <SectionTitle icon={<LineIcon />} title="Market pulse" subtitle="AAPL 90-day chart with SMA20" />
        <div className="mt-4 h-56">
          {chartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="closeGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(34, 211, 238, 0.55)" />
                    <stop offset="100%" stopColor="rgba(34, 211, 238, 0)" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis domain={['dataMin', 'dataMax']} hide />
                <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(148,163,184,.2)', borderRadius: 16 }} />
                <Area type="monotone" dataKey="close" stroke="#22d3ee" fill="url(#closeGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState loading={loading} text="Loading real market history…" />
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <RiskTile title="Concentration" value={`${metrics.concentrationRisk.toFixed(1)}%`} label={metrics.largestPositionSymbol ?? 'No position'} />
        <RiskTile title="Holdings" value={portfolio.holdings.length.toString()} label="Simulated assets" />
      </section>

      <section className="glass-card rounded-[1.75rem] p-4">
        <SectionTitle icon={<BrainCircuit />} title="AI educational insight" subtitle={aiInsight?.rating ?? 'Generating…'} />
        <p className="mt-3 text-sm leading-6 text-slate-300">{aiInsight?.summary ?? 'The assistant will analyze your simulated portfolio after market quotes load.'}</p>
      </section>

      <section className="glass-card rounded-[1.75rem] p-4">
        <SectionTitle icon={<CandlestickChart />} title="Holdings" subtitle="Paper positions only" />
        <div className="mt-3 space-y-2">
          {portfolio.holdings.length ? (
            portfolio.holdings.map((holding) => {
              const quote = quotes.find((item) => item.symbol === holding.symbol);
              const value = (quote?.price ?? holding.averageCost) * holding.quantity;
              return (
                <div key={holding.id} className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-3">
                  <div>
                    <p className="font-medium">{holding.symbol}</p>
                    <p className="text-xs text-slate-400">{holding.quantity} shares · avg {formatUsd(holding.averageCost)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatUsd(value)}</p>
                    <p className={quote && quote.changePercent >= 0 ? 'text-xs text-emerald-300' : 'text-xs text-rose-300'}>
                      {quote ? `${quote.changePercent.toFixed(2)}%` : '—'}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState text="No simulated holdings yet. Use Trade to buy a paper position." />
          )}
        </div>
      </section>
    </div>
  );
}

function TradeView({
  portfolio,
  quoteMap,
  orderSymbol,
  orderQuantity,
  depositAmount,
  setOrderSymbol,
  setOrderQuantity,
  setDepositAmount,
  onBuy,
  onSell,
  onDeposit
}: {
  portfolio: Portfolio;
  quoteMap: Record<string, MarketQuote | undefined>;
  orderSymbol: string;
  orderQuantity: string;
  depositAmount: string;
  setOrderSymbol: (value: string) => void;
  setOrderQuantity: (value: string) => void;
  setDepositAmount: (value: string) => void;
  onBuy: () => void;
  onSell: () => void;
  onDeposit: () => void;
}) {
  const quote = quoteMap[orderSymbol.toUpperCase()];
  const estimated = quote ? Number(orderQuantity || 0) * quote.price : 0;

  return (
    <div className="space-y-4">
      <section className="glass-card rounded-[2rem] p-5">
        <SectionTitle icon={<CircleDollarSign />} title="Simulated order" subtitle="No real trades are executed" />
        <div className="mt-4 space-y-3">
          <Field label="Symbol">
            <input value={orderSymbol} onChange={(event) => setOrderSymbol(event.target.value.toUpperCase())} className="input" placeholder="AAPL" />
          </Field>
          <Field label="Quantity">
            <input value={orderQuantity} inputMode="decimal" onChange={(event) => setOrderQuantity(event.target.value)} className="input" placeholder="1" />
          </Field>
          <div className="rounded-2xl bg-white/[0.04] p-4">
            <div className="flex justify-between text-sm text-slate-300">
              <span>Latest price</span>
              <span>{quote ? formatUsd(quote.price) : 'Add symbol to watchlist first'}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm text-slate-300">
              <span>Estimated value</span>
              <span>{formatUsd(estimated)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm text-slate-300">
              <span>Available cash</span>
              <span>{formatUsd(portfolio.cash)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={onBuy} disabled={!quote || estimated > portfolio.cash} className="primary-button disabled:opacity-40">
              Buy paper
            </button>
            <button type="button" onClick={onSell} disabled={!quote} className="secondary-button disabled:opacity-40">
              Sell paper
            </button>
          </div>
        </div>
      </section>

      <section className="glass-card rounded-[1.75rem] p-5">
        <SectionTitle icon={<Plus />} title="Add theoretical cash" subtitle="Deposit simulation" />
        <div className="mt-4 flex gap-3">
          <input value={depositAmount} inputMode="decimal" onChange={(event) => setDepositAmount(event.target.value)} className="input flex-1" placeholder="500" />
          <button type="button" onClick={onDeposit} className="secondary-button px-5">
            Add
          </button>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
        <ShieldAlert className="mb-2 h-5 w-5" />
        {DISCLAIMER}
      </section>
    </div>
  );
}

function WatchlistView({
  quotes,
  watchlist,
  selectedSymbol,
  onSelect,
  onAdd,
  onRemove,
  history
}: {
  quotes: MarketQuote[];
  watchlist: string[];
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
  onAdd: (symbol: string) => void;
  onRemove: (symbol: string) => void;
  history: Array<HistoricalCandle & { sma20?: number | null; sma50?: number | null; rsi14?: number | null }>;
}) {
  const [newSymbol, setNewSymbol] = useState('');
  const selected = quotes.find((quote) => quote.symbol === selectedSymbol);
  const miniData = history.slice(-120).map((item) => ({ date: item.date.slice(5), close: item.close, sma20: item.sma20, sma50: item.sma50 }));
  const latest = history.at(-1) as (HistoricalCandle & { rsi14?: number | null; sma20?: number | null; sma50?: number | null }) | undefined;

  return (
    <div className="space-y-4">
      <section className="glass-card rounded-[1.75rem] p-4">
        <SectionTitle icon={<Search />} title="Watchlist" subtitle="Real market quotes" />
        <div className="mt-4 flex gap-2">
          <input value={newSymbol} onChange={(event) => setNewSymbol(event.target.value.toUpperCase())} className="input flex-1" placeholder="Add symbol" />
          <button
            type="button"
            onClick={() => {
              onAdd(newSymbol);
              setNewSymbol('');
            }}
            className="secondary-button px-4"
          >
            Add
          </button>
        </div>
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {watchlist.map((symbol) => (
            <button
              type="button"
              key={symbol}
              onClick={() => onSelect(symbol)}
              className={`rounded-full border px-4 py-2 text-sm ${selectedSymbol === symbol ? 'border-cyan-300 bg-cyan-300/15 text-cyan-100' : 'border-white/10 bg-white/[0.04] text-slate-300'}`}
            >
              {symbol}
            </button>
          ))}
        </div>
      </section>

      <section className="glass-card rounded-[2rem] p-5">
        <div className="flex justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Selected symbol</p>
            <h2 className="mt-1 text-3xl font-semibold">{selectedSymbol}</h2>
            <p className="text-sm text-slate-400">{selected?.name ?? 'Custom / provider symbol'}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold">{selected ? formatUsd(selected.price) : '—'}</p>
            <p className={selected && selected.changePercent >= 0 ? 'text-sm text-emerald-300' : 'text-sm text-rose-300'}>
              {selected ? `${formatSigned(selected.change)} · ${selected.changePercent.toFixed(2)}%` : 'No quote'}
            </p>
          </div>
        </div>
        <div className="mt-5 h-64">
          {miniData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={miniData} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis domain={['dataMin', 'dataMax']} hide />
                <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(148,163,184,.2)', borderRadius: 16 }} />
                <Line type="monotone" dataKey="close" stroke="#22d3ee" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="sma20" stroke="#a78bfa" dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="sma50" stroke="#f59e0b" dot={false} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="Choose a valid US symbol to load history." />
          )}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <MetricCard label="RSI 14" value={latest?.rsi14 ? latest.rsi14.toFixed(1) : '—'} />
          <MetricCard label="SMA20" value={latest?.sma20 ? formatUsd(latest.sma20) : '—'} />
          <MetricCard label="SMA50" value={latest?.sma50 ? formatUsd(latest.sma50) : '—'} />
        </div>
      </section>

      <section className="space-y-2">
        {quotes.map((quote) => (
          <div key={quote.symbol} className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <button type="button" onClick={() => onSelect(quote.symbol)} className="text-left">
              <p className="font-semibold">{quote.symbol}</p>
              <p className="text-xs text-slate-400">{quote.name ?? quote.assetType}</p>
            </button>
            <div className="flex items-center gap-3 text-right">
              <div>
                <p className="font-semibold">{formatUsd(quote.price)}</p>
                <p className={quote.changePercent >= 0 ? 'text-xs text-emerald-300' : 'text-xs text-rose-300'}>{quote.changePercent.toFixed(2)}%</p>
              </div>
              <button type="button" onClick={() => onRemove(quote.symbol)} className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
                Remove
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function BacktestView({
  selectedSymbol,
  setSelectedSymbol,
  history,
  backtest,
  isLoading
}: {
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  history: HistoricalCandle[];
  backtest?: BacktestResult;
  isLoading: boolean;
}) {
  const data = backtest?.equityCurve.slice(-180).map((item) => ({ date: item.date.slice(5), value: item.value })) ?? [];
  return (
    <div className="space-y-4">
      <section className="glass-card rounded-[1.75rem] p-5">
        <SectionTitle icon={<Activity />} title="Backtest simulator" subtitle="Built-in RSI strategy" />
        <div className="mt-4 flex gap-3">
          <input value={selectedSymbol} onChange={(event) => setSelectedSymbol(event.target.value.toUpperCase())} className="input flex-1" />
          <div className="rounded-2xl bg-white/[0.04] px-4 py-3 text-sm text-slate-300">{history.length} days</div>
        </div>
      </section>

      <section className="glass-card rounded-[2rem] p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400">Strategy result</p>
            <h2 className="mt-1 text-2xl font-semibold">{backtest ? `${backtest.totalReturnPercent.toFixed(2)}%` : '—'}</h2>
          </div>
          <Pill positive={(backtest?.totalReturnPercent ?? 0) >= 0}>{backtest?.strategy ?? 'Loading…'}</Pill>
        </div>
        <div className="mt-5 h-56">
          {data.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(16, 185, 129, 0.5)" />
                    <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis hide domain={['dataMin', 'dataMax']} />
                <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(148,163,184,.2)', borderRadius: 16 }} />
                <Area type="monotone" dataKey="value" stroke="#10b981" fill="url(#equityGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState loading={isLoading} text="Loading backtest…" />
          )}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <MetricCard label="Final value" value={backtest ? formatUsd(backtest.finalValue) : '—'} />
          <MetricCard label="Max drawdown" value={backtest ? `${backtest.maxDrawdownPercent.toFixed(2)}%` : '—'} positive={false} />
          <MetricCard label="Win rate" value={backtest ? `${backtest.winRatePercent.toFixed(1)}%` : '—'} />
          <MetricCard label="Sharpe" value={backtest ? backtest.sharpe.toFixed(2) : '—'} />
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-sky-300/20 bg-sky-300/10 p-4 text-sm leading-6 text-sky-100">
        This first strategy is intentionally simple: buy when RSI is below 30 and sell when RSI is above 70. It is for simulation and education only.
      </section>
    </div>
  );
}

function AiView({ insight, isLoading, onRefresh }: { insight?: AiInsight; isLoading: boolean; onRefresh: () => void }) {
  return (
    <div className="space-y-4">
      <section className="glass-card rounded-[2rem] p-5">
        <div className="flex items-start justify-between gap-3">
          <SectionTitle icon={<Sparkles />} title="AI assistant" subtitle="Educational, explainable signals" />
          <button type="button" onClick={onRefresh} className="secondary-button px-4 py-2 text-sm">
            Refresh
          </button>
        </div>
        <div className="mt-5 rounded-3xl bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">{insight?.rating ?? (isLoading ? 'Thinking' : 'Ready')}</p>
          <h2 className="mt-2 text-2xl font-semibold">{insight?.title ?? 'Portfolio analysis'}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {insight?.summary ?? 'Refresh after adding holdings to receive an educational explanation of risk, momentum, concentration, and recent movement.'}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <MetricCard label="Risk" value={insight ? `${insight.riskScore}` : '—'} />
          <MetricCard label="Momentum" value={insight ? `${insight.momentumScore}` : '—'} />
          <MetricCard label="Valuation" value={insight ? `${insight.valuationScore}` : '—'} />
        </div>
      </section>

      <section className="glass-card rounded-[1.75rem] p-4">
        <SectionTitle icon={<BrainCircuit />} title="Evidence" subtitle="Why the score was generated" />
        <div className="mt-4 space-y-3">
          {(insight?.evidence ?? ['No evidence available yet. Add holdings or refresh market data.']).map((item) => (
            <div key={item} className="rounded-2xl bg-white/[0.04] p-3 text-sm leading-6 text-slate-300">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
        {insight?.disclaimer ?? DISCLAIMER}
      </section>
    </div>
  );
}

function SettingsView({
  portfolio,
  onReset,
  installHintVisible,
  setInstallHintVisible
}: {
  portfolio: Portfolio;
  onReset: () => void;
  installHintVisible: boolean;
  setInstallHintVisible: (visible: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <section className="glass-card rounded-[2rem] p-5">
        <SectionTitle icon={<Download />} title="Install on iPhone" subtitle="PWA home-screen mode" />
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Open the hosted URL in Safari, tap Share, then choose Add to Home Screen. The app will open like a standalone iPhone app.
        </p>
        <button type="button" onClick={() => setInstallHintVisible(!installHintVisible)} className="secondary-button mt-4 w-full">
          {installHintVisible ? 'Hide steps' : 'Show iPhone steps'}
        </button>
        {installHintVisible && (
          <ol className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
            <li>1. Open the deployed link in Safari.</li>
            <li>2. Tap the Share button.</li>
            <li>3. Tap Add to Home Screen.</li>
            <li>4. Launch PaperLab AI from the icon.</li>
          </ol>
        )}
      </section>

      <section className="glass-card rounded-[1.75rem] p-5">
        <SectionTitle icon={<Bell />} title="Personal data" subtitle="Stored in this browser for MVP" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <MetricCard label="Transactions" value={portfolio.transactions.length.toString()} />
          <MetricCard label="Holdings" value={portfolio.holdings.length.toString()} />
        </div>
        <button type="button" onClick={onReset} className="mt-4 w-full rounded-2xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 font-semibold text-rose-100">
          Reset local MVP data
        </button>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300">
        <p className="font-semibold text-slate-100">MVP scope</p>
        <p className="mt-2">
          This implementation uses browser storage for personal use and serverless API routes for market data. Supabase Auth and PostgreSQL can be added next without changing the mobile UI flow.
        </p>
      </section>
    </div>
  );
}

function TabButton({ icon, label, active, onClick }: { icon: ReactElement; label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex flex-col items-center rounded-2xl px-1 py-2 text-[10px] ${active ? 'bg-cyan-300/15 text-cyan-200' : 'text-slate-400'}`}>
      <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <span className="mt-1">{label}</span>
    </button>
  );
}

function SectionTitle({ icon, title, subtitle }: { icon: ReactElement; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-2xl bg-cyan-300/10 p-2 text-cyan-200 [&>svg]:h-5 [&>svg]:w-5">{icon}</div>
      <div>
        <h2 className="font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function MetricCard({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  const tone = positive === undefined ? 'text-slate-50' : positive ? 'text-emerald-300' : 'text-rose-300';
  return (
    <div className="rounded-2xl bg-white/[0.04] p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function RiskTile({ title, value, label }: { title: string; value: string; label: string }) {
  return (
    <section className="glass-card rounded-[1.5rem] p-4">
      <p className="text-xs text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{label}</p>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Pill({ children, positive }: { children: ReactNode; positive: boolean }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${positive ? 'bg-emerald-300/10 text-emerald-200' : 'bg-rose-300/10 text-rose-200'}`}>{children}</span>;
}

function EmptyState({ text, loading }: { text: string; loading?: boolean }) {
  return (
    <div className="flex h-full min-h-32 items-center justify-center rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">
      {loading ? 'Loading… ' : ''}
      {text}
    </div>
  );
}

function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
}

function formatSigned(value: number) {
  const formatted = formatUsd(Math.abs(value));
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
}
