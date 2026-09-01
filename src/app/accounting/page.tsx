import Link from "next/link";
import { DateFilter } from "@/components/date-filter";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateInTimeZone, formatCurrency, getAppSettings } from "@/lib/settings";
import { JournalForm, OpeningForm } from "./accounting-forms";

export const dynamic = "force-dynamic";
type SearchParams={from?:string;to?:string};

export default async function AccountingOverview({searchParams}:{searchParams:Promise<SearchParams>}){
  const params=await searchParams;const settings=await getAppSettings();const today=dateInTimeZone(settings.timezone);
  const from=validDate(params.from)?params.from!:`${today.slice(0,7)}-01`;const to=validDate(params.to)?params.to!:today;
  const supabase=await createAdminClient();
  const[balances,accounts,ledger,invoices,payments,expenses]=await Promise.all([
    supabase.from("account_balances").select("*").order("code"),
    supabase.from("accounts").select("id,code,name,account_type,is_active").eq("is_active",true).order("code"),
    supabase.from("general_ledger").select("journal_entry_id,entry_number,entry_date,entry_description,debit,credit").gte("entry_date",from).lte("entry_date",to).order("entry_date",{ascending:false}).limit(100),
    supabase.from("supplier_invoices").select("amount").gte("invoice_date",from).lte("invoice_date",to),
    supabase.from("supplier_payments").select("amount").gte("payment_date",from).lte("payment_date",to),
    supabase.from("expense_transactions").select("amount").gte("expense_date",from).lte("expense_date",to),
  ]);
  const balance=(code:string)=>Number(balances.data?.find(x=>x.code===code)?.balance??0);
  const sum=(rows:{amount:number|string}[]|null)=>rows?.reduce((total,row)=>total+Number(row.amount),0)??0;
  const accountList=accounts.data??[];const hasOpening=(ledger.data??[]).some(x=>x.entry_description==="Opening balances");
  return <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100"><div className="mx-auto max-w-7xl">
    <p className="eyebrow">ACCOUNTING DASHBOARD</p><h1 className="page-title">Financial Overview</h1><p className="page-lead">Balances and activity across the selected reporting period.</p>
    <DateFilter from={from} to={to} basePath="/accounting"/>
    <section className="metric-grid">
      <Metric label="Cash" value={formatCurrency(balance("1000"),settings.currency_code)} accent="green"/>
      <Metric label="MGT payable" value={formatCurrency(balance("2001"),settings.currency_code)} accent="amber"/>
      <Metric label="Arcome payable" value={formatCurrency(balance("2002"),settings.currency_code)} accent="amber"/>
      <Metric label="Payroll payable" value={formatCurrency(balance("2100"),settings.currency_code)}/>
      <Metric label="Invoices in period" value={formatCurrency(sum(invoices.data),settings.currency_code)}/>
      <Metric label="Supplier payments" value={formatCurrency(sum(payments.data),settings.currency_code)}/>
      <Metric label="Expenses in period" value={formatCurrency(sum(expenses.data),settings.currency_code)} accent="red"/>
      <Metric label="Posted ledger lines" value={String(ledger.data?.length??0)}/>
    </section>
    <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Quick href="/accounting/accounts" title="Chart of Accounts" text="Review account types and balances"/>
      <Quick href="/accounting/invoices?view=new" title="New Invoice" text="Add an MGT or Arcome charge"/>
      <Quick href="/accounting/expenses?view=new" title="New Expense" text="Record an operating expense"/>
      <Quick href="/accounting/payments?view=new" title="New Payment" text="Pay a supplier from Cash"/>
    </section>
    <section className="surface-card mt-6"><div className="flex items-center justify-between gap-4"><div><h2 className="section-title">Recent activity</h2><p className="mt-1 text-sm text-slate-400">Posted journal entries in the selected period</p></div><Link href="/accounting/ledger" className="text-sm font-semibold text-emerald-300">General Ledger →</Link></div><div className="mt-5 overflow-x-auto"><table className="data-table"><thead><tr><th>Date</th><th>Journal</th><th>Description</th><th className="text-right">Debit</th><th className="text-right">Credit</th></tr></thead><tbody>{(ledger.data??[]).slice(0,12).map((x,index)=><tr key={`${x.journal_entry_id}-${index}`}><td>{x.entry_date}</td><td className="text-emerald-300">{x.entry_number}</td><td>{x.entry_description}</td><td className="text-right">{Number(x.debit)?formatCurrency(Number(x.debit),settings.currency_code):"—"}</td><td className="text-right">{Number(x.credit)?formatCurrency(Number(x.credit),settings.currency_code):"—"}</td></tr>)}</tbody></table></div></section>
    <section className="mt-6 grid gap-6 xl:grid-cols-2">{!hasOpening&&<div className="surface-card"><h2 className="section-title">Opening balances</h2><OpeningForm today={today}/></div>}<div className="surface-card"><h2 className="section-title">Manual journal</h2><JournalForm today={today} accounts={accountList}/></div></section>
  </div></main>;
}
function Metric({label,value,accent="default"}:{label:string;value:string;accent?:"default"|"green"|"amber"|"red"}){const color={default:"text-slate-100",green:"text-emerald-300",amber:"text-amber-300",red:"text-rose-300"}[accent];return <article className="metric-card"><p>{label}</p><strong className={color}>{value}</strong></article>}
function Quick({href,title,text}:{href:string;title:string;text:string}){return <Link href={href} className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-0.5 hover:border-emerald-400/40"><h2 className="font-semibold group-hover:text-emerald-300">{title}</h2><p className="mt-2 text-sm text-slate-500">{text}</p></Link>}
function validDate(value?:string):value is string{return Boolean(value&&/^\d{4}-\d{2}-\d{2}$/.test(value))}

