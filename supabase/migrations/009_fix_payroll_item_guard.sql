-- Replace the generic payroll guard with a payroll-item-specific trigger.
drop trigger if exists guard_locked_payroll_items on public.payroll_items;
drop function if exists public.guard_locked_payroll();

create or replace function public.guard_locked_payroll_item()
returns trigger language plpgsql as $$
declare target_run_id bigint;
begin
    target_run_id := case when tg_op = 'DELETE'
        then old.payroll_run_id else new.payroll_run_id end;
    if exists (
        select 1 from public.payroll_runs
        where id=target_run_id and status in ('approved','paid')
    ) then
        raise exception 'Approved payroll snapshots are immutable.';
    end if;
    return coalesce(new,old);
end;
$$;

create trigger guard_locked_payroll_items
before update or delete on public.payroll_items
for each row execute function public.guard_locked_payroll_item();

