import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ConnectionResult =
  | { state: "missing" }
  | { state: "connected"; driverCount: number }
  | { state: "error"; message: string };

async function testConnection(): Promise<ConnectionResult> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return { state: "missing" };
  }

  const supabase = await createAdminClient();
  const { count, error } = await supabase
    .from("drivers")
    .select("id", { count: "exact", head: true });

  if (error) return { state: "error", message: error.message };
  return { state: "connected", driverCount: count ?? 0 };
}

export default async function ConnectionPage() {
  const result = await testConnection();
  const connected = result.state === "connected";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
          ← Dashboard
        </Link>
        <p className="mb-4 mt-8 text-sm font-semibold tracking-[0.22em] text-emerald-400">SRT LOGISTICS</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">System connection</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">
          Use this diagnostic page to verify that the local application can reach Supabase.
        </p>

        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
          <div className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${connected ? "bg-emerald-400" : "bg-amber-400"}`} />
            <h2 className="text-xl font-semibold">Supabase connection</h2>
          </div>

          {result.state === "connected" && (
            <div className="mt-5 rounded-xl bg-emerald-400/10 p-4 text-emerald-300">
              Connected successfully. The drivers table contains {result.driverCount}{" "}
              {result.driverCount === 1 ? "row" : "rows"}.
            </div>
          )}
          {result.state === "missing" && (
            <div className="mt-5 rounded-xl bg-amber-400/10 p-4 text-amber-200">
              Add the Supabase environment values to .env.local, then restart the server.
            </div>
          )}
          {result.state === "error" && (
            <div className="mt-5 rounded-xl bg-red-400/10 p-4 text-red-200">
              Supabase responded, but the test query failed: {result.message}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
