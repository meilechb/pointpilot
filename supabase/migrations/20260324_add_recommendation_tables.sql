-- ============================================================
-- Award Charts: pricing by program, route region, and cabin class
-- ============================================================
create table award_charts (
  id uuid primary key default gen_random_uuid(),
  program_name text not null,
  origin_region text not null,
  destination_region text not null,
  cabin_class text not null check (cabin_class in ('economy', 'premium_economy', 'business', 'first')),
  pricing_type text not null default 'fixed' check (pricing_type in ('fixed', 'dynamic', 'mixed')),
  points_min integer not null,
  points_max integer,
  is_one_way boolean not null default true,
  partner_airlines text[],
  notes text,
  source text,
  last_verified_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index award_charts_program_idx on award_charts(program_name);
create index award_charts_route_idx on award_charts(origin_region, destination_region);
create index award_charts_cabin_idx on award_charts(cabin_class);

-- ============================================================
-- Route Regions: map airports/countries to award chart zones
-- ============================================================
create table route_regions (
  id uuid primary key default gen_random_uuid(),
  region_name text not null,
  program_name text,
  airport_codes text[],
  country_codes text[],
  description text,
  created_at timestamptz default now()
);

create index route_regions_name_idx on route_regions(region_name);
create index route_regions_program_idx on route_regions(program_name);

-- ============================================================
-- Surcharge Profiles: fuel surcharges by booking program + operating airline
-- ============================================================
create table surcharge_profiles (
  id uuid primary key default gen_random_uuid(),
  booking_program text not null,
  operating_airline text not null,
  route_type text,
  cabin_class text,
  estimated_surcharge_usd numeric not null,
  surcharge_level text not null default 'medium' check (surcharge_level in ('none', 'low', 'medium', 'high', 'extreme')),
  notes text,
  last_verified_at timestamptz default now(),
  created_at timestamptz default now()
);

create index surcharge_profiles_program_idx on surcharge_profiles(booking_program);
create index surcharge_profiles_airline_idx on surcharge_profiles(operating_airline);

-- ============================================================
-- Program Rules: stopovers, transfer timing, mixed-cabin, etc.
-- ============================================================
create table program_rules (
  id uuid primary key default gen_random_uuid(),
  program_name text not null,
  rule_type text not null,
  rule_value jsonb not null,
  notes text,
  last_verified_at timestamptz default now(),
  created_at timestamptz default now()
);

create index program_rules_program_idx on program_rules(program_name);
create index program_rules_type_idx on program_rules(rule_type);

-- ============================================================
-- Sweet Spots DB: dynamic, admin-managed sweet spots
-- ============================================================
create table sweet_spots_db (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  programs text[] not null,
  origin_region text,
  destination_region text,
  cabin_class text,
  points_required integer,
  estimated_cpp numeric,
  estimated_cash_value integer,
  description text not null,
  booking_steps text[],
  is_active boolean default true,
  priority integer default 0,
  tags text[],
  last_verified_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index sweet_spots_db_active_idx on sweet_spots_db(is_active);
create index sweet_spots_db_programs_idx on sweet_spots_db using gin(programs);

-- ============================================================
-- Award Price History: track trends over time
-- ============================================================
create table award_price_history (
  id uuid primary key default gen_random_uuid(),
  program_name text not null,
  origin text not null,
  destination text not null,
  cabin_class text not null,
  points_price integer not null,
  cash_price_usd numeric,
  observed_at timestamptz default now(),
  source text
);

create index award_price_history_route_idx on award_price_history(origin, destination);
create index award_price_history_program_idx on award_price_history(program_name);
create index award_price_history_date_idx on award_price_history(observed_at);

-- ============================================================
-- RLS: These are admin-managed reference tables, public read
-- ============================================================
alter table award_charts enable row level security;
alter table route_regions enable row level security;
alter table surcharge_profiles enable row level security;
alter table program_rules enable row level security;
alter table sweet_spots_db enable row level security;
alter table award_price_history enable row level security;

-- Public read policies for all reference tables
create policy "Public read award_charts" on award_charts for select using (true);
create policy "Public read route_regions" on route_regions for select using (true);
create policy "Public read surcharge_profiles" on surcharge_profiles for select using (true);
create policy "Public read program_rules" on program_rules for select using (true);
create policy "Public read sweet_spots_db" on sweet_spots_db for select using (true);
create policy "Public read award_price_history" on award_price_history for select using (true);
