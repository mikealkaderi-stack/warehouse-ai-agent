import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export const backupTables = [
  "drivers",
  "regions",
  "vehicles",
  "trips",
  "app_settings",
  "accounts",
  "journal_entries",
  "journal_lines",
  "suppliers",
  "supplier_invoices",
  "supplier_payments",
  "expense_transactions",
  "positions",
  "employees",
  "employee_salary_history",
  "commission_schemes",
  "commission_scheme_versions",
  "commission_tiers",
  "driver_compensation_history",
  "payroll_runs",
  "payroll_items",
] as const;

export type BackupTable = (typeof backupTables)[number];

export const csvColumns: Record<BackupTable, readonly string[]> = {
  drivers: [
    "id", "name", "phone", "address", "id_number", "start_date",
    "emergency_contact_name", "emergency_contact_phone", "notes", "status",
    "created_at", "updated_at",
  ],
  regions: ["id", "name", "status", "created_at", "updated_at"],
  vehicles: [
    "id", "vehicle_name", "plate_number", "vehicle_type", "make", "model",
    "year", "color", "registration_expiry", "insurance_expiry", "inspection_date",
    "notes", "status", "created_at", "updated_at",
  ],
  trips: [
    "id", "trip_number", "trip_date", "driver_id", "region_id", "vehicle_id",
    "distance_km", "assigned_orders", "delivered_orders", "cash_collected",
    "whish_collected", "credit_amount", "fuel_expense", "delivery_expense", "other_expense",
    "expense_note", "cash_handed", "notes", "status", "is_locked", "locked_at",
    "closed_at", "created_at", "updated_at",
  ],
  app_settings: [
    "id", "company_name", "company_address", "company_phone", "company_email",
    "currency_code", "timezone", "default_report_range", "trip_number_prefix",
    "report_footer", "updated_at",
  ],
  accounts: ["id","code","name","account_type","normal_balance","parent_id","is_control_account","is_system","is_active","created_at","updated_at"],
  journal_entries: ["id","entry_number","entry_date","description","reference","source_type","source_id","status","posted_at","posted_by","reversal_of_id","created_at","updated_at"],
  journal_lines: ["id","journal_entry_id","line_number","account_id","description","debit","credit","created_at"],
  suppliers: ["id","code","name","payable_account_id","default_expense_account_id","phone","email","notes","is_active","created_at","updated_at"],
  supplier_invoices: ["id","invoice_number","supplier_id","invoice_date","due_date","expense_account_id","payable_account_id","amount","description","reference","status","journal_entry_id","created_at","updated_at"],
  supplier_payments: ["id","payment_number","supplier_id","payment_date","cash_account_id","amount","payment_method","reference","notes","status","journal_entry_id","created_at","updated_at"],
  expense_transactions: ["id","expense_number","expense_date","expense_account_id","paid_from_account_id","amount","description","reference","source_type","source_id","status","journal_entry_id","created_at","updated_at"],
  positions: ["id","name","description","is_active","created_at"],
  employees: ["id","employee_number","name","position_id","phone","address","emergency_contact_name","emergency_contact_phone","id_number","start_date","end_date","notes","status","created_at","updated_at"],
  employee_salary_history: ["id","employee_id","monthly_salary","effective_from","effective_to","reason","created_at"],
  commission_schemes: ["id","name","description","calculation_method","is_active","created_at"],
  commission_scheme_versions: ["id","commission_scheme_id","version_number","effective_from","effective_to","notes","created_at"],
  commission_tiers: ["id","commission_scheme_version_id","badge_name","badge_color","minimum_orders","maximum_orders","rate_per_order","created_at"],
  driver_compensation_history: ["id","driver_id","monthly_salary","commission_scheme_id","effective_from","effective_to","reason","created_at"],
  payroll_runs: ["id","payroll_number","period_start","period_end","payment_date","status","notes","approved_at","approved_by","paid_at","paid_by","approval_journal_entry_id","payment_journal_entry_id","created_at","updated_at"],
  payroll_items: ["id","payroll_run_id","worker_type","employee_id","driver_id","worker_name_snapshot","position_snapshot","fixed_salary_snapshot","delivered_orders_snapshot","commission_scheme_name_snapshot","commission_version_snapshot","commission_badge_name_snapshot","commission_badge_color_snapshot","tier_minimum_snapshot","tier_maximum_snapshot","commission_rate_snapshot","commission_amount_snapshot","deductions","additions","gross_pay","net_pay","notes","created_at"],
};

export function isBackupTable(value: string | null): value is BackupTable {
  return backupTables.includes(value as BackupTable);
}

export async function readAllRows(table: BackupTable) {
  const supabase = await createAdminClient();
  const pageSize = 1000;
  const rows: Record<string, unknown>[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`Could not export ${table}: ${error.message}`);

    const page = (data ?? []) as Record<string, unknown>[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  return rows;
}

export function toCsv(rows: Record<string, unknown>[], columns: readonly string[]) {
  const header = columns.map(csvCell).join(",");
  const body = rows.map((row) => columns.map((column) => csvCell(row[column])).join(","));
  return `\uFEFF${[header, ...body].join("\r\n")}`;
}

function csvCell(value: unknown) {
  if (value === null || value === undefined) return "";

  let cellText = typeof value === "string" ? value : String(value);
  // Prevent spreadsheet programs from treating text fields as formulas.
  if (/^[=+@-]/.test(cellText) && typeof value === "string") cellText = `'${cellText}`;
  return `"${cellText.replaceAll('"', '""')}"`;
}
