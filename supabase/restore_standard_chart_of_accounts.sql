-- Restore SRT's required standard Chart of Accounts after a complete reset.
-- This does not create journals, balances, transactions, suppliers, or payroll.

insert into public.accounts
  (code, name, account_type, normal_balance, is_control_account, is_system, is_active)
values
  ('1000', 'Cash',                              'asset',     'debit',  true,  true, true),
  ('1100', 'Trip Receivable',                   'asset',     'debit',  true,  true, true),
  ('2001', 'MGT Payable',                       'liability', 'credit', true,  true, true),
  ('2002', 'Arcome Safety Logistics Payable',   'liability', 'credit', true,  true, true),
  ('2100', 'Payroll Payable',                   'liability', 'credit', true,  true, true),
  ('2110', 'Payroll Deductions Payable',        'liability', 'credit', true,  true, true),
  ('3000', 'Funder Capital / Contributions',    'equity',    'credit', false, true, true),
  ('3100', 'Opening Balance Equity',            'equity',    'credit', false, true, true),
  ('5000', 'Trip Fuel Expense',                 'expense',   'debit',  false, true, true),
  ('5010', 'Supplier Service Expense',          'expense',   'debit',  false, true, true),
  ('5020', 'Salary Expense',                    'expense',   'debit',  false, true, true),
  ('5030', 'Driver Commission Expense',         'expense',   'debit',  false, true, true)
 ,('5040', 'Delivery Expense',                  'expense',   'debit',  false, true, true)
on conflict (code) do update set
  name = excluded.name,
  account_type = excluded.account_type,
  normal_balance = excluded.normal_balance,
  is_control_account = excluded.is_control_account,
  is_system = excluded.is_system,
  is_active = true;

select code, name, account_type, normal_balance
from public.accounts
order by code;
