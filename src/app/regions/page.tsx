import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { RegionDirectory } from "./region-directory";
import { Pagination } from "@/components/pagination";

export const dynamic = "force-dynamic";

type Region = {
  id: string | number;
  name: string;
  status: string;
};

type SearchParams = { q?: string; status?: string; page?: string };

export default async function RegionsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const result = await (await createAdminClient())
    .from("regions")
    .select("id, name, status")
    .order("name");
  const { data, error } = result;
  const regions = (data ?? []) as Region[];
  const search = (params.q ?? "").trim();
  const normalizedSearch = search.toLocaleLowerCase();
  const status = params.status ?? "";
  const filteredRegions = regions.filter((region) =>
    (!normalizedSearch || region.name.toLocaleLowerCase().includes(normalizedSearch)) &&
    (!status || region.status === status),
  );
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredRegions.length / pageSize));
  const requestedPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const currentPage = Math.min(requestedPage, totalPages);
  const visibleRegions = filteredRegions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <nav className="flex gap-5 text-sm font-medium">
          <Link href="/" className="text-slate-400 hover:text-slate-200">
            Dashboard
          </Link>
          <Link href="/drivers" className="text-slate-400 hover:text-slate-200">
            Drivers
          </Link>
          <span className="text-emerald-400">Regions</span>
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
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Regions</h1>
          <p className="mt-3 text-slate-400">
            Maintain the delivery regions used when assigning trips.
          </p>
        </div>

        <div className="mt-10">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Region list</h2>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                {filteredRegions.length} matching
              </span>
            </div>

            <form method="get" className="mt-5 grid gap-3 sm:grid-cols-[1fr_170px_auto] sm:items-end">
              <div>
                <label htmlFor="region-search" className="mb-2 block text-sm font-medium text-slate-300">Search</label>
                <input id="region-search" name="q" type="search" defaultValue={search} placeholder="Region name" className="field" />
              </div>
              <div>
                <label htmlFor="region-status" className="mb-2 block text-sm font-medium text-slate-300">Status</label>
                <select id="region-status" name="status" defaultValue={status} className="field">
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-300">Apply</button>
                <Link href="/regions" className="rounded-xl border border-slate-700 px-4 py-3 text-slate-300 hover:bg-slate-800">Clear</Link>
              </div>
            </form>

            {error && (
              <p className="mt-5 rounded-xl bg-red-400/10 p-4 text-red-200">
                Could not load regions: {error.message}
              </p>
            )}

            {!error && (
              <><div className="mt-5"><RegionDirectory regions={visibleRegions} total={filteredRegions.length}/></div>
              <Pagination basePath="/regions" currentPage={currentPage} totalPages={totalPages} params={{ q: search, status }} />
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
