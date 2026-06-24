-- TennisAce database schema
-- Run this in Supabase SQL Editor after creating your project

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Tournaments
create table if not exists tournaments (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  surface     text not null check (surface in ('Grass','Clay','Hard','Carpet')),
  country     text not null,
  start_date  date,
  end_date    date,
  prize_money bigint,
  created_at  timestamptz default now()
);

-- Players
create table if not exists players (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  country     text,
  ranking     int,
  hand        text check (hand in ('Right','Left')),
  created_at  timestamptz default now()
);

-- Matches
create table if not exists matches (
  id              uuid primary key default uuid_generate_v4(),
  external_id     text unique,          -- API-Tennis match id
  tournament_id   uuid references tournaments(id),
  player1_id      uuid references players(id),
  player2_id      uuid references players(id),
  player1_name    text not null,
  player2_name    text not null,
  score           text,
  status          text not null default 'Scheduled',
  tournament_name text,
  round           text,
  started_at      timestamptz,
  updated_at      timestamptz default now(),
  created_at      timestamptz default now()
);

-- Index for fast live-score lookups
create index if not exists matches_status_idx on matches(status);
create index if not exists matches_updated_idx on matches(updated_at desc);

-- Seed tournaments (matches what the mock data returns)
insert into tournaments (name, surface, country) values
  ('Wimbledon',        'Grass', 'UK'),
  ('US Open',          'Hard',  'USA'),
  ('Roland Garros',    'Clay',  'France'),
  ('Australian Open',  'Hard',  'Australia')
on conflict do nothing;

-- Row Level Security (public read, service-role write)
alter table tournaments enable row level security;
alter table players     enable row level security;
alter table matches     enable row level security;

create policy "public_read_tournaments" on tournaments for select using (true);
create policy "public_read_players"     on players     for select using (true);
create policy "public_read_matches"     on matches     for select using (true);
