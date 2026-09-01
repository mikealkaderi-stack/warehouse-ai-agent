"use client";

import { useActionState } from "react";
import type { AppSettings } from "@/lib/settings";
import { updateSettings, type SettingsFormState } from "./actions";

const initialState: SettingsFormState = { success: false, message: "" };

export function SettingsForm({ settings }: { settings: AppSettings }) {
  const [state, formAction, pending] = useActionState(updateSettings, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-8">
      <SettingsSection title="Company and report header">
        <SettingInput label="Company name" name="company_name" value={settings.company_name} required />
        <SettingInput label="Phone" name="company_phone" value={settings.company_phone ?? ""} />
        <SettingInput label="Email" name="company_email" type="email" value={settings.company_email ?? ""} />
        <div className="sm:col-span-2">
          <label htmlFor="company_address" className="mb-2 block text-sm font-medium text-slate-300">Company address</label>
          <textarea id="company_address" name="company_address" rows={3} maxLength={1000} defaultValue={settings.company_address ?? ""} className="field resize-y" />
        </div>
      </SettingsSection>

      <SettingsSection title="Application defaults">
        <div>
          <label htmlFor="currency_code" className="mb-2 block text-sm font-medium text-slate-300">Currency</label>
          <select id="currency_code" name="currency_code" defaultValue={settings.currency_code} className="field">
            <option value="USD">USD — US Dollar</option>
            <option value="LBP">LBP — Lebanese Pound</option>
            <option value="EUR">EUR — Euro</option>
          </select>
        </div>
        <SettingInput label="Time zone" name="timezone" value={settings.timezone} placeholder="Asia/Beirut" required />
        <div>
          <label htmlFor="default_report_range" className="mb-2 block text-sm font-medium text-slate-300">Default report period</label>
          <select id="default_report_range" name="default_report_range" defaultValue={settings.default_report_range} className="field">
            <option value="today">Today</option>
            <option value="last_7_days">Last 7 days</option>
            <option value="this_month">This month</option>
          </select>
        </div>
        <SettingInput label="Trip-number prefix" name="trip_number_prefix" value={settings.trip_number_prefix} placeholder="TRIP" required />
      </SettingsSection>

      <div>
        <label htmlFor="report_footer" className="mb-2 block text-sm font-medium text-slate-300">Printed report footer</label>
        <textarea id="report_footer" name="report_footer" rows={3} maxLength={1000} defaultValue={settings.report_footer ?? ""} className="field resize-y" placeholder="Optional note printed at the bottom of reports" />
      </div>

      {state.message && <p role="status" className={`rounded-xl p-4 text-sm ${state.success ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-200"}`}>{state.message}</p>}

      <button type="submit" disabled={pending} className="rounded-xl bg-emerald-400 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-60">
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <fieldset className="rounded-2xl border border-slate-800 p-5"><legend className="px-2 text-lg font-semibold text-slate-100">{title}</legend><div className="grid gap-4 sm:grid-cols-2">{children}</div></fieldset>;
}

function SettingInput({ label, name, value, type = "text", placeholder, required }: { label: string; name: string; value: string; type?: "text" | "email"; placeholder?: string; required?: boolean }) {
  return <div><label htmlFor={name} className="mb-2 block text-sm font-medium text-slate-300">{label}</label><input id={name} name={name} type={type} defaultValue={value} placeholder={placeholder} required={required} maxLength={150} className="field" /></div>;
}
