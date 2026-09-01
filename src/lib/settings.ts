import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type AppSettings = {
  id: number;
  company_name: string;
  company_address: string | null;
  company_phone: string | null;
  company_email: string | null;
  currency_code: "USD" | "LBP" | "EUR";
  timezone: string;
  default_report_range: "today" | "last_7_days" | "this_month";
  trip_number_prefix: string;
  report_footer: string | null;
};

export const defaultSettings: AppSettings = {
  id: 1,
  company_name: "SRT Logistics",
  company_address: null,
  company_phone: null,
  company_email: null,
  currency_code: "USD",
  timezone: "Asia/Beirut",
  default_report_range: "this_month",
  trip_number_prefix: "TRIP",
  report_footer: null,
};

export async function getAppSettings(): Promise<AppSettings> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("id, company_name, company_address, company_phone, company_email, currency_code, timezone, default_report_range, trip_number_prefix, report_footer")
    .eq("id", 1)
    .single();

  if (error || !data) return defaultSettings;
  return data as AppSettings;
}

export function dateInTimeZone(timezone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "LBP" ? 0 : 2,
  }).format(value);
}
