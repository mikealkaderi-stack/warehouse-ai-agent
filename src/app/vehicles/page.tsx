import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { VehicleDirectory } from "./vehicle-directory";
import { Pagination } from "@/components/pagination";

export const dynamic = "force-dynamic";

type Vehicle = {
  id: string | number;
  vehicle_name: string;
  vehicle_type: string;
  plate_number: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  registration_expiry: string | null;
  insurance_expiry: string | null;
  inspection_date: string | null;
  notes: string | null;
  status: string;
};

type SearchParams = { q?: string; status?: string; type?: string; page?: string };

export default async function VehiclesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const result = await (await createAdminClient())
    .from("vehicles")
    .select("id, vehicle_name, vehicle_type, plate_number, make, model, year, color, registration_expiry, insurance_expiry, inspection_date, notes, status")
    .order("vehicle_name");
  const { data, error } = result;
  const vehicles = (data ?? []) as Vehicle[];
  const search = (params.q ?? "").trim();
  const normalizedSearch = search.toLocaleLowerCase();
  const status = params.status ?? "";
  const vehicleType = params.type ?? "";
  const filteredVehicles = vehicles.filter((vehicle) =>
    (!normalizedSearch || [vehicle.vehicle_name, vehicle.plate_number ?? "", vehicle.make ?? "", vehicle.model ?? "", vehicle.color ?? ""]
      .some((value) => value.toLocaleLowerCase().includes(normalizedSearch))) &&
    (!status || vehicle.status === status) &&
    (!vehicleType || vehicle.vehicle_type === vehicleType),
  );
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / pageSize));
  const requestedPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const currentPage = Math.min(requestedPage, totalPages);
  const visibleVehicles = filteredVehicles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <nav className="flex flex-wrap gap-5 text-sm font-medium">
          <Link href="/" className="text-slate-400 hover:text-slate-200">Dashboard</Link>
          <Link href="/drivers" className="text-slate-400 hover:text-slate-200">Drivers</Link>
          <Link href="/regions" className="text-slate-400 hover:text-slate-200">Regions</Link>
          <span className="text-emerald-400">Vehicles</span>
          <Link href="/trips" className="text-slate-400 hover:text-slate-200">Trips</Link>
          <Link href="/reports" className="text-slate-400 hover:text-slate-200">Reports</Link>
          <Link href="/settings" className="text-slate-400 hover:text-slate-200">Settings</Link>
          <Link href="/connection" className="text-slate-400 hover:text-slate-200">Connection</Link>
        </nav>

        <div className="mt-6">
          <p className="text-sm font-semibold tracking-[0.22em] text-emerald-400">SRT DRIVER CONTROL</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Vehicles</h1>
          <p className="mt-3 text-slate-400">Add vehicles, then click any vehicle to open and edit its full details.</p>
        </div>

        <div className="mt-10">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Vehicle list</h2>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                {filteredVehicles.length} matching
              </span>
            </div>

            <form method="get" className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="md:col-span-2 xl:col-span-3">
                <label htmlFor="vehicle-search" className="mb-2 block text-sm font-medium text-slate-300">Search</label>
                <input id="vehicle-search" name="q" type="search" defaultValue={search} placeholder="Name, plate, make, or model" className="field" />
              </div>
              <div>
                <label htmlFor="vehicle-status" className="mb-2 block text-sm font-medium text-slate-300">Status</label>
                <select id="vehicle-status" name="status" defaultValue={status} className="field">
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label htmlFor="vehicle-type-filter" className="mb-2 block text-sm font-medium text-slate-300">Type</label>
                <select id="vehicle-type-filter" name="type" defaultValue={vehicleType} className="field">
                  <option value="">All types</option>
                  <option value="van">Van</option>
                  <option value="moto">Moto</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" className="rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-300">Apply</button>
                <Link href="/vehicles" className="rounded-xl border border-slate-700 px-4 py-3 text-slate-300 hover:bg-slate-800">Clear</Link>
              </div>
            </form>

            {error && (
              <p className="mt-5 rounded-xl bg-red-400/10 p-4 text-red-200">
                Could not load vehicles: {error.message}
              </p>
            )}

            {!error && (
              <><div className="mt-5"><VehicleDirectory vehicles={visibleVehicles} total={filteredVehicles.length}/></div>
              <Pagination basePath="/vehicles" currentPage={currentPage} totalPages={totalPages} params={{ q: search, status, type: vehicleType }} />
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
