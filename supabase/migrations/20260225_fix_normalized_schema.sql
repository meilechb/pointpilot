-- ============================================================
-- Fix database schema: replace JSON blob tables with normalized ones
-- The original migration (20260224) created trips/wallet with a single
-- "data jsonb" column, but the application code expects normalized columns.
-- This migration recreates the tables with the correct schema.
-- ============================================================

-- 1. Drop old tables (cascade drops dependent objects like triggers, policies)
drop table if exists wallet cascade;
drop table if exists trips cascade;

-- 2. Create normalized trips table
create table trips (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  trip_type text not null default 'roundtrip',
  departure_date text,
  return_date text,
  travelers integer not null default 1,
  date_flexibility text default 'exact',
  status text default 'planning',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index trips_user_id_idx on trips(user_id);

-- 3. Create legs table
create table legs (
  id text primary key,
  trip_id uuid not null references trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  leg_order integer not null default 0,
  from_city text not null default '',
  to_city text not null default ''
);

create index legs_trip_id_idx on legs(trip_id);

-- 4. Create flights table
create table flights (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references trips(id) on delete cascade,
  leg_index integer,
  segments jsonb not null default '{}',
  booking_site text,
  payment_type text default 'cash',
  cash_amount numeric,
  points_amount numeric,
  fees_amount numeric,
  created_at timestamptz default now()
);

create index flights_trip_id_idx on flights(trip_id);
create index flights_user_id_idx on flights(user_id);

-- 5. Create itineraries table
create table itineraries (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null default '',
  assignments jsonb not null default '{}',
  totals jsonb not null default '{}',
  travelers integer not null default 1,
  created_at timestamptz default now()
);

create index itineraries_trip_id_idx on itineraries(trip_id);

-- 6. Create normalized wallet table
create table wallet (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  currency_type text not null default 'points',
  program text not null default '',
  balance numeric not null default 0,
  redemption_value numeric,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index wallet_user_id_idx on wallet(user_id);

-- 7. Enable RLS on all tables
alter table trips enable row level security;
alter table legs enable row level security;
alter table flights enable row level security;
alter table itineraries enable row level security;
alter table wallet enable row level security;

-- 8. RLS policies — trips
create policy "Users can read own trips" on trips
  for select using (auth.uid() = user_id);
create policy "Users can insert own trips" on trips
  for insert with check (auth.uid() = user_id);
create policy "Users can update own trips" on trips
  for update using (auth.uid() = user_id);
create policy "Users can delete own trips" on trips
  for delete using (auth.uid() = user_id);

-- 9. RLS policies — legs
create policy "Users can read own legs" on legs
  for select using (auth.uid() = user_id);
create policy "Users can insert own legs" on legs
  for insert with check (auth.uid() = user_id);
create policy "Users can update own legs" on legs
  for update using (auth.uid() = user_id);
create policy "Users can delete own legs" on legs
  for delete using (auth.uid() = user_id);

-- 10. RLS policies — flights
create policy "Users can read own flights" on flights
  for select using (auth.uid() = user_id);
create policy "Users can insert own flights" on flights
  for insert with check (auth.uid() = user_id);
create policy "Users can update own flights" on flights
  for update using (auth.uid() = user_id);
create policy "Users can delete own flights" on flights
  for delete using (auth.uid() = user_id);

-- 11. RLS policies — itineraries
create policy "Users can read own itineraries" on itineraries
  for select using (auth.uid() = user_id);
create policy "Users can insert own itineraries" on itineraries
  for insert with check (auth.uid() = user_id);
create policy "Users can update own itineraries" on itineraries
  for update using (auth.uid() = user_id);
create policy "Users can delete own itineraries" on itineraries
  for delete using (auth.uid() = user_id);

-- 12. RLS policies — wallet
create policy "Users can read own wallet" on wallet
  for select using (auth.uid() = user_id);
create policy "Users can insert own wallet" on wallet
  for insert with check (auth.uid() = user_id);
create policy "Users can update own wallet" on wallet
  for update using (auth.uid() = user_id);
create policy "Users can delete own wallet" on wallet
  for delete using (auth.uid() = user_id);

-- 13. Updated_at triggers
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
