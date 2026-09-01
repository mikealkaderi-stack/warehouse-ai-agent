import { DateFilter } from "@/components/date-filter";
import { PageTabs } from "@/components/page-tabs";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateInTimeZone, formatCurrency, getAppSettings } from "@/lib/settings";
import { InvoiceForm } from "../suppliers/forms";
import { InvoiceList } from "./invoice-list";
export const dynamic = "force-dynamic";

export default async function Invoices({ searchParams }: { searchParams: Promise<{ view?: string; from?: string; to?: string }> }) {
  const p = await searchParams, view = ["overview", "new", "list"].includes(p.view ?? "") ? p.view! : "overview", settings = await getAppSettings(), today = dateInTimeZone(settings.timezone), from = /^\d{4}-\d{2}-\d{2}$/.test(p.from ?? "") ? p.from! : `${today.slice(0, 7)}-01`, to = /^\d{4}-\d{2}-\d{2}$/.test(p.to ?? "") ? p.to! : today, s = await createAdminClient();
  const [invoices, suppliers, accounts, balances] = await Promise.all([
    s.from("supplier_invoices").select("id,invoice_number,supplier_id,invoice_date,expense_account_id,payable_account_id,amount,description,reference,status,journal_entry_id").neq("status","voided").gte("invoice_date", from).lte("invoice_date", to).order("invoice_date", { ascending: false }),
    s.from("suppliers").select("id,code,name,payable_account_id,default_expense_account_id,is_active").eq("is_active", true).order("name"),
    s.from("accounts").select("id,code,name,account_type").eq("is_active", true).order("code"),
    s.from("account_balances").select("id,balance")
  ]);
  const expenses = (accounts.data ?? []).filter(x => x.account_type === "expense"), payables = (accounts.data ?? []).filter(x => x.account_type === "liability"), total = (invoices.data ?? []).reduce((sum, x) => sum + Number(x.amount), 0), balanceMap = new Map((balances.data ?? []).map(x => [String(x.id), Number(x.balance)]));
  return <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100"><div className="mx-auto max-w-7xl"><p className="eyebrow">ACCOUNTING</p><h1 className="page-title">Supplier Invoices</h1><p className="page-lead">Record charges, inspect invoice details, and protect posted accounting entries.</p><div className="mt-8"><PageTabs current={view} items={[{ key: "overview", label: "Overview", href: "/accounting/invoices" }, { key: "new", label: "New invoice", href: "/accounting/invoices?view=new" }, { key: "list", label: "Invoice list", href: "/accounting/invoices?view=list" }]} /></div>
    {view === "overview" && <><DateFilter from={from} to={to} basePath="/accounting/invoices" /><div className="metric-grid"><Metric label="Invoices in period" value={String(invoices.data?.length ?? 0)} /><Metric label="Invoice value" value={formatCurrency(total, settings.currency_code)} />{(suppliers.data ?? []).map(x => <Metric key={x.id} label={`${x.name} payable`} value={formatCurrency(balanceMap.get(String(x.payable_account_id)) ?? 0, settings.currency_code)} />)}</div></>}
    {view === "new" && <section className="surface-card mt-6 max-w-3xl"><h2 className="section-title">New supplier invoice</h2><InvoiceForm suppliers={suppliers.data ?? []} expenses={expenses} payables={payables} today={today} /></section>}
    {view === "list" && <><DateFilter from={from} to={to} basePath="/accounting/invoices" extra={{ view: "list" }} /><InvoiceList rows={invoices.data ?? []} suppliers={suppliers.data ?? []} expenses={expenses} payables={payables} currency={settings.currency_code} today={today} /></>}
  </div></main>;
}
function Metric({ label, value }: { label: string; value: string }) { return <article className="metric-card"><p>{label}</p><strong>{value}</strong></article>; }
