-- Shared trips: UUID-token-based read-only shareable links
-- Viewers do not need an account to view a shared trip

create table if not exists public.shared_trips (
  token       uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Index for fast lookup by trip_id (e.g. "does this trip already have a share token?")
create index if not exists shared_trips_trip_id_idx on public.shared_trips(trip_id);

-- RLS
alter table public.shared_trips enable row level security;

-- Authenticated users can manage their own share tokens
create policy "Users can insert their own share tokens"
  on public.shared_trips for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can select their own share tokens"
  on public.shared_trips for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own share tokens"
  on public.shared_trips for delete
  to authenticated
  using (auth.uid() = user_id);

-- Public (anon) read is intentionally NOT granted via RLS.
-- The share/[token] API route uses the service role key to bypass RLS for public lookups.
