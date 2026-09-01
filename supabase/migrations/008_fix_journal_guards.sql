-- Split the generic posted-journal guard into table-specific trigger functions.
-- PostgreSQL may resolve record fields before boolean short-circuiting, so a
-- shared OLD/NEW record cannot safely reference columns from both tables.

drop trigger if exists guard_posted_journal_entry on public.journal_entries;
drop trigger if exists guard_posted_journal_lines on public.journal_lines;
drop function if exists public.guard_posted_journal();

create or replace function public.guard_posted_journal_entry()
returns trigger language plpgsql as $$
begin
    if old.status = 'posted' then
        raise exception 'Posted journal entries are immutable; create a reversal instead.';
    end if;
    return coalesce(new, old);
end;
$$;

create or replace function public.guard_posted_journal_line()
returns trigger language plpgsql as $$
declare target_entry_id bigint;
begin
    target_entry_id := case when tg_op = 'DELETE'
        then old.journal_entry_id else new.journal_entry_id end;

    if exists (
        select 1 from public.journal_entries
        where id = target_entry_id and status = 'posted'
    ) then
        raise exception 'Lines of a posted journal entry are immutable.';
    end if;
    return coalesce(new, old);
end;
$$;

create trigger guard_posted_journal_entry
before update or delete on public.journal_entries
for each row execute function public.guard_posted_journal_entry();

create trigger guard_posted_journal_lines
before update or delete on public.journal_lines
for each row execute function public.guard_posted_journal_line();

