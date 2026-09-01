import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateInTimeZone, getAppSettings } from "@/lib/settings";
import { type TripRecord } from "./trip-row";
import { TripDirectory } from "./trip-directory";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  status?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: string;
};

export default async function TripsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const settings = await getAppSettings();
  const supabase = await createAdminClient();
  const [driversResult, regionsResult, vehiclesResult, tripsResult, locksResult] = await Promise.all([
    supabase.from("drivers").select("id, name, status").order("name"),
    supabase.from("regions").select("id, name, status").order("name"),
    supabase
      .from("vehicles")
      .select("id, vehicle_name, plate_number, status")
      .order("vehicle_name"),
    supabase
      .from("trip_details")
      .select("id, trip_number, trip_date, driver_id, driver_name, region_id, region_name, vehicle_id, vehicle_name, distance_km, assigned_orders, delivered_orders, undelivered_orders, success_rate, cash_collected, whish_collected, credit_amount, total_payment_value, fuel_expense, other_expense, expense_note, expected_cash, cash_handed, cash_difference, fuel_cost_per_km, km_per_delivery, notes, status")
      .order("trip_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("trips").select("id, is_locked, locked_at, delivery_expense"),
  ]);

  const setupError = driversResult.error || regionsResult.error || vehiclesResult.error;
  const locksByTrip = new Map(
    (locksResult.data ?? []).map((item) => [item.id, item]),
  );
  const trips = (tripsResult.data ?? []).map((trip) => ({
    ...trip,
    is_locked: locksByTrip.get(trip.id)?.is_locked ?? false,
    locked_at: locksByTrip.get(trip.id)?.locked_at ?? null,
    delivery_expense: locksByTrip.get(trip.id)?.delivery_expense ?? 0,
  })) as TripRecord[];
  const search = (params.q ?? "").trim();
  const normalizedSearch = search.toLocaleLowerCase();
  const status = params.status ?? "";
  const from = validDate(params.from) ? params.from! : "";
  const to = validDate(params.to) ? params.to! : "";
  const sort = params.sort === "oldest" ? "oldest" : "newest";
  const filteredTrips = trips.filter((trip) => {
    const matchesSearch =
      !normalizedSearch ||
      [trip.trip_number, trip.driver_name, trip.region_name, trip.vehicle_name]
        .some((value) => value.toLocaleLowerCase().includes(normalizedSearch));
    const matchesStatus = !status || trip.status === status;
    const matchesFrom = !from || trip.trip_date >= from;
    const matchesTo = !to || trip.trip_date <= to;
    return matchesSearch && matchesStatus && matchesFrom && matchesTo;
  });
  if (sort === "oldest") filteredTrips.reverse();
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredTrips.length / pageSize));
  const requestedPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const currentPage = Math.min(requestedPage, totalPages);
  const visibleTrips = filteredTrips.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const today = dateInTimeZone(settings.timezone);
  const driverOptions = (driversResult.data ?? []).map((item) => ({
    id: item.id,
    label: item.name,
    status: item.status,
  }));
  const regionOptions = (regionsResult.data ?? []).map((item) => ({
    id: item.id,
    label: item.name,
    status: item.status,
  }));
  const vehicleOptions = (vehiclesResult.data ?? []).map((item) => ({
    id: item.id,
    label: item.plate_number
      ? `${item.vehicle_name} — ${item.plate_number}`
      : item.vehicle_name,
    status: item.status,
  }));

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <nav className="flex flex-wrap gap-5 text-sm font-medium">
          <Link href="/" className="text-slate-400 hover:text-slate-200">Dashboard</Link>
          <Link href="/drivers" className="text-slate-400 hover:text-slate-200">Drivers</Link>
          <Link href="/regions" className="text-slate-400 hover:text-slate-200">Regions</Link>
          <Link href="/vehicles" className="text-slate-400 hover:text-slate-200">Vehicles</Link>
          <span className="text-emerald-400">Trips</span>
          <Link href="/reports" className="text-slate-400 hover:text-slate-200">Reports</Link>
          <Link href="/settings" className="text-slate-400 hover:text-slate-200">Settings</Link>
          <Link href="/connection" className="text-slate-400 hover:text-slate-200">Connection</Link>
        </nav>

        <div className="mt-6">
          <p className="text-sm font-semibold tracking-[0.22em] text-emerald-400">SRT DRIVER CONTROL</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Trips</h1>
          <p className="mt-3 text-slate-400">Assign new trips and follow their operational status.</p>
        </div>

        <div className="mt-10">
          <section id="trip-list" className="scroll-mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <form method="get" className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="md:col-span-2 xl:col-span-3">
                <label htmlFor="trip-search" className="mb-2 block text-sm font-medium text-slate-300">Search</label>
                <input
                  id="trip-search"
                  name="q"
                  type="search"
                  defaultValue={search}
                  placeholder="Trip number, driver, region, or vehicle"
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="trip-status" className="mb-2 block text-sm font-medium text-slate-300">Status</label>
                <select id="trip-status" name="status" defaultValue={status} className="field">
                  <option value="">All statuses</option>
                  <option value="open">Open</option>
                  <option value="pending_closing">Pending closing</option>
                  <option value="closed">Closed</option>
                  <option value="cash_difference">Cash difference</option>
                </select>
              </div>
              <div>
                <label htmlFor="trip-from" className="mb-2 block text-sm font-medium text-slate-300">From</label>
                <input id="trip-from" name="from" type="date" defaultValue={from} className="field" />
              </div>
              <div>
                <label htmlFor="trip-to" className="mb-2 block text-sm font-medium text-slate-300">To</label>
                <input id="trip-to" name="to" type="date" defaultValue={to} className="field" />
              </div>
              <div>
                <label htmlFor="trip-sort" className="mb-2 block text-sm font-medium text-slate-300">Sort</label>
                <select id="trip-sort" name="sort" defaultValue={sort} className="field">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
              <div className="flex items-end gap-3 md:col-span-2">
                <button type="submit" className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-300">Apply</button>
                <Link href="/trips" className="rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-300 hover:bg-slate-800">Clear</Link>
              </div>
            </form>

            {(tripsResult.error || locksResult.error) && (
              <p className="mt-5 rounded-xl bg-red-400/10 p-4 text-red-200">Could not load trips: {(tripsResult.error || locksResult.error)?.message}</p>
            )}

            {!tripsResult.error && !locksResult.error && (
              <><div className="mt-6"><TripDirectory trips={visibleTrips} total={filteredTrips.length} today={today} prefix={settings.trip_number_prefix} drivers={driverOptions} regions={regionOptions} vehicles={vehicleOptions} currency={settings.currency_code} setupError={setupError?.message}/></div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                params={{ q: search, status, from, to, sort }}
              />
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Pagination({
  currentPage,
  totalPages,
  params,
}: {
  currentPage: number;
  totalPages: number;
  params: Omit<SearchParams, "page">;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-5 flex items-center justify-between gap-4 text-sm" aria-label="Trip pages">
      <PageLink page={currentPage - 1} disabled={currentPage === 1} params={params}>← Previous</PageLink>
      <span className="text-slate-400">Page {currentPage} of {totalPages}</span>
      <PageLink page={currentPage + 1} disabled={currentPage === totalPages} params={params}>Next →</PageLink>
    </nav>
  );
}

function PageLink({
  page,
  disabled,
  params,
  children,
}: {
  page: number;
  disabled: boolean;
  params: Omit<SearchParams, "page">;
  children: React.ReactNode;
}) {
  if (disabled) {
    return <span className="rounded-lg border border-slate-800 px-3 py-2 text-slate-600">{children}</span>;
  }

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  query.set("page", String(page));

  return <Link href={`/trips?${query.toString()}`} className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 hover:border-emerald-400/50 hover:text-emerald-300">{children}</Link>;
}

function validDate(value?: string): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}
