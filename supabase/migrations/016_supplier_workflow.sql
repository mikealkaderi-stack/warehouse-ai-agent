-- Make supplier invoices visible in expense reporting while preserving the
-- single accounting journal created by the invoice posting.
alter table public.supplier_invoices add column if not exists payable_account_id bigint references public.accounts(id);

update public.supplier_invoices i set payable_account_id=s.payable_account_id
from public.suppliers s where s.id=i.supplier_id and i.payable_account_id is null;

alter table public.supplier_invoices alter column payable_account_id set not null;

create or replace function public.post_supplier_invoice(
    supplier_id bigint, invoice_number text, invoice_date date,
    expense_account_id bigint, payable_account_id bigint, invoice_amount numeric,
    invoice_description text, invoice_reference text default null
) returns bigint language plpgsql security definer set search_path=public as $$
declare invoice_id bigint; journal_id bigint; expense_number text; supplier_record record;
begin
    if invoice_amount<=0 then raise exception 'Invoice amount must be greater than zero.'; end if;
    select * into supplier_record from public.suppliers where id=supplier_id and is_active;
    if supplier_record.id is null then raise exception 'Active supplier not found.'; end if;
    if payable_account_id<>supplier_record.payable_account_id then raise exception 'The payable account must match the selected supplier.'; end if;
    if not exists(select 1 from public.accounts where id=expense_account_id and account_type='expense' and is_active) then raise exception 'Select an active expense account.'; end if;
    if not exists(select 1 from public.accounts where id=payable_account_id and account_type='liability' and is_active) then raise exception 'Select an active supplier liability account.'; end if;
    insert into public.journal_entries(entry_number,entry_date,description,reference,source_type,source_id)
    values(public.next_document_number('JE','public.journal_entry_number_seq'),invoice_date,invoice_description,invoice_reference,'supplier_invoice',supplier_id||':'||invoice_number)
    returning id into journal_id;
    insert into public.journal_lines(journal_entry_id,line_number,account_id,description,debit,credit) values
      (journal_id,1,expense_account_id,invoice_description,invoice_amount,0),
      (journal_id,2,payable_account_id,invoice_description,0,invoice_amount);
    perform public.post_journal(journal_id);
    insert into public.supplier_invoices(invoice_number,supplier_id,invoice_date,expense_account_id,payable_account_id,amount,description,reference,status,journal_entry_id)
    values(invoice_number,supplier_id,invoice_date,expense_account_id,payable_account_id,invoice_amount,invoice_description,invoice_reference,'posted',journal_id)
    returning id into invoice_id;
    expense_number:=public.next_document_number('EXP','public.expense_number_seq');
    insert into public.expense_transactions(expense_number,expense_date,expense_account_id,paid_from_account_id,amount,description,reference,source_type,source_id,status,journal_entry_id)
    values(expense_number,invoice_date,expense_account_id,payable_account_id,invoice_amount,invoice_description,invoice_reference,'supplier_invoice',invoice_id::text,'posted',journal_id);
    return invoice_id;
end;
$$;

grant execute on function public.post_supplier_invoice(bigint,text,date,bigint,bigint,numeric,text,text) to authenticated;

-- Add expense-report records for invoices posted before this migration. These
-- rows reuse the original journal and do not post any additional accounting.
do $$ declare inv record; expense_number text;
begin
  for inv in select * from public.supplier_invoices i where i.status='posted' and i.journal_entry_id is not null
    and not exists(select 1 from public.expense_transactions e where e.source_type='supplier_invoice' and e.source_id=i.id::text)
  loop
    expense_number:=public.next_document_number('EXP','public.expense_number_seq');
    insert into public.expense_transactions(expense_number,expense_date,expense_account_id,paid_from_account_id,amount,description,reference,source_type,source_id,status,journal_entry_id)
    values(expense_number,inv.invoice_date,inv.expense_account_id,inv.payable_account_id,inv.amount,inv.description,inv.reference,'supplier_invoice',inv.id::text,'posted',inv.journal_entry_id);
  end loop;
end $$;
