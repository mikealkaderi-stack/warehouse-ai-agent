-- One protected settings record for the SRT Driver Control application.
create table if not exists public.app_settings (
    id smallint primary key default 1
        check (id = 1),
    company_name text not null default 'SRT Logistics',
    company_address text,
    company_phone text,
    company_email text,
    currency_code text not null default 'USD'
        check (currency_code in ('USD', 'LBP', 'EUR')),
    timezone text not null default 'Asia/Beirut',
    default_report_range text not null default 'this_month'
        check (default_report_range in ('today', 'last_7_days', 'this_month')),
    trip_number_prefix text not null default 'TRIP',
    report_footer text,
    updated_at timestamptz not null default now()
);

insert into public.app_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.app_settings enable row level security;

-- The local Next.js server uses the protected server key. No anonymous policy
-- is created, so settings cannot be changed with the public application key.
