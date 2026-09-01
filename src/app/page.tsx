import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateInTimeZone, formatCurrency, getAppSettings } from "@/lib/settings";
import { logout } from "./login/actions";
import { PerformanceChart } from "@/components/performance-chart";

export const dynamic = "force-dynamic";

type DashboardTrip = {
  id: string;
  trip_number: string;
  trip_date: string;
  driver_name: string;
  region_name: string;
  vehicle_name: string;
  assigned_orders: number;
  delivered_orders: number | null;
  undelivered_orders: number | null;
  total_payment_value: number | string;
  expected_cash: number | string;
  cash_difference: number | string | null;
  fuel_expense: number | string;
  status: string;
};

type VehicleForAlert = {
  id: string;
  vehicle_name: string;
  plate_number: string | null;
  registration_expiry: string | null;
  insurance_expiry: string | null;
  inspection_date: string | null;
  status: string;
};

type VehicleAlert = {
  id: string;
  vehicle: string;
  document: string;
  date: string;
  expired: boolean;
  daysRemaining: number;
};

type SearchParams = {
  from?: string;
  to?: string;
  driver?: string;
  region?: string;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const settings = await getAppSettings();
  const today = dateInTimeZone(settings.timezone);
  const from = validDate(params.from) ? params.from! : today;
  const to = validDate(params.to) ? params.to! : today;
  const startDate = from <= to ? from : to;
  const endDate = from <= to ? to : from;
  const selectedDriver = params.driver ?? "";
  const selectedRegion = params.region ?? "";
  const supabase = await createAdminClient();
  const tripFields =
    "id, trip_number, trip_date, driver_name, region_name, vehicle_name, assigned_orders, delivered_orders, undelivered_orders, total_payment_value, expected_cash, cash_difference, fuel_expense, status";

  let tripsQuery = supabase
    .from("trip_details")
    .select(tripFields)
    .gte("trip_date", startDate)
    .lte("trip_date", endDate)
    .order("trip_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (selectedDriver) tripsQuery = tripsQuery.eq("driver_id", selectedDriver);
  if (selectedRegion) tripsQuery = tripsQuery.eq("region_id", selectedRegion);

  const [tripsResult, driversResult, regionsResult, vehiclesResult] = await Promise.all([
    tripsQuery,
    supabase.from("drivers").select("id, name, status").order("name"),
    supabase.from("regions").select("id, name, status").order("name"),
    supabase
      .from("vehicles")
      .select("id, vehicle_name, plate_number, registration_expiry, insurance_expiry, inspection_date, status")
      .eq("status", "active")
      .order("vehicle_name"),
  ]);

  const error =
    tripsResult.error || driversResult.error || regionsResult.error || vehiclesResult.error;
  const trips = (tripsResult.data ?? []) as DashboardTrip[];
  const assigned = sum(trips, "assigned_orders");
  const delivered = sum(trips, "delivered_orders");
  const undelivered = sum(trips, "undelivered_orders");
  const successRate = assigned > 0 ? (delivered / assigned) * 100 : 0;
  const payments = sum(trips, "total_payment_value");
  const expectedCash = sum(trips, "expected_cash");
  const cashDifference = sum(trips, "cash_difference");
  const fuel = sum(trips, "fuel_expense");
  const attentionCount = trips.filter((trip) =>
    ["open", "pending_closing", "cash_difference"].includes(trip.status),
  ).length;
  const activeDriverCount = (driversResult.data ?? []).filter(
    (driver) => driver.status === "active",
  ).length;
  const activeVehicles = (vehiclesResult.data ?? []) as VehicleForAlert[];
  const vehicleAlerts = getVehicleAlerts(activeVehicles, today);
  const selectedDriverName = driversResult.data?.find(
    (driver) => driver.id === selectedDriver,
  )?.name;
  const selectedRegionName = regionsResult.data?.find(
    (region) => region.id === selectedRegion,
  )?.name;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-6 border-b border-slate-800 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.22em] text-emerald-400">
              {settings.company_name.toUpperCase()}
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-3 text-slate-400">
              Operations from {displayDate(startDate)} to {displayDate(endDate)}
            </p>
          </div>
          <nav className="flex flex-wrap gap-3 text-sm font-medium">
            <NavLink href="/trips" primary>Trips</NavLink>
            <NavLink href="/drivers">Drivers</NavLink>
            <NavLink href="/regions">Regions</NavLink>
            <NavLink href="/vehicles">Vehicles</NavLink>
            <NavLink href="/employees">Employees</NavLink>
            <NavLink href="/accounting">Accounting</NavLink>
            <NavLink href="/accounting/suppliers">Suppliers</NavLink>
            <NavLink href="/accounting/trip-expenses">Trip Fuel</NavLink>
            <NavLink href="/payroll">Payroll</NavLink>
            <NavLink href="/payroll/commission">Commission</NavLink>
            <NavLink href="/reports">Reports</NavLink>
            <NavLink href="/backup">Backup</NavLink>
            <NavLink href="/settings">Settings</NavLink>
            <NavLink href="/connection">Connection</NavLink>
            <form action={logout}>
              <button className="rounded-xl border border-red-400/30 px-4 py-2 text-red-200 hover:bg-red-400/10">
                Sign out
              </button>
            </form>
          </nav>
        </header>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Dashboard filters</h2>
              <p className="mt-1 text-sm text-slate-400">
                All figures and trips below use the same selected filters.
              </p>
            </div>
            {(selectedDriverName || selectedRegionName) && (
              <p className="text-sm text-emerald-300">
                {selectedDriverName ?? "All drivers"} · {selectedRegionName ?? "All regions"}
              </p>
            )}
          </div>

          <form method="get" className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.25fr_1.25fr_auto] xl:items-end">
            <FilterField label="From" name="from" type="date" defaultValue={startDate} />
            <FilterField label="To" name="to" type="date" defaultValue={endDate} />

            <div>
              <label htmlFor="driver-filter" className="mb-2 block text-sm font-medium text-slate-300">Driver</label>
              <select id="driver-filter" name="driver" defaultValue={selectedDriver} className="field">
                <option value="">All drivers</option>
                {(driversResult.data ?? []).map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}{driver.status === "inactive" ? " (Inactive)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="region-filter" className="mb-2 block text-sm font-medium text-slate-300">Region</label>
              <select id="region-filter" name="region" defaultValue={selectedRegion} className="field">
                <option value="">All regions</option>
                {(regionsResult.data ?? []).map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}{region.status === "inactive" ? " (Inactive)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-300">
                Apply
              </button>
              <Link href="/" className="rounded-xl border border-slate-700 px-4 py-3 font-medium text-slate-300 hover:bg-slate-800">
                Reset
              </Link>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <QuickDateLink label="Today" from={today} to={today} driver={selectedDriver} region={selectedRegion} />
            <QuickDateLink label="Last 7 days" from={daysBefore(today, 6)} to={today} driver={selectedDriver} region={selectedRegion} />
            <QuickDateLink label="This month" from={`${today.slice(0, 7)}-01`} to={today} driver={selectedDriver} region={selectedRegion} />
          </div>
        </section>

        {error && (
          <p className="mt-8 rounded-xl bg-red-400/10 p-4 text-red-200">
            The dashboard could not load all data: {error.message}
          </p>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Trips in period" value={trips.length} note={`${attentionCount} need attention`} tone="blue" />
          <Metric label="Delivery success" value={`${successRate.toFixed(1)}%`} note={`${delivered} delivered · ${undelivered} undelivered`} tone="green" />
          <Metric label="Total payments" value={formatCurrency(payments, settings.currency_code)} note={`${formatCurrency(expectedCash, settings.currency_code)} expected cash`} tone="green" />
          <Metric label="Cash difference" value={formatCurrency(cashDifference, settings.currency_code)} note={cashDifference === 0 ? "Cash is balanced" : "Review differences"} tone={cashDifference === 0 ? "green" : "red"} />
          <Metric label="Assigned orders" value={assigned} note={`${delivered} completed`} />
          <Metric label="Fuel expense" value={formatCurrency(fuel, settings.currency_code)} note="Selected period" />
          <Metric label="Active drivers" value={activeDriverCount} note="Available master records" />
          <Metric label="Active vehicles" value={activeVehicles.length} note="Available master records" />
        </section>

        <PerformanceChart trips={trips} startDate={startDate} endDate={endDate} driverName={selectedDriverName} />

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Vehicle document alerts</h2>
              <p className="mt-1 text-sm text-slate-400">Expired documents and items due within the next 30 days.</p>
            </div>
            <Link href="/vehicles" className="rounded-xl border border-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800">
              Manage vehicles →
            </Link>
          </div>

          {vehicleAlerts.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-700 p-6 text-center text-slate-400">
              No vehicle documents are expired or due soon.
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {vehicleAlerts.map((alert) => (
                <article
                  key={alert.id}
                  className={`rounded-xl border p-4 ${
                    alert.expired
                      ? "border-red-400/30 bg-red-400/10"
                      : "border-amber-400/30 bg-amber-400/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-100">{alert.vehicle}</p>
                      <p className="mt-1 text-sm text-slate-300">{alert.document}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${alert.expired ? "bg-red-300 text-red-950" : "bg-amber-300 text-amber-950"}`}>
                      {alert.expired ? "Expired" : "Due soon"}
                    </span>
                  </div>
                  <p className={`mt-3 text-sm ${alert.expired ? "text-red-200" : "text-amber-200"}`}>
                    {displayDate(alert.date)} · {alert.expired
                      ? `${Math.abs(alert.daysRemaining)} days overdue`
                      : alert.daysRemaining === 0
                        ? "Due today"
                        : `${alert.daysRemaining} days remaining`}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Filtered trips</h2>
              <p className="mt-1 text-sm text-slate-400">Trips matching the selected time, driver, and region.</p>
            </div>
            <Link href="/trips" className="rounded-xl bg-emerald-400 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-300">
              Manage trips →
            </Link>
          </div>

          {trips.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
              No trips match these filters.
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-950 text-sm text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Trip</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Driver</th>
                    <th className="px-4 py-3 font-medium">Region</th>
                    <th className="px-4 py-3 font-medium">Vehicle</th>
                    <th className="px-4 py-3 font-medium">Orders</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {trips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-4 font-medium text-emerald-300">{trip.trip_number}</td>
                      <td className="px-4 py-4 text-slate-300">{trip.trip_date}</td>
                      <td className="px-4 py-4">{trip.driver_name}</td>
                      <td className="px-4 py-4">{trip.region_name}</td>
                      <td className="px-4 py-4">{trip.vehicle_name}</td>
                      <td className="px-4 py-4">{trip.delivered_orders ?? "—"} / {trip.assigned_orders}</td>
                      <td className="px-4 py-4"><StatusBadge status={trip.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function FilterField({ label, name, type, defaultValue }: { label: string; name: string; type: "date"; defaultValue: string }) {
  return (
    <div>
      <label htmlFor={`${name}-filter`} className="mb-2 block text-sm font-medium text-slate-300">{label}</label>
      <input id={`${name}-filter`} name={name} type={type} defaultValue={defaultValue} className="field" />
    </div>
  );
}

function QuickDateLink({ label, from, to, driver, region }: { label: string; from: string; to: string; driver: string; region: string }) {
  const query = new URLSearchParams({ from, to });
  if (driver) query.set("driver", driver);
  if (region) query.set("region", region);
  return (
    <Link href={`/?${query.toString()}`} className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 hover:border-emerald-400/50 hover:text-emerald-300">
      {label}
    </Link>
  );
}

function Metric({ label, value, note, tone = "neutral" }: { label: string; value: string | number; note: string; tone?: "neutral" | "blue" | "green" | "red" }) {
  const valueColor = { neutral: "text-slate-100", blue: "text-blue-300", green: "text-emerald-300", red: "text-red-300" }[tone];
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold tracking-tight ${valueColor}`}>{value}</p>
      <p className="mt-2 text-xs text-slate-500">{note}</p>
    </article>
  );
}

function NavLink({ href, children, primary = false }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <Link href={href} className={primary ? "rounded-xl bg-emerald-400 px-4 py-2 text-slate-950 hover:bg-emerald-300" : "rounded-xl border border-slate-700 px-4 py-2 text-slate-300 hover:border-slate-500 hover:text-slate-100"}>
      {children}
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: "bg-blue-400/10 text-blue-300",
    pending_closing: "bg-amber-400/10 text-amber-200",
    closed: "bg-emerald-400/10 text-emerald-300",
    cash_difference: "bg-red-400/10 text-red-200",
  };
  return (
    <span className={`whitespace-nowrap rounded-full px-3 py-1 text-sm capitalize ${colors[status] ?? "bg-slate-700 text-slate-300"}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function sum(trips: DashboardTrip[], key: keyof DashboardTrip) {
  return trips.reduce((total, trip) => total + Number(trip[key] ?? 0), 0);
}

function validDate(value?: string): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function daysBefore(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function getVehicleAlerts(vehicles: VehicleForAlert[], today: string): VehicleAlert[] {
  const todayTime = Date.parse(`${today}T00:00:00Z`);
  const dueLimit = todayTime + 30 * 24 * 60 * 60 * 1000;
  const documents = [
    ["registration_expiry", "Registration expiry"],
    ["insurance_expiry", "Insurance expiry"],
    ["inspection_date", "Next inspection"],
  ] as const;

  return vehicles
    .flatMap((vehicle) =>
      documents.flatMap(([field, label]) => {
        const date = vehicle[field];
        if (!date) return [];
        const dueTime = Date.parse(`${date}T00:00:00Z`);
        if (!Number.isFinite(dueTime) || dueTime > dueLimit) return [];
        const daysRemaining = Math.round((dueTime - todayTime) / (24 * 60 * 60 * 1000));
        return [{
          id: `${vehicle.id}-${field}`,
          vehicle: vehicle.plate_number
            ? `${vehicle.vehicle_name} — ${vehicle.plate_number}`
            : vehicle.vehicle_name,
          document: label,
          date,
          expired: daysRemaining < 0,
          daysRemaining,
        }];
      }),
    )
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}
