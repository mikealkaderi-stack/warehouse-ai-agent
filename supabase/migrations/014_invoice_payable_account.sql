-- Store the selected supplier liability account on every invoice.
alter table public.supplier_invoices add column if not exists payable_account_id bigint references public.accounts(id);

update public.supplier_invoices i set payable_account_id=s.payable_account_id
from public.suppliers s where s.id=i.supplier_id and i.payable_account_id is null;

alter table public.supplier_invoices alter column payable_account_id set not null;

drop function if exists public.post_supplier_invoice(bigint,text,date,bigint,numeric,text,text);
create function public.post_supplier_invoice(
    supplier_id bigint, invoice_number text, invoice_date date,
    expense_account_id bigint, payable_account_id bigint, invoice_amount numeric,
    invoice_description text, invoice_reference text default null
) returns bigint language plpgsql security definer set search_path=public as $$
declare invoice_id bigint; journal_id bigint;
begin
    if invoice_amount<=0 then raise exception 'Invoice amount must be greater than zero.'; end if;
    if not exists(select 1 from public.suppliers where id=supplier_id and is_active) then raise exception 'Active supplier not found.'; end if;
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
    return invoice_id;
end;
$$;
grant execute on function public.post_supplier_invoice(bigint,text,date,bigint,bigint,numeric,text,text) to authenticated;
