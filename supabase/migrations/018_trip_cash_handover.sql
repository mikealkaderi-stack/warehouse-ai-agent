-- Post cash physically handed in by a driver after a completed trip.
-- The source pair is unique, so the same trip cannot increase Cash twice.
create or replace function public.post_trip_cash_handover(target_trip_id uuid)
returns bigint language plpgsql security definer set search_path=public as $$
declare trip_record record; journal_id bigint; cash_id bigint; receivable_id bigint;
begin
    select id,trip_number,trip_date,cash_handed,status into trip_record from public.trips where id=target_trip_id;
    if trip_record.id is null then raise exception 'Trip not found.'; end if;
    if trip_record.status not in ('closed','cash_difference') then raise exception 'Complete the trip before posting its cash handover.'; end if;
    if coalesce(trip_record.cash_handed,0)<=0 then raise exception 'This trip has no cash handed to post.'; end if;
    if exists(select 1 from public.journal_entries where source_type='trip_cash_handover' and source_id=target_trip_id::text) then raise exception 'Cash handed for this trip has already been posted.'; end if;
    select id into cash_id from public.accounts where code='1000' and is_active;
    select id into receivable_id from public.accounts where code='1100' and is_active;
    if cash_id is null or receivable_id is null then raise exception 'Required Cash or Trip Receivable account is missing.'; end if;
    insert into public.journal_entries(entry_number,entry_date,description,reference,source_type,source_id)
    values(public.next_document_number('JE','public.journal_entry_number_seq'),trip_record.trip_date,'Trip cash handover — '||trip_record.trip_number,trip_record.trip_number,'trip_cash_handover',target_trip_id::text)
    returning id into journal_id;
    insert into public.journal_lines(journal_entry_id,line_number,account_id,description,debit,credit) values
      (journal_id,1,cash_id,'Cash received from driver',trip_record.cash_handed,0),
      (journal_id,2,receivable_id,'Driver cash handed in',0,trip_record.cash_handed);
    perform public.post_journal(journal_id);
    return journal_id;
end;
$$;

grant execute on function public.post_trip_cash_handover(uuid) to authenticated;
