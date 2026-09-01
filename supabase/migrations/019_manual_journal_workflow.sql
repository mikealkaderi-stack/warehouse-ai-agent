-- Draft manual journals may be edited/deleted. Posted manual journals are
-- corrected with a linked reversal that swaps every debit and credit.
create or replace function public.reverse_manual_journal(target_entry_id bigint, reversal_date date)
returns bigint language plpgsql security definer set search_path=public as $$
declare original record; reversal_id bigint; source_line record; next_line integer:=0;
begin
  select * into original from public.journal_entries where id=target_entry_id;
  if original.id is null then raise exception 'Journal not found.'; end if;
  if original.source_type<>'manual' then raise exception 'Only a manual journal can be reversed here.'; end if;
  if original.status<>'posted' then raise exception 'Only a posted journal can be reversed.'; end if;
  if exists(select 1 from public.journal_entries where reversal_of_id=target_entry_id) then raise exception 'This journal has already been reversed.'; end if;
  insert into public.journal_entries(entry_number,entry_date,description,reference,source_type,source_id,reversal_of_id)
  values(public.next_document_number('JE','public.journal_entry_number_seq'),reversal_date,'Reversal of '||original.entry_number,original.reference,'manual_reversal',target_entry_id::text,target_entry_id)
  returning id into reversal_id;
  for source_line in select * from public.journal_lines where journal_entry_id=target_entry_id order by line_number loop
    next_line:=next_line+1;
    insert into public.journal_lines(journal_entry_id,line_number,account_id,description,debit,credit)
    values(reversal_id,next_line,source_line.account_id,'Reversal — '||coalesce(source_line.description,original.description),source_line.credit,source_line.debit);
  end loop;
  perform public.post_journal(reversal_id);
  return reversal_id;
end;
$$;

grant execute on function public.reverse_manual_journal(bigint,date) to authenticated;
