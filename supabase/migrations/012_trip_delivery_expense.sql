-- Add trip delivery expenses and their dedicated accounting posting.
alter table public.trips add column if not exists delivery_expense numeric(14,2) not null default 0 check (delivery_expense>=0);

insert into public.accounts(code,name,account_type,normal_balance,is_control_account,is_system,is_active)
values('5040','Delivery Expense','expense','debit',false,true,true)
on conflict(code) do update set name=excluded.name,account_type='expense',normal_balance='debit',is_active=true;

create or replace function public.post_trip_delivery(target_trip_id uuid)
returns bigint language plpgsql security definer set search_path=public as $$
declare trip_record record; journal_id bigint; expense_id bigint; delivery_id bigint; receivable_id bigint; expense_number text;
begin
    select id,trip_number,trip_date,delivery_expense,status into trip_record from public.trips where id=target_trip_id;
    if trip_record.id is null then raise exception 'Trip not found.'; end if;
    if trip_record.status not in ('closed','cash_difference') then raise exception 'Complete the trip before posting delivery expense.'; end if;
    if coalesce(trip_record.delivery_expense,0)<=0 then raise exception 'Trip has no delivery expense to post.'; end if;
    if exists(select 1 from public.expense_transactions where source_type='trip_delivery' and source_id=target_trip_id::text and status<>'voided') then raise exception 'Delivery expense for this trip has already been posted.'; end if;
    select id into delivery_id from public.accounts where code='5040';
    select id into receivable_id from public.accounts where code='1100';
    if delivery_id is null or receivable_id is null then raise exception 'Required Delivery Expense or Trip Receivable account is missing.'; end if;
    expense_number:=public.next_document_number('EXP','public.expense_number_seq');
    insert into public.journal_entries(entry_number,entry_date,description,reference,source_type,source_id)
    values(public.next_document_number('JE','public.journal_entry_number_seq'),trip_record.trip_date,'Delivery expense — '||trip_record.trip_number,trip_record.trip_number,'trip_delivery',target_trip_id::text)
    returning id into journal_id;
    insert into public.journal_lines(journal_entry_id,line_number,account_id,description,debit,credit) values
      (journal_id,1,delivery_id,'Trip delivery expense',trip_record.delivery_expense,0),
      (journal_id,2,receivable_id,'Delivery expense deducted from driver cash held',0,trip_record.delivery_expense);
    perform public.post_journal(journal_id);
    insert into public.expense_transactions(expense_number,expense_date,expense_account_id,paid_from_account_id,amount,description,reference,source_type,source_id,status,journal_entry_id)
    values(expense_number,trip_record.trip_date,delivery_id,receivable_id,trip_record.delivery_expense,'Delivery expense — '||trip_record.trip_number,trip_record.trip_number,'trip_delivery',target_trip_id::text,'posted',journal_id)
    returning id into expense_id;
    return expense_id;
end;
$$;

grant execute on function public.post_trip_delivery(uuid) to authenticated;
