-- Play Requests migration
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/wffxyjuecritbiyfdane/sql

create table if not exists play_requests (
  id              uuid default gen_random_uuid() primary key,
  profile_id      uuid references sparring_profiles(id) on delete cascade,
  city            text not null,
  country         text not null,
  date            date not null,
  time_slot       text not null,
  players_needed  integer default 1,
  level           text,
  surface         text,
  format          text check (format in ('singles','doubles','hitting','coaching')),
  location_name   text,
  notes           text,
  status          text default 'open' check (status in ('open','full','expired','cancelled')),
  expires_at      timestamptz not null,
  created_at      timestamptz default now()
);

create table if not exists play_request_joins (
  id          uuid default gen_random_uuid() primary key,
  request_id  uuid references play_requests(id) on delete cascade,
  profile_id  uuid references sparring_profiles(id) on delete cascade,
  joined_at   timestamptz default now(),
  unique(request_id, profile_id)
);

-- Index for city lookups
create index if not exists idx_play_requests_city        on play_requests(lower(city));
create index if not exists idx_play_requests_status_exp  on play_requests(status, expires_at);
create index if not exists idx_play_request_joins_req    on play_request_joins(request_id);
