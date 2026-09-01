"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type SettingsFormState = { success: boolean; message: string };

export async function updateSettings(
  _previousState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const companyName = String(formData.get("company_name") ?? "").trim();
  const companyAddress = String(formData.get("company_address") ?? "").trim();
  const companyPhone = String(formData.get("company_phone") ?? "").trim();
  const companyEmail = String(formData.get("company_email") ?? "").trim();
  const currencyCode = String(formData.get("currency_code") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim();
  const defaultReportRange = String(formData.get("default_report_range") ?? "").trim();
  const tripNumberPrefix = String(formData.get("trip_number_prefix") ?? "").trim().toUpperCase();
  const reportFooter = String(formData.get("report_footer") ?? "").trim();

  if (companyName.length < 2 || companyName.length > 150) {
    return { success: false, message: "Enter a valid company name." };
  }
  if (!["USD", "LBP", "EUR"].includes(currencyCode)) {
    return { success: false, message: "Select a valid currency." };
  }
  if (!["today", "last_7_days", "this_month"].includes(defaultReportRange)) {
    return { success: false, message: "Select a valid default report period." };
  }
  if (!/^[A-Z0-9-]{1,20}$/.test(tripNumberPrefix)) {
    return { success: false, message: "Trip prefix can contain letters, numbers, and hyphens." };
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
  } catch {
    return { success: false, message: "Enter a valid time zone." };
  }
  if ([companyAddress, reportFooter].some((value) => value.length > 1000)) {
    return { success: false, message: "An address or footer value is too long." };
  }

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      company_name: companyName,
      company_address: companyAddress || null,
      company_phone: companyPhone || null,
      company_email: companyEmail || null,
      currency_code: currencyCode,
      timezone,
      default_report_range: defaultReportRange,
      trip_number_prefix: tripNumberPrefix,
      report_footer: reportFooter || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { success: false, message: error.message };

  revalidatePath("/", "layout");
  return { success: true, message: "Application settings saved successfully." };
}
