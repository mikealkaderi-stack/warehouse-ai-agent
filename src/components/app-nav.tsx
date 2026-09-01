import Link from "next/link";

const links = [
  ["/", "Dashboard"], ["/trips", "Trips"], ["/drivers", "Drivers"],
  ["/employees", "Employees"], ["/accounting", "Accounting"],
  ["/accounting/suppliers", "Suppliers"], ["/accounting/trip-expenses", "Trip Expenses"],
  ["/payroll", "Payroll"], ["/payroll/commission", "Commission"],
  ["/reports", "Reports"], ["/settings", "Settings"],
] as const;

export function AppNav({ current }: { current?: string }) {
  return (
    <nav className="flex flex-wrap gap-3 text-sm font-medium">
      {links.map(([href, label]) => current === href ? (
        <span key={href} className="rounded-xl bg-emerald-400 px-4 py-2 text-slate-950">{label}</span>
      ) : (
        <Link key={href} href={href} className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300 hover:border-slate-500 hover:text-slate-100">{label}</Link>
      ))}
    </nav>
  );
}
