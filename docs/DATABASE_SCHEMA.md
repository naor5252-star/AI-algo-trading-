# Database Schema For Supabase Upgrade

The MVP uses browser storage. This schema is the recommended cloud persistence model for the next phase.

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  base_currency text not null default 'USD',
  created_at timestamptz not null default now()
);

create table portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  base_currency text not null default 'USD',
  cash numeric(18, 4) not null default 0,
  initial_deposit numeric(18, 4) not null default 0,
  recurring_deposit numeric(18, 4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table holdings (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  symbol text not null,
  name text,
  asset_type text not null default 'stock',
  quantity numeric(18, 8) not null,
  average_cost numeric(18, 4) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(portfolio_id, symbol)
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  type text not null check (type in ('buy', 'sell', 'deposit')),
  symbol text,
  quantity numeric(18, 8),
  price numeric(18, 4),
  amount numeric(18, 4) not null,
  created_at timestamptz not null default now()
);

create table watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  symbol text not null,
  created_at timestamptz not null default now(),
  unique(user_id, symbol)
);

create table ai_insights (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references portfolios(id) on delete cascade,
  rating text not null,
  summary text not null,
  evidence jsonb not null default '[]',
  risk_score int,
  momentum_score int,
  valuation_score int,
  created_at timestamptz not null default now()
);

create table backtest_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  symbol text not null,
  strategy text not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);
```
