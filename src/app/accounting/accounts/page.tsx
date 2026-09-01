import { PageTabs } from "@/components/page-tabs";
import { ConfigurableList, type ListColumn } from "@/components/configurable-list";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, getAppSettings } from "@/lib/settings";
import { AccountForm } from "../accounting-forms";
export const dynamic = "force-dynamic";

const types = ["asset", "liability", "equity", "revenue", "expense", "supplier"] as const;
const columns: ListColumn[] = [
  { key: "code", label: "Code" }, { key: "name", label: "Account" },
  { key: "type", label: "Type" }, { key: "normal", label: "Normal balance" },
  { key: "debit", label: "Debit", align: "right" }, { key: "credit", label: "Credit", align: "right" },
  { key: "balance", label: "Balance", align: "right" }
];
const label = (type: string) => type === "supplier" ? "Supplier Accounts" : type[0].toUpperCase() + type.slice(1);

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const p = await searchParams, current = types.includes(p.type as typeof types[number]) ? p.type! : "asset", s = await createAdminClient(), settings = await getAppSettings();
  const [balances, suppliers] = await Promise.all([
    s.from("account_balances").select("*").order("code"),
    s.from("suppliers").select("payable_account_id,default_expense_account_id").eq("is_active", true)
  ]);
  const supplierIds = new Set((suppliers.data ?? []).flatMap(row => [String(row.payable_account_id), String(row.default_expense_account_id)]));
  const data = (balances.data ?? []).filter(row => current === "supplier" ? supplierIds.has(String(row.id)) : row.account_type === current);
  const total = data.reduce((sum, row) => sum + Number(row.balance), 0);
  const rows = data.map(row => ({ id: row.id, cells: {
    code: <span className="font-semibold text-emerald-300">{row.code}</span>, name: row.name,
    type: <span className="capitalize">{row.account_type}</span>, normal: <span className="capitalize">{row.normal_balance}</span>,
    debit: formatCurrency(Number(row.total_debit), settings.currency_code), credit: formatCurrency(Number(row.total_credit), settings.currency_code),
    balance: <strong>{formatCurrency(Number(row.balance), settings.currency_code)}</strong>
  }}));
  const error = balances.error || suppliers.error;
  return <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100"><div className="mx-auto max-w-7xl">
    <p className="eyebrow">ACCOUNTING</p><h1 className="page-title">Chart of Accounts</h1><p className="page-lead">Browse account types and review supplier-linked payable and expense accounts.</p>
    <div className="mt-8"><PageTabs current={current} items={types.map(type => ({ key: type, label: label(type), href: `/accounting/accounts?type=${type}` }))} /></div>
    <section className="surface-card mt-6"><div className="mb-6"><p className="text-sm text-slate-400">{label(current)} balance</p><p className="mt-2 text-3xl font-bold text-emerald-300">{formatCurrency(total, settings.currency_code)}</p></div>
      {error ? <p className="error-box">{error.message}</p> : <ConfigurableList title={current === "supplier" ? "Supplier-linked accounts" : "Accounts"} count={rows.length} storageKey={`srt-account-columns-${current}`} columns={columns} defaults={current === "supplier" ? ["code", "name", "type", "balance"] : ["code", "name", "normal", "balance"]} rows={rows} actionLabel="Add account" actionContent={<AccountForm />} />}
    </section>
  </div></main>;
}
