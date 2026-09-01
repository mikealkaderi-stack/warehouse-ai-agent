import Link from "next/link";
import { getAppSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getAppSettings();
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <nav className="flex flex-wrap gap-5 text-sm font-medium">
          <Link href="/" className="text-slate-400 hover:text-slate-200">Dashboard</Link>
          <Link href="/trips" className="text-slate-400 hover:text-slate-200">Trips</Link>
          <Link href="/reports" className="text-slate-400 hover:text-slate-200">Reports</Link>
          <Link href="/backup" className="text-slate-400 hover:text-slate-200">Backup</Link>
          <span className="text-emerald-400">Settings</span>
        </nav>
        <p className="mt-8 text-sm font-semibold tracking-[0.22em] text-emerald-400">SRT DRIVER CONTROL</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Application Settings</h1>
        <p className="mt-3 text-slate-400">Control company identity, printed reports, currency, time zone, and default formats.</p>
        <SettingsForm settings={settings} />
      </div>
    </main>
  );
}
