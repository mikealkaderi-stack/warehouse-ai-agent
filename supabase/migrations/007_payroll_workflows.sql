-- Transaction workflows built on migration 006.

insert into public.accounts(code,name,account_type,normal_balance,is_control_account,is_system)
values ('2110','Payroll Deductions Payable','liability','credit',true,true)
on conflict(code) do nothing;

drop trigger if exists guard_locked_payroll_run on public.payroll_runs;
create or replace function public.guard_locked_payroll_run()
returns trigger language plpgsql as $$
begin
    if tg_op='DELETE' and old.status in ('approved','paid') then
        raise exception 'Approved or paid payroll is immutable.';
    end if;
    if tg_op='UPDATE' and old.status='paid' then
        raise exception 'Paid payroll is immutable.';
    end if;
    if tg_op='UPDATE' and old.status='approved' and (
       new.status<>'paid' or
       row(new.payroll_number,new.period_start,new.period_end,new.notes,new.approved_at,new.approved_by,new.approval_journal_entry_id,new.created_at)
       is distinct from
       row(old.payroll_number,old.period_start,old.period_end,old.notes,old.approved_at,old.approved_by,old.approval_journal_entry_id,old.created_at)
    ) then raise exception 'Approved payroll can only be marked paid.'; end if;
    return coalesce(new,old);
end;
$$;
create trigger guard_locked_payroll_run before update or delete on public.payroll_runs
for each row execute function public.guard_locked_payroll_run();

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
          select minimum_orders,maximum_orders,rate_per_order into tier_record from public.commission_tiers
          where commission_scheme_version_id=version_record.id and minimum_orders<=orders_count
            and (maximum_orders is null or maximum_orders>=orders_count) limit 1;
        end if;
      end if;
      insert into public.payroll_items(payroll_run_id,worker_type,driver_id,worker_name_snapshot,fixed_salary_snapshot,
        delivered_orders_snapshot,commission_scheme_name_snapshot,commission_version_snapshot,tier_minimum_snapshot,
        tier_maximum_snapshot,commission_rate_snapshot,commission_amount_snapshot)
      values(run_id,'driver',driver_record.id,driver_record.name,driver_record.monthly_salary,orders_count,
        version_record.name,version_record.version_number,tier_record.minimum_orders,tier_record.maximum_orders,
        coalesce(tier_record.rate_per_order,0),round(orders_count*coalesce(tier_record.rate_per_order,0),2));
    end loop;
    return run_id;
end;
$$;

create or replace function public.approve_payroll(run_id bigint)
returns bigint language plpgsql security definer set search_path=public as $$
declare journal_id bigint; salary_total numeric; commission_total numeric; deductions_total numeric; payable_total numeric;
declare salary_id bigint; commission_id bigint; payable_id bigint; deductions_id bigint; run_date date;
begin
    perform 1 from public.payroll_runs where id=run_id and status='draft' for update;
    if not found then raise exception 'Only draft payroll can be approved.'; end if;
    if not exists(select 1 from public.payroll_items where payroll_run_id=run_id) then raise exception 'Payroll has no items.'; end if;
    select coalesce(sum(fixed_salary_snapshot+additions),0),coalesce(sum(commission_amount_snapshot),0),coalesce(sum(deductions),0),coalesce(sum(net_pay),0)
      into salary_total,commission_total,deductions_total,payable_total from public.payroll_items where payroll_run_id=run_id;
    select period_end into run_date from public.payroll_runs where id=run_id;
    select id into salary_id from public.accounts where code='5020'; select id into commission_id from public.accounts where code='5030';
    select id into payable_id from public.accounts where code='2100'; select id into deductions_id from public.accounts where code='2110';
    insert into public.journal_entries(entry_number,entry_date,description,source_type,source_id)
    values(public.next_document_number('JE','public.journal_entry_number_seq'),run_date,'Payroll approval','payroll_approval',run_id::text) returning id into journal_id;
    if salary_total>0 then insert into public.journal_lines values(default,journal_id,1,salary_id,'Fixed salaries and additions',salary_total,0,default); end if;
    if commission_total>0 then insert into public.journal_lines values(default,journal_id,2,commission_id,'Driver commissions',commission_total,0,default); end if;
    if deductions_total>0 then insert into public.journal_lines values(default,journal_id,3,deductions_id,'Payroll deductions',0,deductions_total,default); end if;
    insert into public.journal_lines values(default,journal_id,4,payable_id,'Net payroll payable',0,payable_total,default);
    perform public.post_journal(journal_id);
    update public.payroll_runs set status='approved',approved_at=now(),approved_by=auth.uid(),approval_journal_entry_id=journal_id,updated_at=now() where id=run_id;
    return journal_id;
end;
$$;

create or replace function public.pay_payroll(run_id bigint, paid_on date)
returns bigint language plpgsql security definer set search_path=public as $$
declare journal_id bigint; total numeric; payable_id bigint; cash_id bigint;
begin
    perform 1 from public.payroll_runs where id=run_id and status='approved' for update;
    if not found then raise exception 'Only approved payroll can be paid.'; end if;
    select coalesce(sum(net_pay),0) into total from public.payroll_items where payroll_run_id=run_id;
    select id into payable_id from public.accounts where code='2100'; select id into cash_id from public.accounts where code='1000';
    insert into public.journal_entries(entry_number,entry_date,description,source_type,source_id)
    values(public.next_document_number('JE','public.journal_entry_number_seq'),paid_on,'Payroll payment','payroll_payment',run_id::text) returning id into journal_id;
    insert into public.journal_lines values(default,journal_id,1,payable_id,'Payroll payable settled',total,0,default);
    insert into public.journal_lines values(default,journal_id,2,cash_id,'Payroll paid from cash',0,total,default);
    perform public.post_journal(journal_id);
    update public.payroll_runs set status='paid',payment_date=paid_on,paid_at=now(),paid_by=auth.uid(),payment_journal_entry_id=journal_id,updated_at=now() where id=run_id;
    return journal_id;
end;
$$;

grant execute on function public.generate_payroll(date,date,text) to authenticated;
grant execute on function public.approve_payroll(bigint) to authenticated;
grant execute on function public.pay_payroll(bigint,date) to authenticated;

