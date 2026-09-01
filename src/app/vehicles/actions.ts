"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type VehicleFormState = {
  message: string;
  success: boolean;
};

function readVehicle(formData: FormData) {
  const yearValue = String(formData.get("year") ?? "").trim();

  return {
    vehicleName: String(formData.get("vehicle_name") ?? "").trim(),
    vehicleType: String(formData.get("vehicle_type") ?? "").trim().toLowerCase(),
    plateNumber: String(formData.get("plate_number") ?? "").trim(),
    make: String(formData.get("make") ?? "").trim(),
    model: String(formData.get("model") ?? "").trim(),
    year: yearValue ? Number(yearValue) : null,
    color: String(formData.get("color") ?? "").trim(),
    registrationExpiry: String(formData.get("registration_expiry") ?? "").trim(),
    insuranceExpiry: String(formData.get("insurance_expiry") ?? "").trim(),
    inspectionDate: String(formData.get("inspection_date") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  };
}

function validateVehicle(
  vehicleName: string,
  vehicleType: string,
  plateNumber: string,
  make: string,
  model: string,
  year: number | null,
  color: string,
  registrationExpiry: string,
  insuranceExpiry: string,
  inspectionDate: string,
  notes: string,
) {
  if (vehicleName.length < 2 || vehicleName.length > 100) {
    return "Enter a valid vehicle name.";
  }

  if (!["van", "moto"].includes(vehicleType)) {
    return "Select Van or Moto as the vehicle type.";
  }

  if ([plateNumber, make, model, color].some((value) => value.length > 100)) {
    return "One of the vehicle details is too long.";
  }

  if (notes.length > 1000) {
    return "The vehicle notes are too long.";
  }

  if ([registrationExpiry, insuranceExpiry, inspectionDate].some((value) => value && !/^\d{4}-\d{2}-\d{2}$/.test(value))) {
    return "Select valid vehicle document dates.";
  }

  const maximumYear = new Date().getFullYear() + 1;
  if (year !== null && (!Number.isInteger(year) || year < 1900 || year > maximumYear)) {
    return `Enter a year between 1900 and ${maximumYear}.`;
  }

  return null;
}

export async function addVehicle(
  _previousState: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  const { vehicleName, vehicleType, plateNumber, make, model, year, color, registrationExpiry, insuranceExpiry, inspectionDate, notes } = readVehicle(formData);
  const validationError = validateVehicle(
    vehicleName,
    vehicleType,
    plateNumber,
    make,
    model,
    year,
    color,
    registrationExpiry,
    insuranceExpiry,
    inspectionDate,
    notes,
  );

  if (validationError) {
    return { success: false, message: validationError };
  }

  const supabase = await createAdminClient();
  let error;
  try {
    const result = await supabase.from("vehicles").insert({
      vehicle_name: vehicleName,
      vehicle_type: vehicleType,
      plate_number: plateNumber || null,
      make: make || null,
      model: model || null,
      year,
      color: color || null,
      registration_expiry: registrationExpiry || null,
      insurance_expiry: insuranceExpiry || null,
      inspection_date: inspectionDate || null,
      notes: notes || null,
      status: "active",
    });
    error = result.error;
  } catch {
    return {
      success: false,
      message: "Could not reach Supabase. Check the internet connection and try again.",
    };
  }

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/vehicles");
  return { success: true, message: `${vehicleName} was added successfully.` };
}

export async function updateVehicle(
  _previousState: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const { vehicleName, vehicleType, plateNumber, make, model, year, color, registrationExpiry, insuranceExpiry, inspectionDate, notes } = readVehicle(formData);
  const validationError = validateVehicle(
    vehicleName,
    vehicleType,
    plateNumber,
    make,
    model,
    year,
    color,
    registrationExpiry,
    insuranceExpiry,
    inspectionDate,
    notes,
  );

  if (!id) {
    return { success: false, message: "The vehicle ID is missing." };
  }

  if (validationError) {
    return { success: false, message: validationError };
  }

  if (!["active", "inactive"].includes(status)) {
    return { success: false, message: "Select a valid vehicle status." };
  }

  const supabase = await createAdminClient();
  let error;
  try {
    const result = await supabase
      .from("vehicles")
      .update({
        vehicle_name: vehicleName,
        vehicle_type: vehicleType,
        plate_number: plateNumber || null,
        make: make || null,
        model: model || null,
        year,
        color: color || null,
        registration_expiry: registrationExpiry || null,
        insurance_expiry: insuranceExpiry || null,
        inspection_date: inspectionDate || null,
        notes: notes || null,
        status,
      })
      .eq("id", id);
    error = result.error;
  } catch {
    return {
      success: false,
      message: "Could not reach Supabase. Check the internet connection and try again.",
    };
  }

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/vehicles");
  return { success: true, message: "Vehicle updated successfully." };
}
