-- Subscriptions table: tracks user plan + Stripe info
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'free',  -- 'free', 'active', 'past_due', 'canceled'
  plan text not null default 'free',    -- 'free', 'pro'
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists subscriptions_user_id_idx on subscriptions(user_id);
create index if not exists subscriptions_stripe_customer_id_idx on subscriptions(stripe_customer_id);
alter table subscriptions enable row level security;

create policy "Users can read own subscription" on subscriptions
  for select using (auth.uid() = user_id);

-- Scan usage tracking: one row per scan for metering
create table if not exists scan_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scanned_at timestamptz default now(),
  page_url text
);

create index if not exists scan_usage_user_id_idx on scan_usage(user_id);
create index if not exists scan_usage_user_month_idx on scan_usage(user_id, scanned_at);
alter table scan_usage enable row level security;

create policy "Users can read own scans" on scan_usage
  for select using (auth.uid() = user_id);

-- Reuse existing updated_at trigger
create trigger subscriptions_updated_at before update on subscriptions
  for each row execute function update_updated_at();
