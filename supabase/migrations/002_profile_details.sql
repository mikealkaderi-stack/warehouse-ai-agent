-- Optional driver profile information.
alter table public.drivers
    add column if not exists address text,
    add column if not exists emergency_contact_name text,
    add column if not exists emergency_contact_phone text,
    add column if not exists id_number text,
    add column if not exists start_date date,
    add column if not exists notes text;

-- Optional vehicle administration and document information.
alter table public.vehicles
    add column if not exists color text,
    add column if not exists registration_expiry date,
    add column if not exists insurance_expiry date,
    add column if not exists inspection_date date,
    add column if not exists notes text;

-- Prevent duplicate non-empty driver identification numbers while allowing
-- drivers whose ID number has not yet been recorded.
create unique index if not exists idx_drivers_id_number_unique
    on public.drivers(id_number)
    where id_number is not null and btrim(id_number) <> '';

create index if not exists idx_vehicles_registration_expiry
    on public.vehicles(registration_expiry)
    where registration_expiry is not null;

create index if not exists idx_vehicles_insurance_expiry
    on public.vehicles(insurance_expiry)
    where insurance_expiry is not null;
