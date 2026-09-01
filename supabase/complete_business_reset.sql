-- SRT complete business reset.
-- Preserves auth.users, public.app_authorized_users, schema, views, functions,
-- triggers, RLS policies, and migrations. All business data is irreversible.

begin;

truncate table
  public.payroll_items,
  public.payroll_runs,
  public.driver_compensation_history,
  public.commission_tiers,
  public.commission_scheme_versions,
  public.commission_schemes,
  public.employee_salary_history,
  public.employees,
  public.positions,
  public.expense_transactions,
  public.supplier_payments,
  public.supplier_invoices,
  public.suppliers,
  public.journal_lines,
  public.journal_entries,
  public.accounts,
  public.trips,
  public.drivers,
  public.regions,
  public.vehicles,
  public.app_settings
restart identity cascade;

alter sequence public.journal_entry_number_seq restart with 1;
alter sequence public.expense_number_seq restart with 1;
alter sequence public.supplier_payment_number_seq restart with 1;
alter sequence public.payroll_number_seq restart with 1;

commit;

-- Verification: all counts must be zero; authorized_users must remain at least 1.
select
  (select count(*) from public.trips) as trips,
  (select count(*) from public.drivers) as drivers,
  (select count(*) from public.employees) as employees,
  (select count(*) from public.accounts) as accounts,
  (select count(*) from public.journal_entries) as journals,
  (select count(*) from public.app_authorized_users) as authorized_users;
