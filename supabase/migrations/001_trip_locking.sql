-- Adds a database-enforced lock to trips.
alter table public.trips
    add column if not exists is_locked boolean not null default false,
    add column if not exists locked_at timestamptz;

create or replace function public.guard_locked_trip()
returns trigger
language plpgsql
as $$
begin
    if old.is_locked then
        -- A locked trip may only be unlocked. No trip values can be changed in
        -- the same update that unlocks it.
        if new.is_locked then
            raise exception 'This trip is locked. Unlock it before editing.';
        end if;

        if row(
            new.trip_number,
            new.trip_date,
            new.driver_id,
            new.region_id,
            new.vehicle_id,
            new.distance_km,
            new.assigned_orders,
            new.delivered_orders,
            new.cash_collected,
            new.whish_collected,
            new.credit_amount,
            new.fuel_expense,
            new.other_expense,
            new.expense_note,
            new.cash_handed,
            new.notes
        ) is distinct from row(
            old.trip_number,
            old.trip_date,
            old.driver_id,
            old.region_id,
            old.vehicle_id,
            old.distance_km,
            old.assigned_orders,
            old.delivered_orders,
            old.cash_collected,
            old.whish_collected,
            old.credit_amount,
            old.fuel_expense,
            old.other_expense,
            old.expense_note,
            old.cash_handed,
            old.notes
        ) then
            raise exception 'Unlock the trip before changing its details.';
        end if;

        new.locked_at := null;
        return new;
    end if;

    if new.is_locked then
        new.locked_at := now();
    else
        new.locked_at := null;
    end if;

    return new;
end;
$$;

drop trigger if exists trg_a_trip_lock_guard on public.trips;

-- The "a" in the trigger name makes this guard run before the existing
-- automatic-status trigger on updates.
create trigger trg_a_trip_lock_guard
before update on public.trips
for each row
execute function public.guard_locked_trip();

create index if not exists idx_trips_is_locked
    on public.trips(is_locked);
