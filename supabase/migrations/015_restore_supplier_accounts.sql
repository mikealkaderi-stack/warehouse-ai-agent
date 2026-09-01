-- Restore core supplier masters after a data reset and give each supplier a
-- dedicated expense account with the same business name.
insert into public.accounts (code, name, account_type, normal_balance, is_control_account, is_system, is_active)
values
  ('5011', 'MGT Expense', 'expense', 'debit', false, false, true),
  ('5012', 'Arcome Safety Logistics Expense', 'expense', 'debit', false, false, true)
on conflict (code) do update set name=excluded.name, account_type=excluded.account_type,
  normal_balance=excluded.normal_balance, is_active=true;

insert into public.suppliers (code, name, payable_account_id, default_expense_account_id, is_active)
select 'MGT', 'MGT', p.id, e.id, true from public.accounts p cross join public.accounts e
where p.code='2001' and e.code='5011'
on conflict (code) do update set name=excluded.name, payable_account_id=excluded.payable_account_id,
  default_expense_account_id=excluded.default_expense_account_id, is_active=true, updated_at=now();

insert into public.suppliers (code, name, payable_account_id, default_expense_account_id, is_active)
select 'ARCOME', 'Arcome Safety Logistics', p.id, e.id, true from public.accounts p cross join public.accounts e
where p.code='2002' and e.code='5012'
on conflict (code) do update set name=excluded.name, payable_account_id=excluded.payable_account_id,
  default_expense_account_id=excluded.default_expense_account_id, is_active=true, updated_at=now();
