"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type DriverFormState = {
  message: string;
  success: boolean;
};

export async function addDriver(
  _previousState: DriverFormState,
  formData: FormData,
): Promise<DriverFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const emergencyContactName = String(formData.get("emergency_contact_name") ?? "").trim();
  const emergencyContactPhone = String(formData.get("emergency_contact_phone") ?? "").trim();
  const idNumber = String(formData.get("id_number") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (name.length < 2) {
    return { success: false, message: "Enter a driver name." };
  }

  if (name.length > 100) {
    return { success: false, message: "The driver name is too long." };
  }
  if (phone.length > 30 || emergencyContactPhone.length > 30 || idNumber.length > 100) return { success: false, message: "A phone or identification value is too long." };
  if ([address, emergencyContactName, notes].some((value) => value.length > 1000)) return { success: false, message: "One of the profile details is too long." };
  if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return { success: false, message: "Select a valid start date." };

  const supabase = await createAdminClient();
  const { error } = await supabase.from("drivers").insert({
    name,
    phone: phone || null,
    address: address || null,
    emergency_contact_name: emergencyContactName || null,
    emergency_contact_phone: emergencyContactPhone || null,
    id_number: idNumber || null,
    start_date: startDate || null,
    notes: notes || null,
    status: "active",
  });

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/drivers");
  revalidatePath("/");

  return { success: true, message: `${name} was added successfully.` };
}

export async function updateDriver(
  _previousState: DriverFormState,
  formData: FormData,
): Promise<DriverFormState> {
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const emergencyContactName = String(formData.get("emergency_contact_name") ?? "").trim();
  const emergencyContactPhone = String(formData.get("emergency_contact_phone") ?? "").trim();
  const idNumber = String(formData.get("id_number") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!id) {
    return { success: false, message: "The driver ID is missing." };
  }

  if (name.length < 2 || name.length > 100) {
    return { success: false, message: "Enter a valid driver name." };
  }

  if (phone.length > 30) {
    return { success: false, message: "The phone number is too long." };
  }

  if (emergencyContactPhone.length > 30 || idNumber.length > 100) {
    return { success: false, message: "A contact or identification value is too long." };
  }

  if ([address, emergencyContactName, notes].some((value) => value.length > 1000)) {
    return { success: false, message: "One of the profile details is too long." };
  }

  if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return { success: false, message: "Select a valid start date." };
  }

  if (!["active", "inactive"].includes(status)) {
    return { success: false, message: "Select a valid driver status." };
  }

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("drivers")
    .update({
      name,
      phone: phone || null,
      address: address || null,
      emergency_contact_name: emergencyContactName || null,
      emergency_contact_phone: emergencyContactPhone || null,
      id_number: idNumber || null,
      start_date: startDate || null,
      notes: notes || null,
      status,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { success: false, message: "That driver ID number is already in use." };
    }
    return { success: false, message: error.message };
  }

  revalidatePath("/drivers");
  revalidatePath("/");
  return { success: true, message: "Driver updated successfully." };
}
