import Link from "next/link";

const csvExports = [
  ["drivers", "Drivers", "Names, contact details, status, and profile information."],
  ["regions", "Regions", "Region names and active status."],
  ["vehicles", "Vehicles", "Vehicle details, documents, and status."],
  ["trips", "Trips", "All trip inputs, cash, expenses, status, and lock state."],
  ["app_settings", "Settings", "Company, report, currency, and numbering settings."],
  ["accounts", "Chart of Accounts", "All accounting accounts and configuration."],
  ["journal_entries", "Journal Entries", "Journal headers, sources, and posting status."],
  ["journal_lines", "Journal Lines", "Every debit and credit in the General Ledger."],
  ["supplier_invoices", "Supplier Invoices", "MGT and Arcome service invoices."],
  ["supplier_payments", "Supplier Payments", "Complete supplier payment history."],
  ["expense_transactions", "Expenses", "Manual and Trip Fuel expense transactions."],
  ["employees", "Employees", "Non-driver employee profiles and positions."],
  ["employee_salary_history", "Salary History", "Effective-dated employee salaries."],
  ["driver_compensation_history", "Driver Compensation", "Effective-dated driver salary and scheme assignments."],
  ["commission_tiers", "Commission Tiers", "Versioned delivered-order ranges and rates."],
  ["payroll_runs", "Payroll Runs", "Draft, approved, and paid payroll headers."],
  ["payroll_items", "Payroll Snapshots", "Locked employee and driver payroll calculations."],
] as const;

export default function BackupPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <nav className="flex flex-wrap gap-5 text-sm font-medium">
          <Link href="/" className="text-slate-400 hover:text-slate-200">Dashboard</Link>
          <Link href="/trips" className="text-slate-400 hover:text-slate-200">Trips</Link>
          <Link href="/reports" className="text-slate-400 hover:text-slate-200">Reports</Link>
          <Link href="/settings" className="text-slate-400 hover:text-slate-200">Settings</Link>
          <span className="text-emerald-400">Backup</span>
        </nav>

        <p className="mt-8 text-sm font-semibold tracking-[0.22em] text-emerald-400">SRT DRIVER CONTROL</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Data Backup</h1>
        <p className="mt-3 max-w-3xl text-slate-400">
          Download a private copy of your business data. Keep backup files somewhere safe,
          such as an external drive or a private cloud folder.
        </p>

        <section className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-emerald-200">Complete application data</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                One JSON file containing operations, accounting, suppliers, employees,
                compensation history, commission versions, payroll, and settings.
                Passwords and Supabase keys are never included.
              </p>
            </div>
            <a
              href="/api/backup"
              className="shrink-0 rounded-xl bg-emerald-400 px-5 py-3 text-center font-semibold text-slate-950 hover:bg-emerald-300"
            >
              Download full backup
            </a>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Spreadsheet exports</h2>
          <p className="mt-2 text-sm text-slate-400">
            CSV files open in Excel and are useful for reviewing or sharing one category.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {csvExports.map(([table, label, description]) => (
              <article key={table} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{label}</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
                  </div>
                  <a
                    href={`/api/backup/csv?table=${table}`}
                    className="shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:border-emerald-400/50 hover:text-emerald-300"
                  >
                    CSV ↓
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <SafetyStep number="1" title="Every week" text="Download the full backup after your final workday." />
          <SafetyStep number="2" title="Keep two copies" text="Save one locally and one on an external drive or private cloud." />
          <SafetyStep number="3" title="Never edit it" text="Keep the original JSON file unchanged so it remains reliable." />
        </section>

        <div className="mt-8 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
          This download protects your business records, but it is not the complete Supabase
          database structure. For disaster recovery, also keep a Supabase database backup as
          explained in the project&apos;s backup and recovery guide.
        </div>
      </div>
    </main>
  );
}

function SafetyStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400 font-bold text-slate-950">{number}</span>
      <h2 className="mt-4 font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </article>
  );
}
