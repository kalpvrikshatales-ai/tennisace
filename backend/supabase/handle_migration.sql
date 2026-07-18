-- Add handle column to sparring_profiles
alter table sparring_profiles add column if not exists handle text unique;
create index if not exists idx_sparring_profiles_handle on sparring_profiles(lower(handle));
