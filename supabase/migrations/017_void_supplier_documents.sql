-- Posted accounting documents are voided through reversing journals. Drafts
-- may be permanently deleted because they have no accounting effect.
create or replace function public.void_supplier_invoice(target_invoice_id bigint, void_date date default current_date)
returns bigint language plpgsql security definer set search_path=public as $$
declare doc record; reversal_id bigint; line record; line_no integer:=0;
begin
  if not public.is_srt_authorized() then raise exception 'Not authorized.' using errcode='42501'; end if;
  select * into doc from public.supplier_invoices where id=target_invoice_id for update;
  if doc.id is null then raise exception 'Invoice not found.'; end if;
  if doc.status='draft' then update public.supplier_invoices set status='voided',updated_at=now() where id=doc.id; return null; end if;
  if doc.status='voided' then raise exception 'Invoice is already voided.'; end if;
  insert into public.journal_entries(entry_number,entry_date,description,reference,source_type,source_id)
  values(public.next_document_number('JE','public.journal_entry_number_seq'),void_date,'Reversal of supplier invoice '||doc.invoice_number,doc.reference,'supplier_invoice_reversal',doc.id::text)
  returning id into reversal_id;
  for line in select * from public.journal_lines where journal_entry_id=doc.journal_entry_id order by line_number loop
    line_no:=line_no+1;
    insert into public.journal_lines(journal_entry_id,line_number,account_id,description,debit,credit)
    values(reversal_id,line_no,line.account_id,'Reversal — '||coalesce(line.description,doc.description),line.credit,line.debit);
  end loop;
  perform public.post_journal(reversal_id);
  update public.supplier_invoices set status='voided',updated_at=now() where id=doc.id;
  update public.expense_transactions set status='voided',updated_at=now() where source_type='supplier_invoice' and source_id=doc.id::text;
  return reversal_id;
end; $$;

create or replace function public.void_supplier_payment(target_payment_id bigint, void_date date default current_date)
returns bigint language plpgsql security definer set search_path=public as $$
declare doc record; reversal_id bigint; line record; line_no integer:=0;
begin
  if not public.is_srt_authorized() then raise exception 'Not authorized.' using errcode='42501'; end if;
  select * into doc from public.supplier_payments where id=target_payment_id for update;
  if doc.id is null then raise exception 'Payment not found.'; end if;
  if doc.status='draft' then update public.supplier_payments set status='voided',updated_at=now() where id=doc.id; return null; end if;
  if doc.status='voided' then raise exception 'Payment is already voided.'; end if;
  insert into public.journal_entries(entry_number,entry_date,description,reference,source_type,source_id)
  values(public.next_document_number('JE','public.journal_entry_number_seq'),void_date,'Reversal of supplier payment '||doc.payment_number,doc.reference,'supplier_payment_reversal',doc.id::text)
  returning id into reversal_id;
  for line in select * from public.journal_lines where journal_entry_id=doc.journal_entry_id order by line_number loop
    line_no:=line_no+1;
    insert into public.journal_lines(journal_entry_id,line_number,account_id,description,debit,credit)
    values(reversal_id,line_no,line.account_id,'Reversal — '||coalesce(line.description,'Supplier payment'),line.credit,line.debit);
  end loop;
  perform public.post_journal(reversal_id);
  update public.supplier_payments set status='voided',updated_at=now() where id=doc.id;
  return reversal_id;
end; $$;

revoke all on function public.void_supplier_invoice(bigint,date) from public;
revoke all on function public.void_supplier_payment(bigint,date) from public;
grant execute on function public.void_supplier_invoice(bigint,date) to authenticated;
grant execute on function public.void_supplier_payment(bigint,date) to authenticated;
