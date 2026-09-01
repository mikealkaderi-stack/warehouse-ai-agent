import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReportActions } from "./report-actions";
import { dateInTimeZone, formatCurrency, getAppSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

type SearchParams = {
  type?: string;
  from?: string;
  to?: string;
  driver?: string;
  region?: string;
  vehicle?: string;
  status?: string;
};

type ReportType = "cash" | "simplified" | "detailed";

type ReportTrip = {
  id: string;
  trip_number: string;
  trip_date: string;
  driver_name: string;
  region_name: string;
  vehicle_name: string;
  plate_number: string | null;
  assigned_orders: number;
  delivered_orders: number | null;
  undelivered_orders: number | null;
  success_rate: number | string | null;
  distance_km: number | string | null;
  total_payment_value: number | string;
  expected_cash: number | string;
  cash_handed: number | string | null;
  cash_difference: number | string | null;
  fuel_expense: number | string;
  other_expense: number | string;
  status: string;
};

export default async function ReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const settings = await getAppSettings();
  const reportType: ReportType =
    params.type === "cash" || params.type === "simplified"
      ? params.type
      : "detailed";
  const today = dateInTimeZone(settings.timezone);
  const defaultFrom = defaultRangeStart(today, settings.default_report_range);
  const from = validDate(params.from) ? params.from! : defaultFrom;
  const to = validDate(params.to) ? params.to! : today;
  const startDate = from <= to ? from : to;
  const endDate = from <= to ? to : from;
  const supabase = await createAdminClient();

  let reportQuery = supabase
    .from("trip_details")
    .select("id, trip_number, trip_date, driver_id, driver_name, region_id, region_name, vehicle_id, vehicle_name, plate_number, assigned_orders, delivered_orders, undelivered_orders, success_rate, distance_km, total_payment_value, expected_cash, cash_handed, cash_difference, fuel_expense, other_expense, status")
    .gte("trip_date", startDate)
    .lte("trip_date", endDate)
    .order("trip_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (params.driver) reportQuery = reportQuery.eq("driver_id", params.driver);
  if (params.region) reportQuery = reportQuery.eq("region_id", params.region);
  if (params.vehicle) reportQuery = reportQuery.eq("vehicle_id", params.vehicle);
  if (params.status) reportQuery = reportQuery.eq("status", params.status);

  const [reportResult, driversResult, regionsResult, vehiclesResult] = await Promise.all([
    reportQuery,
    supabase.from("drivers").select("id, name, status").order("name"),
    supabase.from("regions").select("id, name, status").order("name"),
    supabase.from("vehicles").select("id, vehicle_name, plate_number, status").order("vehicle_name"),
  ]);
  const trips = (reportResult.data ?? []) as ReportTrip[];
  const error = reportResult.error || driversResult.error || regionsResult.error || vehiclesResult.error;
  const assigned = sum(trips, "assigned_orders");
  const delivered = sum(trips, "delivered_orders");
  const successRate = assigned > 0 ? (delivered / assigned) * 100 : 0;
  const distance = sum(trips, "distance_km");
  const payments = sum(trips, "total_payment_value");
  const expectedCash = sum(trips, "expected_cash");
  const cashHanded = sum(trips, "cash_handed");
  const cashDifference = sum(trips, "cash_difference");
  const fuel = sum(trips, "fuel_expense");
  const otherExpenses = sum(trips, "other_expense");
  const reportTitle = {
    cash: "CASH REPORT",
    simplified: "SIMPLIFIED REPORT",
    detailed: "DETAILED TRIP REPORT",
  }[reportType];

  return (
    <main className="report-page min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-6 border-b border-slate-800 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.22em] text-emerald-400">{settings.company_name.toUpperCase()}</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">{reportTitle}</h1>
            <p className="mt-3 text-slate-400">{displayDate(startDate)} to {displayDate(endDate)}</p>
            {(settings.company_address || settings.company_phone || settings.company_email) && (
              <p className="mt-2 text-sm text-slate-500">
                {[settings.company_address, settings.company_phone, settings.company_email].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ReportActions rows={trips} from={startDate} to={endDate} reportName={reportType} />
            <nav className="print-hidden flex flex-wrap gap-3 text-sm font-medium">
              <Link href="/" className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800">Dashboard</Link>
              <Link href="/trips" className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800">Trips</Link>
              <Link href="/settings" className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800">Settings</Link>
            </nav>
          </div>
        </header>

        <section className="print-hidden mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Report type</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              <ReportTypeLink type="cash" current={reportType} params={params}>Cash Report</ReportTypeLink>
              <ReportTypeLink type="simplified" current={reportType} params={params}>Simplified Report</ReportTypeLink>
              <ReportTypeLink type="detailed" current={reportType} params={params}>Detailed Report</ReportTypeLink>
            </div>
          </div>
          <h2 className="text-lg font-semibold">Report filters</h2>
          <form method="get" className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6 xl:items-end">
            <input type="hidden" name="type" value={reportType} />
            <DateField label="From" name="from" value={startDate} />
            <DateField label="To" name="to" value={endDate} />
            <FilterSelect label="Driver" name="driver" value={params.driver ?? ""} allLabel="All drivers" options={(driversResult.data ?? []).map((item) => ({ id: item.id, label: item.name, inactive: item.status === "inactive" }))} />
            <FilterSelect label="Region" name="region" value={params.region ?? ""} allLabel="All regions" options={(regionsResult.data ?? []).map((item) => ({ id: item.id, label: item.name, inactive: item.status === "inactive" }))} />
            <FilterSelect label="Vehicle" name="vehicle" value={params.vehicle ?? ""} allLabel="All vehicles" options={(vehiclesResult.data ?? []).map((item) => ({ id: item.id, label: item.plate_number ? `${item.vehicle_name} — ${item.plate_number}` : item.vehicle_name, inactive: item.status === "inactive" }))} />
            <div>
              <label htmlFor="status" className="mb-2 block text-sm font-medium text-slate-300">Status</label>
              <select id="status" name="status" defaultValue={params.status ?? ""} className="field">
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="pending_closing">Pending closing</option>
                <option value="closed">Closed</option>
                <option value="cash_difference">Cash difference</option>
              </select>
            </div>
            <div className="flex gap-3 xl:col-span-6">
              <button type="submit" className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-300">Apply filters</button>
              <Link href={`/reports?type=${reportType}`} className="rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-300 hover:bg-slate-800">Reset</Link>
            </div>
          </form>
        </section>

        {error && <p className="mt-8 rounded-xl bg-red-400/10 p-4 text-red-200">Could not load the report: {error.message}</p>}

        {reportType === "cash" ? (
          <CashReport
            trips={trips}
            cashHanded={cashHanded}
            fuel={fuel}
            otherExpenses={otherExpenses}
            currency={settings.currency_code}
          />
        ) : reportType === "simplified" ? (
          <SimplifiedReport
            trips={trips}
            assigned={assigned}
            delivered={delivered}
            successRate={successRate}
            distance={distance}
          />
        ) : (
          <>
        <section className="report-summary mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <ReportMetric label="Trips" value={trips.length} />
          <ReportMetric label="Assigned" value={assigned} />
          <ReportMetric label="Delivered" value={delivered} />
          <ReportMetric label="Success rate" value={`${successRate.toFixed(1)}%`} />
          <ReportMetric label="Distance" value={`${distance.toFixed(2)} km`} />
          <ReportMetric label="Payments" value={formatCurrency(payments, settings.currency_code)} />
          <ReportMetric label="Expected cash" value={formatCurrency(expectedCash, settings.currency_code)} />
          <ReportMetric label="Cash handed" value={formatCurrency(cashHanded, settings.currency_code)} />
          <ReportMetric label="Cash difference" value={formatCurrency(cashDifference, settings.currency_code)} alert={cashDifference !== 0} />
          <ReportMetric label="Fuel expense" value={formatCurrency(fuel, settings.currency_code)} />
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Trip details</h2>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">{trips.length} rows</span>
          </div>
          {trips.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">No trips match the selected filters.</div>
          ) : (
            <>
            <div className="print-only mt-6 space-y-3">
              {trips.map((trip) => (
                <article key={trip.id} className="print-trip-card rounded-xl border border-slate-300 p-3">
                  <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                    <h3 className="font-bold">{trip.trip_number}</h3>
                    <span className="capitalize">{trip.status.replaceAll("_", " ")}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1 text-sm">
                    <PrintValue label="Date" value={trip.trip_date} />
                    <PrintValue label="Driver" value={trip.driver_name} />
                    <PrintValue label="Region" value={trip.region_name} />
                    <PrintValue label="Vehicle" value={trip.plate_number ? `${trip.vehicle_name} — ${trip.plate_number}` : trip.vehicle_name} />
                    <PrintValue label="Orders" value={`${trip.delivered_orders ?? "—"} delivered / ${trip.assigned_orders} assigned`} />
                    <PrintValue label="Success" value={trip.success_rate === null ? "—" : `${trip.success_rate}%`} />
                    <PrintValue label="Distance" value={trip.distance_km === null ? "—" : `${trip.distance_km} km`} />
                    <PrintValue label="Payments" value={formatCurrency(Number(trip.total_payment_value), settings.currency_code)} />
                    <PrintValue label="Expected cash" value={formatCurrency(Number(trip.expected_cash), settings.currency_code)} />
                    <PrintValue label="Cash handed" value={trip.cash_handed === null ? "—" : formatCurrency(Number(trip.cash_handed), settings.currency_code)} />
                    <PrintValue label="Cash difference" value={trip.cash_difference === null ? "—" : formatCurrency(Number(trip.cash_difference), settings.currency_code)} />
                    <PrintValue label="Fuel expense" value={formatCurrency(Number(trip.fuel_expense), settings.currency_code)} />
                  </div>
                </article>
              ))}
            </div>
            <div className="screen-report-table mt-6 overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full min-w-[1400px] text-left text-sm">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    {['Trip', 'Date', 'Driver', 'Region', 'Vehicle', 'Assigned', 'Delivered', 'Success', 'KM', 'Payments', 'Expected cash', 'Cash handed', 'Difference', 'Fuel', 'Status'].map((heading) => (
                      <th key={heading} className="px-3 py-3 font-medium">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {trips.map((trip) => (
                    <tr key={trip.id}>
                      <td className="px-3 py-3 font-medium text-emerald-300">{trip.trip_number}</td>
                      <td className="px-3 py-3">{trip.trip_date}</td>
                      <td className="px-3 py-3">{trip.driver_name}</td>
                      <td className="px-3 py-3">{trip.region_name}</td>
                      <td className="px-3 py-3">{trip.vehicle_name}</td>
                      <td className="px-3 py-3">{trip.assigned_orders}</td>
                      <td className="px-3 py-3">{trip.delivered_orders ?? "—"}</td>
                      <td className="px-3 py-3">{trip.success_rate === null ? "—" : `${trip.success_rate}%`}</td>
                      <td className="px-3 py-3">{trip.distance_km ?? "—"}</td>
                      <td className="px-3 py-3">{formatCurrency(Number(trip.total_payment_value), settings.currency_code)}</td>
                      <td className="px-3 py-3">{formatCurrency(Number(trip.expected_cash), settings.currency_code)}</td>
                      <td className="px-3 py-3">{trip.cash_handed === null ? "—" : formatCurrency(Number(trip.cash_handed), settings.currency_code)}</td>
                      <td className={`px-3 py-3 ${Number(trip.cash_difference ?? 0) !== 0 ? "text-red-300" : ""}`}>{trip.cash_difference === null ? "—" : formatCurrency(Number(trip.cash_difference), settings.currency_code)}</td>
                      <td className="px-3 py-3">{formatCurrency(Number(trip.fuel_expense), settings.currency_code)}</td>
                      <td className="px-3 py-3 capitalize">{trip.status.replaceAll("_", " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </section>
          </>
        )}
        {settings.report_footer && (
          <footer className="mt-8 border-t border-slate-700 pt-4 text-center text-sm text-slate-500">
            {settings.report_footer}
          </footer>
        )}
      </div>
    </main>
  );
}

type FilterOption = { id: string | number; label: string; inactive: boolean };

function ReportTypeLink({
  type,
  current,
  params,
  children,
}: {
  type: ReportType;
  current: ReportType;
  params: SearchParams;
  children: React.ReactNode;
}) {
  const query = new URLSearchParams({ type });
  for (const key of ["from", "to", "driver", "region", "vehicle", "status"] as const) {
    if (params[key]) query.set(key, params[key]!);
  }
  return (
    <Link
      href={`/reports?${query.toString()}`}
      className={
        current === type
          ? "rounded-xl bg-emerald-400 px-4 py-2 font-semibold text-slate-950"
          : "rounded-xl border border-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800"
      }
    >
      {children}
    </Link>
  );
}

function CashReport({
  trips,
  cashHanded,
  fuel,
  otherExpenses,
  currency,
}: {
  trips: ReportTrip[];
  cashHanded: number;
  fuel: number;
  otherExpenses: number;
  currency: string;
}) {
  const totalExpenses = fuel + otherExpenses;

  return (
    <>
      <section className="cash-summary mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="border-b border-slate-800 pb-5">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-400">Handed cash</p>
          <p className="mt-2 font-mono text-4xl font-bold text-emerald-300">{formatCurrency(cashHanded, currency)}</p>
        </div>
        <div className="mt-5">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-400">Expenses</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <CashValue label="Fuel" value={fuel} currency={currency} />
            <CashValue label="Other expenses" value={otherExpenses} currency={currency} />
            <CashValue label="Total expenses" value={totalExpenses} currency={currency} strong />
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Trip cash details</h2>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">{trips.length} trips</span>
        </div>
        {trips.length === 0 ? (
          <EmptyReport />
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
            <table className="portrait-table w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="px-3 py-3 font-medium">Trip number</th>
                  <th className="px-3 py-3 font-medium">Region</th>
                  <th className="px-3 py-3 font-medium">Driver</th>
                  <th className="px-3 py-3 text-right font-medium">Expenses</th>
                  <th className="px-3 py-3 text-right font-medium">Cash handed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {trips.map((trip) => (
                  <tr key={trip.id}>
                    <td className="px-3 py-3 font-medium">{trip.trip_number}</td>
                    <td className="px-3 py-3">{trip.region_name}</td>
                    <td className="px-3 py-3">{trip.driver_name}</td>
                    <td className="px-3 py-3 text-right font-mono">{formatCurrency(Number(trip.fuel_expense) + Number(trip.other_expense), currency)}</td>
                    <td className="px-3 py-3 text-right font-mono">{trip.cash_handed === null ? "—" : formatCurrency(Number(trip.cash_handed), currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-600 bg-slate-950 font-bold">
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-right">Total</td>
                  <td className="px-3 py-4 text-right font-mono">{formatCurrency(totalExpenses, currency)}</td>
                  <td className="px-3 py-4 text-right font-mono">{formatCurrency(cashHanded, currency)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function CashValue({ label, value, currency, strong = false }: { label: string; value: number; currency: string; strong?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${strong ? "bg-amber-400/10" : "bg-slate-950"}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 font-mono text-xl font-bold ${strong ? "text-amber-200" : "text-slate-100"}`}>{formatCurrency(value, currency)}</p>
    </div>
  );
}

function SimplifiedReport({
  trips,
  assigned,
  delivered,
  successRate,
  distance,
}: {
  trips: ReportTrip[];
  assigned: number;
  delivered: number;
  successRate: number;
  distance: number;
}) {
  return (
    <>
      <section className="report-summary mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <ReportMetric label="Trips" value={trips.length} />
        <ReportMetric label="Assigned" value={assigned} />
        <ReportMetric label="Delivered" value={delivered} />
        <ReportMetric label="Success rate" value={`${successRate.toFixed(1)}%`} />
        <ReportMetric label="Distance" value={`${distance.toFixed(2)} km`} />
      </section>

      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Operational summary</h2>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">{trips.length} trips</span>
        </div>
        {trips.length === 0 ? (
          <EmptyReport />
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
            <table className="portrait-table w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="px-3 py-3 font-medium">Trip</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Driver</th>
                  <th className="px-3 py-3 font-medium">Region</th>
                  <th className="px-3 py-3 text-right font-medium">Assigned</th>
                  <th className="px-3 py-3 text-right font-medium">Delivered</th>
                  <th className="px-3 py-3 text-right font-medium">Success</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {trips.map((trip) => (
                  <tr key={trip.id}>
                    <td className="px-3 py-3 font-medium">{trip.trip_number}</td>
                    <td className="px-3 py-3">{trip.trip_date}</td>
                    <td className="px-3 py-3">{trip.driver_name}</td>
                    <td className="px-3 py-3">{trip.region_name}</td>
                    <td className="px-3 py-3 text-right font-mono">{trip.assigned_orders}</td>
                    <td className="px-3 py-3 text-right font-mono">{trip.delivered_orders ?? "—"}</td>
                    <td className="px-3 py-3 text-right font-mono">{trip.success_rate === null ? "—" : `${trip.success_rate}%`}</td>
                    <td className="px-3 py-3 capitalize">{trip.status.replaceAll("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-600 bg-slate-950 font-bold">
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-right">Total</td>
                  <td className="px-3 py-4 text-right font-mono">{assigned}</td>
                  <td className="px-3 py-4 text-right font-mono">{delivered}</td>
                  <td className="px-3 py-4 text-right font-mono">{successRate.toFixed(1)}%</td>
                  <td className="px-3 py-4" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function EmptyReport() {
  return <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">No trips match the selected filters.</div>;
}

function DateField({ label, name, value }: { label: string; name: string; value: string }) {
  return <div><label htmlFor={name} className="mb-2 block text-sm font-medium text-slate-300">{label}</label><input id={name} name={name} type="date" defaultValue={value} className="field" /></div>;
}

function FilterSelect({ label, name, value, allLabel, options }: { label: string; name: string; value: string; allLabel: string; options: FilterOption[] }) {
  return <div><label htmlFor={name} className="mb-2 block text-sm font-medium text-slate-300">{label}</label><select id={name} name={name} defaultValue={value} className="field"><option value="">{allLabel}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.label}{option.inactive ? " (Inactive)" : ""}</option>)}</select></div>;
}

function ReportMetric({ label, value, alert = false }: { label: string; value: string | number; alert?: boolean }) {
  return <article className="rounded-xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-slate-400">{label}</p><p className={`mt-2 text-xl font-bold ${alert ? "text-red-300" : "text-slate-100"}`}>{value}</p></article>;
}

function PrintValue({ label, value }: { label: string; value: string | number }) {
  return <p><span className="font-semibold">{label}:</span> {value}</p>;
}

function sum(trips: ReportTrip[], key: keyof ReportTrip) {
  return trips.reduce((total, trip) => total + Number(trip[key] ?? 0), 0);
}

function validDate(value?: string): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function defaultRangeStart(
  today: string,
  range: "today" | "last_7_days" | "this_month",
) {
  if (range === "today") return today;
  if (range === "last_7_days") {
    const date = new Date(`${today}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 6);
    return date.toISOString().slice(0, 10);
  }
  return `${today.slice(0, 7)}-01`;
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}
