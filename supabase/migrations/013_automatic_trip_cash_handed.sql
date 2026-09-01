-- Enforce the trip cash formula at database level as well as in the app.
create or replace function public.calculate_trip_cash_handed()
returns trigger language plpgsql as $$
begin
  new.cash_handed := round(
    coalesce(new.cash_collected,0)
    - coalesce(new.fuel_expense,0)
    - coalesce(new.delivery_expense,0)
    - coalesce(new.other_expense,0),
    2
  );
  if new.cash_handed < 0 then
    raise exception 'Trip expenses cannot be greater than cash collected.';
  end if;
  return new;
end;
$$;

drop trigger if exists a_calculate_trip_cash_handed on public.trips;
create trigger a_calculate_trip_cash_handed
before insert or update of cash_collected,fuel_expense,delivery_expense,other_expense
on public.trips for each row execute function public.calculate_trip_cash_handed();
