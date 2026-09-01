-- Add named, colored commission badges while retaining every effective-dated version.
alter table public.commission_tiers add column if not exists badge_name text;
alter table public.commission_tiers add column if not exists badge_color text;

with ranked as (
  select id,row_number() over(partition by commission_scheme_version_id order by minimum_orders) as position
  from public.commission_tiers
)
update public.commission_tiers t
set badge_name=case r.position when 1 then 'Starter' when 2 then 'Silver' when 3 then 'Gold' when 4 then 'Diamond' else 'Badge '||r.position end,
    badge_color=case r.position when 1 then '#c47a32' when 2 then '#aeb4bd' when 3 then '#f4c20d' when 4 then '#67d7ed' else '#94a3b8' end
from ranked r where r.id=t.id and (t.badge_name is null or t.badge_color is null);

alter table public.commission_tiers alter column badge_name set not null;
alter table public.commission_tiers alter column badge_color set not null;
alter table public.commission_tiers add constraint commission_tiers_badge_name_not_blank check (length(trim(badge_name))>=2);
alter table public.commission_tiers add constraint commission_tiers_badge_color_hex check (badge_color ~ '^#[0-9A-Fa-f]{6}$');

alter table public.payroll_items add column if not exists commission_badge_name_snapshot text;
alter table public.payroll_items add column if not exists commission_badge_color_snapshot text;

create or replace function public.generate_payroll(run_start date, run_end date, run_notes text default null)
returns bigint language plpgsql security definer set search_path=public as $$
declare run_id bigint; driver_record record; orders_count integer; version_record record; tier_record record;
begin
    if run_end<run_start then raise exception 'Payroll end date must be on or after start date.'; end if;
    if exists(select 1 from public.payroll_runs where period_start=run_start and period_end=run_end and status<>'voided') then
        raise exception 'A payroll run already exists for this exact period.';
    end if;
    insert into public.payroll_runs(payroll_number,period_start,period_end,notes)
    values(public.next_document_number('PAYROLL','public.payroll_number_seq'),run_start,run_end,run_notes) returning id into run_id;

    insert into public.payroll_items(payroll_run_id,worker_type,employee_id,worker_name_snapshot,position_snapshot,fixed_salary_snapshot)
    select run_id,'employee',e.id,e.name,p.name,s.monthly_salary
    from public.employees e join public.positions p on p.id=e.position_id
    join public.employee_salary_history s on s.employee_id=e.id
      and s.effective_from<=run_end and (s.effective_to is null or s.effective_to>=run_start)
    where e.status='active';

    for driver_record in
      select d.id,d.name,c.monthly_salary,c.commission_scheme_id
      from public.drivers d join public.driver_compensation_history c on c.driver_id=d.id
       and c.effective_from<=run_end and (c.effective_to is null or c.effective_to>=run_start)
      where d.status='active'
    loop
      select coalesce(sum(delivered_orders),0)::integer into orders_count from public.trips
      where driver_id=driver_record.id and trip_date between run_start and run_end and status in ('closed','cash_difference');
      version_record:=null; tier_record:=null;
      if driver_record.commission_scheme_id is not null then
        select v.id,v.version_number,s.name into version_record
        from public.commission_scheme_versions v join public.commission_schemes s on s.id=v.commission_scheme_id
        where v.commission_scheme_id=driver_record.commission_scheme_id and v.effective_from<=run_end
          and (v.effective_to is null or v.effective_to>=run_end) order by v.version_number desc limit 1;
        if version_record.id is not null then
          select minimum_orders,maximum_orders,rate_per_order,badge_name,badge_color into tier_record from public.commission_tiers
          where commission_scheme_version_id=version_record.id and minimum_orders<=orders_count
            and (maximum_orders is null or maximum_orders>=orders_count) limit 1;
        end if;
      end if;
      insert into public.payroll_items(payroll_run_id,worker_type,driver_id,worker_name_snapshot,fixed_salary_snapshot,
        delivered_orders_snapshot,commission_scheme_name_snapshot,commission_version_snapshot,commission_badge_name_snapshot,
        commission_badge_color_snapshot,tier_minimum_snapshot,tier_maximum_snapshot,commission_rate_snapshot,commission_amount_snapshot)
      values(run_id,'driver',driver_record.id,driver_record.name,driver_record.monthly_salary,orders_count,
        version_record.name,version_record.version_number,tier_record.badge_name,tier_record.badge_color,
        tier_record.minimum_orders,tier_record.maximum_orders,coalesce(tier_record.rate_per_order,0),
        round(orders_count*coalesce(tier_record.rate_per_order,0),2));
    end loop;
    return run_id;
end;
$$;

grant execute on function public.generate_payroll(date,date,text) to authenticated;
