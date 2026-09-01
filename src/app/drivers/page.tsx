import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { DriverDirectory } from "./driver-directory";
import { Pagination } from "@/components/pagination";
import { dateInTimeZone,getAppSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

type Driver = {
  id: string | number;
  name: string;
  phone: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  id_number: string | null;
  start_date: string | null;
  notes: string | null;
  status: string;
  badge_name: string | null;
  badge_color: string | null;
  badge_orders: number;
};

type SearchParams = { q?: string; status?: string; page?: string };

export default async function DriversPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const client=await createAdminClient(),settings=await getAppSettings(),today=dateInTimeZone(settings.timezone),monthStart=`${today.slice(0,7)}-01`;
  const [result,compResult,versionResult,tierResult,tripResult] = await Promise.all([
    client.from("drivers").select("id, name, phone, address, emergency_contact_name, emergency_contact_phone, id_number, start_date, notes, status").order("name"),
    client.from("driver_compensation_history").select("driver_id,commission_scheme_id,effective_from,effective_to").lte("effective_from",today).or(`effective_to.is.null,effective_to.gte.${today}`),
    client.from("commission_scheme_versions").select("id,commission_scheme_id,effective_from,effective_to").lte("effective_from",today).or(`effective_to.is.null,effective_to.gte.${today}`),
    client.from("commission_tiers").select("commission_scheme_version_id,badge_name,badge_color,minimum_orders,maximum_orders"),
    client.from("trips").select("driver_id,delivered_orders").gte("trip_date",monthStart).lte("trip_date",today).in("status",["closed","cash_difference"]),
  ]);
  const { data, error } = result;
  const orders=new Map<string,number>();for(const trip of tripResult.data??[])orders.set(String(trip.driver_id),(orders.get(String(trip.driver_id))??0)+Number(trip.delivered_orders??0));
  const drivers = (data ?? []).map(driver=>{const count=orders.get(String(driver.id))??0,comp=(compResult.data??[]).find(x=>String(x.driver_id)===String(driver.id)),version=(versionResult.data??[]).find(x=>String(x.commission_scheme_id)===String(comp?.commission_scheme_id)),tier=(tierResult.data??[]).find(x=>String(x.commission_scheme_version_id)===String(version?.id)&&Number(x.minimum_orders)<=count&&(x.maximum_orders===null||Number(x.maximum_orders)>=count));return{...driver,badge_name:tier?.badge_name??null,badge_color:tier?.badge_color??null,badge_orders:count}}) as Driver[];
  const search = (params.q ?? "").trim();
  const normalizedSearch = search.toLocaleLowerCase();
  const status = params.status ?? "";
  const filteredDrivers = drivers.filter((driver) =>
    (!normalizedSearch || [driver.name, driver.phone ?? "", driver.id_number ?? "", driver.address ?? ""].some((value) => value.toLocaleLowerCase().includes(normalizedSearch))) &&
    (!status || driver.status === status),
  );
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredDrivers.length / pageSize));
  const requestedPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const currentPage = Math.min(requestedPage, totalPages);
  const visibleDrivers = filteredDrivers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <nav className="flex gap-5 text-sm font-medium">
          <Link href="/" className="text-slate-400 hover:text-slate-200">
            Dashboard
          </Link>
          <span className="text-emerald-400">Drivers</span>
          <Link href="/regions" className="text-slate-400 hover:text-slate-200">
            Regions
          </Link>
          <Link href="/vehicles" className="text-slate-400 hover:text-slate-200">
            Vehicles
          </Link>
          <Link href="/trips" className="text-slate-400 hover:text-slate-200">Trips</Link>
          <Link href="/reports" className="text-slate-400 hover:text-slate-200">Reports</Link>
          <Link href="/settings" className="text-slate-400 hover:text-slate-200">Settings</Link>
          <Link href="/connection" className="text-slate-400 hover:text-slate-200">Connection</Link>
        </nav>

        <div className="mt-6">
          <p className="text-sm font-semibold tracking-[0.22em] text-emerald-400">
            SRT DRIVER CONTROL
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Drivers</h1>
          <p className="mt-3 text-slate-400">
            Manage drivers from one flexible list. Choose the columns you want to see or open any driver to edit.
          </p>
        </div>

        <div className="mt-10">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <form method="get" className="mt-5 grid gap-3 sm:grid-cols-[1fr_170px_auto] sm:items-end">
              <div>
                <label htmlFor="driver-search" className="mb-2 block text-sm font-medium text-slate-300">Search</label>
                <input id="driver-search" name="q" type="search" defaultValue={search} placeholder="Name, phone, ID, or address" className="field" />
              </div>
              <div>
                <label htmlFor="driver-status" className="mb-2 block text-sm font-medium text-slate-300">Status</label>
                <select id="driver-status" name="status" defaultValue={status} className="field">
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-300">Apply</button>
                <Link href="/drivers" className="rounded-xl border border-slate-700 px-4 py-3 text-slate-300 hover:bg-slate-800">Clear</Link>
              </div>
            </form>

            {error && (
              <p className="mt-5 rounded-xl bg-red-400/10 p-4 text-red-200">
                Could not load drivers: {error.message}
              </p>
            )}

            {!error && (
              <div className="mt-6"><DriverDirectory drivers={visibleDrivers} total={filteredDrivers.length}/>
              <Pagination basePath="/drivers" currentPage={currentPage} totalPages={totalPages} params={{ q: search, status }} />
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
