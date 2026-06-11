-- 1. Create WALLETS table
create table public.wallets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  balance numeric(15, 2) default 0.00 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.wallets enable row level security;

create policy "Users can manage their own wallets" on public.wallets
  for all using (auth.uid() = user_id);


-- 2. Create CATEGORIES table
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text check (type in ('income', 'expense')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.categories enable row level security;

create policy "Users can manage their own categories" on public.categories
  for all using (auth.uid() = user_id);


-- 3. Create TRANSACTIONS table
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  wallet_id uuid references public.wallets(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(15, 2) not null check (amount > 0),
  type text check (type in ('income', 'expense')) not null,
  notes text default '' not null,
  transaction_date date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.transactions enable row level security;

create policy "Users can manage their own transactions" on public.transactions
  for all using (auth.uid() = user_id);


-- 4. Create BUDGETS table
create table public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  limit_amount numeric(15, 2) not null check (limit_amount > 0),
  period text not null, -- Format: YYYY-MM
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, category_id, period)
);

alter table public.budgets enable row level security;

create policy "Users can manage their own budgets" on public.budgets
  for all using (auth.uid() = user_id);


-- 5. Create FINANCIAL_GOALS table
create table public.financial_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  target_amount numeric(15, 2) not null check (target_amount > 0),
  current_amount numeric(15, 2) default 0.00 not null,
  target_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.financial_goals enable row level security;

create policy "Users can manage their own financial_goals" on public.financial_goals
  for all using (auth.uid() = user_id);
