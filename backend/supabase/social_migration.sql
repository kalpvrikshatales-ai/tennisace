-- Social profile migration: follows + highlight video link
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/wffxyjuecritbiyfdane/sql

-- 1. Highlight video link (YouTube / Instagram) on the profile
alter table sparring_profiles
  add column if not exists video_url text;

-- 2. Follows (one-way, Instagram-style)
create table if not exists follows (
  follower_id  uuid references sparring_profiles(id) on delete cascade,
  following_id uuid references sparring_profiles(id) on delete cascade,
  created_at   timestamptz default now(),
  primary key (follower_id, following_id)
);

create index if not exists idx_follows_follower  on follows(follower_id);
create index if not exists idx_follows_following on follows(following_id);

alter table follows enable row level security;
create policy "public_read_follows"  on follows for select using (true);
create policy "public_write_follows" on follows for insert, update, delete using (true);
