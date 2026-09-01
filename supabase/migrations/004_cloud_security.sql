-- Cloud security: the browser may authenticate, but business data is only
-- accessed by the protected Next.js server after it verifies the allowed user.

alter table public.drivers enable row level security;
alter table public.regions enable row level security;
alter table public.vehicles enable row level security;
alter table public.trips enable row level security;
alter table public.app_settings enable row level security;

-- Remove any earlier test policies that allowed browser roles to access data.
do $$
declare
    policy_record record;
begin
    for policy_record in
        select schemaname, tablename, policyname
        from pg_policies
        where schemaname = 'public'
          and tablename in ('drivers', 'regions', 'vehicles', 'trips', 'app_settings')
    loop
        execute format(
            'drop policy if exists %I on %I.%I',
            policy_record.policyname,
            policy_record.schemaname,
            policy_record.tablename
        );
    end loop;
end
$$;

revoke all on table public.drivers from anon, authenticated;
revoke all on table public.regions from anon, authenticated;
revoke all on table public.vehicles from anon, authenticated;
revoke all on table public.trips from anon, authenticated;
revoke all on table public.app_settings from anon, authenticated;
revoke all on table public.trip_details from anon, authenticated;

-- The server's protected secret role retains its normal Supabase access and
-- bypasses RLS only after the application has verified the signed-in user.
