-- Restores application access through the verified Supabase login while
-- keeping anonymous visitors completely blocked.

create table if not exists public.app_authorized_users (
    user_id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);

alter table public.app_authorized_users enable row level security;
revoke all on table public.app_authorized_users from anon, authenticated;

-- Automatically authorize the account when this project contains exactly one
-- Auth user. This matches the private single-user SRT installation.
insert into public.app_authorized_users (user_id)
select id
from auth.users
where (select count(*) from auth.users) = 1
limit 1
on conflict (user_id) do nothing;

create or replace function public.is_srt_authorized()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.app_authorized_users
        where user_id = (select auth.uid())
    );
$$;

revoke all on function public.is_srt_authorized() from public, anon, authenticated;
grant execute on function public.is_srt_authorized() to authenticated;

grant select, insert, update, delete on table public.drivers to authenticated;
grant select, insert, update, delete on table public.regions to authenticated;
grant select, insert, update, delete on table public.vehicles to authenticated;
grant select, insert, update, delete on table public.trips to authenticated;
grant select, insert, update, delete on table public.app_settings to authenticated;
grant select on table public.trip_details to authenticated;

drop policy if exists "SRT authorized access" on public.drivers;
create policy "SRT authorized access"
on public.drivers for all to authenticated
using ((select public.is_srt_authorized()))
with check ((select public.is_srt_authorized()));

drop policy if exists "SRT authorized access" on public.regions;
create policy "SRT authorized access"
on public.regions for all to authenticated
using ((select public.is_srt_authorized()))
with check ((select public.is_srt_authorized()));

drop policy if exists "SRT authorized access" on public.vehicles;
create policy "SRT authorized access"
on public.vehicles for all to authenticated
using ((select public.is_srt_authorized()))
with check ((select public.is_srt_authorized()));

drop policy if exists "SRT authorized access" on public.trips;
create policy "SRT authorized access"
on public.trips for all to authenticated
using ((select public.is_srt_authorized()))
with check ((select public.is_srt_authorized()));

drop policy if exists "SRT authorized access" on public.app_settings;
create policy "SRT authorized access"
on public.app_settings for all to authenticated
using ((select public.is_srt_authorized()))
with check ((select public.is_srt_authorized()));
