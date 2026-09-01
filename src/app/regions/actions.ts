"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type RegionFormState = {
  message: string;
  success: boolean;
};

export async function addRegion(
  _previousState: RegionFormState,
  formData: FormData,
): Promise<RegionFormState> {
  const name = String(formData.get("name") ?? "").trim();

  if (name.length < 2) {
    return { success: false, message: "Enter a region name." };
  }

  if (name.length > 100) {
    return { success: false, message: "The region name is too long." };
  }

  const supabase = await createAdminClient();
  const { error } = await supabase.from("regions").insert({
    name,
    status: "active",
  });

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/regions");
  return { success: true, message: `${name} was added successfully.` };
}

export async function updateRegion(
  _previousState: RegionFormState,
  formData: FormData,
): Promise<RegionFormState> {
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!id) {
    return { success: false, message: "The region ID is missing." };
  }

  if (name.length < 2 || name.length > 100) {
    return { success: false, message: "Enter a valid region name." };
  }

  if (!['active', 'inactive'].includes(status)) {
    return { success: false, message: "Select a valid region status." };
  }

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("regions")
    .update({ name, status })
    .eq("id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/regions");
  return { success: true, message: "Region updated successfully." };
}
