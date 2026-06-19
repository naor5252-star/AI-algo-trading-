import type { Holding, MarketQuote, Portfolio, PortfolioMetrics, Transaction } from './types';

export const DISCLAIMER =
  'This application is for educational and simulation purposes only. It does not provide financial advice, investment recommendations, or execute real trades. Users are solely responsible for their investment decisions.';

export function createDefaultPortfolio(): Portfolio {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: 'Personal Paper Portfolio',
    baseCurrency: 'USD',
    cash: 10000,
    initialDeposit: 10000,
    recurringDeposit: 500,
    holdings: [],
    transactions: [
      {
        id: crypto.randomUUID(),
        type: 'deposit',
        amount: 10000,
        createdAt: now
      }
    ],
    createdAt: now,
    updatedAt: now
  };
}

export function buyHolding(portfolio: Portfolio, symbol: string, name: string | undefined, quantity: number, price: number): Portfolio {
  if (quantity <= 0 || price <= 0) return portfolio;
  const cost = roundCurrency(quantity * price);
  if (cost > portfolio.cash) return portfolio;

  const existing = portfolio.holdings.find((holding) => holding.symbol === symbol.toUpperCase());
  let holdings: Holding[];

  if (existing) {
    const nextQuantity = existing.quantity + quantity;
    const nextCost = existing.quantity * existing.averageCost + cost;
    holdings = portfolio.holdings.map((holding) =>
      holding.id === existing.id
        ? { ...holding, quantity: roundQuantity(nextQuantity), averageCost: roundCurrency(nextCost / nextQuantity), name: name ?? holding.name }
        : holding
    );
  } else {
    holdings = [
      ...portfolio.holdings,
      {
        id: crypto.randomUUID(),
        symbol: symbol.toUpperCase(),
        name,
        quantity: roundQuantity(quantity),
        averageCost: roundCurrency(price),
        assetType: symbol.toUpperCase().includes('SPY') || symbol.toUpperCase().includes('QQQ') ? 'etf' : 'stock'
      }
    ];
  }

  return appendTransaction(
    {
      ...portfolio,
      cash: roundCurrency(portfolio.cash - cost),
      holdings
    },
    {
      id: crypto.randomUUID(),
      type: 'buy',
      symbol: symbol.toUpperCase(),
      quantity,
      price,
      amount: cost,
      createdAt: new Date().toISOString()
    }
  );
}

export function sellHolding(portfolio: Portfolio, symbol: string, quantity: number, price: number): Portfolio {
  const holding = portfolio.holdings.find((item) => item.symbol === symbol.toUpperCase());
  if (!holding || quantity <= 0 || price <= 0) return portfolio;
  const sellQuantity = Math.min(quantity, holding.quantity);
  const proceeds = roundCurrency(sellQuantity * price);

  const holdings = portfolio.holdings
    .map((item) => (item.id === holding.id ? { ...item, quantity: roundQuantity(item.quantity - sellQuantity) } : item))
    .filter((item) => item.quantity > 0.0001);

  return appendTransaction(
    {
      ...portfolio,
      cash: roundCurrency(portfolio.cash + proceeds),
      holdings
    },
    {
      id: crypto.randomUUID(),
      type: 'sell',
      symbol: symbol.toUpperCase(),
      quantity: sellQuantity,
      price,
      amount: proceeds,
      createdAt: new Date().toISOString()
    }
  );
}

export function addDeposit(portfolio: Portfolio, amount: number): Portfolio {
  if (amount <= 0) return portfolio;
  return appendTransaction(
    {
      ...portfolio,
      cash: roundCurrency(portfolio.cash + amount)
    },
    {
      id: crypto.randomUUID(),
      type: 'deposit',
      amount: roundCurrency(amount),
      createdAt: new Date().toISOString()
    }
  );
}

function appendTransaction(portfolio: Portfolio, transaction: Transaction): Portfolio {
  return {
    ...portfolio,
    transactions: [transaction, ...portfolio.transactions],
    updatedAt: new Date().toISOString()
  };
}

export function calculatePortfolioMetrics(portfolio: Portfolio, quotes: Record<string, MarketQuote | undefined>): PortfolioMetrics {
  const positions = portfolio.holdings.map((holding) => {
    const quote = quotes[holding.symbol];
    const price = quote?.price ?? holding.averageCost;
    const value = roundCurrency(holding.quantity * price);
    const costBasis = roundCurrency(holding.quantity * holding.averageCost);
    const previousPrice = quote?.previousClose ?? quote?.open ?? price;
    const dayChange = roundCurrency((price - previousPrice) * holding.quantity);

    return {
      symbol: holding.symbol,
      value,
      costBasis,
      dayChange
    };
  });

  const holdingsValue = roundCurrency(positions.reduce((sum, item) => sum + item.value, 0));
  const investedValue = roundCurrency(portfolio.transactions.filter((t) => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0));
  const totalValue = roundCurrency(portfolio.cash + holdingsValue);
  const totalCostBasis = roundCurrency(positions.reduce((sum, item) => sum + item.costBasis, 0));
  const unrealizedPnL = roundCurrency(holdingsValue - totalCostBasis);
  const totalReturn = roundCurrency(totalValue - investedValue);
  const dayChange = roundCurrency(positions.reduce((sum, item) => sum + item.dayChange, 0));
  const largest = positions.toSorted((a, b) => b.value - a.value)[0];

  return {
    totalValue,
    investedValue,
    holdingsValue,
    cash: portfolio.cash,
    totalCostBasis,
    unrealizedPnL,
    unrealizedPnLPercent: totalCostBasis ? roundPercent((unrealizedPnL / totalCostBasis) * 100) : 0,
    totalReturn,
    totalReturnPercent: investedValue ? roundPercent((totalReturn / investedValue) * 100) : 0,
    dayChange,
    dayChangePercent: totalValue ? roundPercent((dayChange / totalValue) * 100) : 0,
    concentrationRisk: totalValue && largest ? roundPercent((largest.value / totalValue) * 100) : 0,
    largestPositionSymbol: largest?.symbol,
    allocation: positions.map((item) => ({
      symbol: item.symbol,
      value: item.value,
      percent: totalValue ? roundPercent((item.value / totalValue) * 100) : 0
    }))
  };
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function roundQuantity(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000000) / 1000000;
}

export function roundPercent(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
