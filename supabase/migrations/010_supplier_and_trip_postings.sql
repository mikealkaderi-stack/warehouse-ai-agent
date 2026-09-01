-- Atomic operational postings for suppliers and trip fuel.

create or replace function public.post_supplier_invoice(
    supplier_id bigint,
    invoice_number text,
    invoice_date date,
    expense_account_id bigint,
    invoice_amount numeric,
    invoice_description text,
    invoice_reference text default null
) returns bigint language plpgsql security definer set search_path=public as $$
declare invoice_id bigint; journal_id bigint; payable_id bigint;
begin
    if invoice_amount<=0 then raise exception 'Invoice amount must be greater than zero.'; end if;
    select payable_account_id into payable_id from public.suppliers where id=supplier_id and is_active;
    if payable_id is null then raise exception 'Active supplier not found.'; end if;
    if not exists(select 1 from public.accounts where id=expense_account_id and account_type='expense' and is_active) then
        raise exception 'Select an active expense account.';
    end if;
    insert into public.journal_entries(entry_number,entry_date,description,reference,source_type,source_id)
    values(public.next_document_number('JE','public.journal_entry_number_seq'),invoice_date,invoice_description,invoice_reference,'supplier_invoice',supplier_id||':'||invoice_number)
    returning id into journal_id;
    insert into public.journal_lines(journal_entry_id,line_number,account_id,description,debit,credit) values
      (journal_id,1,expense_account_id,invoice_description,invoice_amount,0),
      (journal_id,2,payable_id,invoice_description,0,invoice_amount);
    perform public.post_journal(journal_id);
    insert into public.supplier_invoices(invoice_number,supplier_id,invoice_date,expense_account_id,amount,description,reference,status,journal_entry_id)
    values(invoice_number,supplier_id,invoice_date,expense_account_id,invoice_amount,invoice_description,invoice_reference,'posted',journal_id)
    returning id into invoice_id;
    return invoice_id;
end;
$$;

create or replace function public.post_supplier_payment(
    supplier_id bigint,
    payment_date date,
    cash_account_id bigint,
    payment_amount numeric,
    payment_method text default 'cash',
    payment_reference text default null,
    payment_notes text default null
) returns bigint language plpgsql security definer set search_path=public as $$
declare payment_id bigint; journal_id bigint; payable_id bigint; payment_number text;
begin
    if payment_amount<=0 then raise exception 'Payment amount must be greater than zero.'; end if;
    select payable_account_id into payable_id from public.suppliers where id=supplier_id and is_active;
    if payable_id is null then raise exception 'Active supplier not found.'; end if;
    if not exists(select 1 from public.accounts where id=cash_account_id and account_type='asset' and is_active) then
        raise exception 'Select an active cash or asset account.';
    end if;
    payment_number:=public.next_document_number('SPAY','public.supplier_payment_number_seq');
    insert into public.journal_entries(entry_number,entry_date,description,reference,source_type,source_id)
    values(public.next_document_number('JE','public.journal_entry_number_seq'),payment_date,'Supplier payment '||payment_number,payment_reference,'supplier_payment',payment_number)
    returning id into journal_id;
    insert into public.journal_lines(journal_entry_id,line_number,account_id,description,debit,credit) values
      (journal_id,1,payable_id,'Supplier payable reduced',payment_amount,0),
      (journal_id,2,cash_account_id,'Supplier payment',0,payment_amount);
    perform public.post_journal(journal_id);
    insert into public.supplier_payments(payment_number,supplier_id,payment_date,cash_account_id,amount,payment_method,reference,notes,status,journal_entry_id)
    values(payment_number,supplier_id,payment_date,cash_account_id,payment_amount,payment_method,payment_reference,payment_notes,'posted',journal_id)
    returning id into payment_id;
    return payment_id;
end;
$$;

create or replace function public.post_trip_fuel(target_trip_id uuid)
returns bigint language plpgsql security definer set search_path=public as $$
declare trip_record record; journal_id bigint; expense_id bigint; fuel_id bigint; receivable_id bigint; expense_number text;
begin
    select id,trip_number,trip_date,fuel_expense,status into trip_record
    from public.trips where id=target_trip_id;
    if trip_record.id is null then raise exception 'Trip not found.'; end if;
    if trip_record.status not in ('closed','cash_difference') then raise exception 'Complete the trip before posting fuel.'; end if;
    if coalesce(trip_record.fuel_expense,0)<=0 then raise exception 'Trip has no fuel expense to post.'; end if;
    if exists(select 1 from public.expense_transactions where source_type='trip_fuel' and source_id=target_trip_id::text and status<>'voided') then
        raise exception 'Fuel expense for this trip has already been posted.';
    end if;
    select id into fuel_id from public.accounts where code='5000';
    select id into receivable_id from public.accounts where code='1100';
    expense_number:=public.next_document_number('EXP','public.expense_number_seq');
    insert into public.journal_entries(entry_number,entry_date,description,reference,source_type,source_id)
    values(public.next_document_number('JE','public.journal_entry_number_seq'),trip_record.trip_date,'Fuel expense — '||trip_record.trip_number,trip_record.trip_number,'trip_fuel',target_trip_id::text)
    returning id into journal_id;
    insert into public.journal_lines(journal_entry_id,line_number,account_id,description,debit,credit) values
      (journal_id,1,fuel_id,'Trip fuel expense',trip_record.fuel_expense,0),
      (journal_id,2,receivable_id,'Fuel deducted from driver cash held',0,trip_record.fuel_expense);
    perform public.post_journal(journal_id);
    insert into public.expense_transactions(expense_number,expense_date,expense_account_id,paid_from_account_id,amount,description,reference,source_type,source_id,status,journal_entry_id)
    values(expense_number,trip_record.trip_date,fuel_id,receivable_id,trip_record.fuel_expense,'Fuel expense — '||trip_record.trip_number,trip_record.trip_number,'trip_fuel',target_trip_id::text,'posted',journal_id)
    returning id into expense_id;
    return expense_id;
end;
$$;

grant execute on function public.post_supplier_invoice(bigint,text,date,bigint,numeric,text,text) to authenticated;
grant execute on function public.post_supplier_payment(bigint,date,bigint,numeric,text,text,text) to authenticated;
grant execute on function public.post_trip_fuel(uuid) to authenticated;

