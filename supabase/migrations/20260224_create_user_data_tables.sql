-- Trips table: stores the full trip JSON blob per user
create table if not exists trips (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Wallet table: stores wallet entries per user
create table if not exists wallet (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists trips_user_id_idx on trips(user_id);
create index if not exists wallet_user_id_idx on wallet(user_id);

-- Enable RLS
alter table trips enable row level security;
alter table wallet enable row level security;

-- RLS policies: users can only access their own data
create policy "Users can read own trips" on trips
  for select using (auth.uid() = user_id);

create policy "Users can insert own trips" on trips
  for insert with check (auth.uid() = user_id);

create policy "Users can update own trips" on trips
  for update using (auth.uid() = user_id);

create policy "Users can delete own trips" on trips
  for delete using (auth.uid() = user_id);

create policy "Users can read own wallet" on wallet
  for select using (auth.uid() = user_id);

create policy "Users can insert own wallet" on wallet
  for insert with check (auth.uid() = user_id);

create policy "Users can update own wallet" on wallet
  for update using (auth.uid() = user_id);

create policy "Users can delete own wallet" on wallet
  for delete using (auth.uid() = user_id);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trips_updated_at before update on trips
  for each row execute function update_updated_at();

create trigger wallet_updated_at before update on wallet
  for each row execute function update_updated_at();
