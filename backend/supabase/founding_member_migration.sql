-- Founding Member system migration
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/wffxyjuecritbiyfdane/sql

-- 1. Extend sparring_profiles with founding member fields
alter table sparring_profiles
  add column if not exists profile_type text default 'player'
    check (profile_type in ('player','coach','organizer'));

alter table sparring_profiles
  add column if not exists founding_number integer;

alter table sparring_profiles
  add column if not exists founding_city text;

-- 2. City progress tracking table
create table if not exists city_progress (
  city            text primary key,
  country         text not null,
  player_count    integer default 0,
  coach_count     integer default 0,
  player_target   integer default 500,
  coach_target    integer default 50,
  status          text default 'building'
    check (status in ('building','early_access','community_launch','full_launch')),
  launched_at     timestamptz,
  updated_at      timestamptz default now()
);

-- Seed Mumbai as the first city
insert into city_progress (city, country, player_target, coach_target)
  values ('Mumbai', 'India', 500, 50)
  on conflict do nothing;

-- 3. Function: auto-assign founding number per city
create or replace function assign_founding_number()
returns trigger as $$
declare
  next_num integer;
begin
  select coalesce(max(founding_number), 0) + 1
    into next_num
    from sparring_profiles
   where lower(trim(city)) = lower(trim(new.city));

  new.founding_number := next_num;
  new.founding_city   := new.city;
  return new;
end;
$$ language plpgsql;

-- 4. Trigger: fires before each insert on sparring_profiles
drop trigger if exists set_founding_number on sparring_profiles;
create trigger set_founding_number
  before insert on sparring_profiles
  for each row execute procedure assign_founding_number();

-- 5. Function: keep city_progress counts in sync
create or replace function update_city_progress()
returns trigger as $$
begin
  insert into city_progress (city, country, player_count, coach_count)
    select
      new.city,
      new.country,
      count(*) filter (where profile_type in ('player','organizer')),
      count(*) filter (where profile_type = 'coach')
    from sparring_profiles
    where lower(trim(city)) = lower(trim(new.city))
  on conflict (city) do update
    set player_count = excluded.player_count,
        coach_count  = excluded.coach_count,
        updated_at   = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists sync_city_progress on sparring_profiles;
create trigger sync_city_progress
  after insert on sparring_profiles
  for each row execute procedure update_city_progress();
