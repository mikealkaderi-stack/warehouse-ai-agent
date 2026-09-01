"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type TripFormState = {
  message: string;
  success: boolean;
};

export async function addTrip(
  _previousState: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  const tripNumber = String(formData.get("trip_number") ?? "").trim();
  const tripDate = String(formData.get("trip_date") ?? "").trim();
  const driverId = String(formData.get("driver_id") ?? "").trim();
  const regionId = String(formData.get("region_id") ?? "").trim();
  const vehicleId = String(formData.get("vehicle_id") ?? "").trim();
  const assignedOrders = Number(formData.get("assigned_orders"));

  if (!tripNumber || tripNumber.length > 100) {
    return { success: false, message: "Enter a valid trip number." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(tripDate)) {
    return { success: false, message: "Select a valid trip date." };
  }

  if (!driverId || !regionId || !vehicleId) {
    return { success: false, message: "Select a driver, region, and vehicle." };
  }

  if (!Number.isInteger(assignedOrders) || assignedOrders < 0) {
    return { success: false, message: "Assigned orders must be zero or more." };
  }

  const supabase = await createAdminClient();
  const { error } = await supabase.from("trips").insert({
    trip_number: tripNumber,
    trip_date: tripDate,
    driver_id: driverId,
    region_id: regionId,
    vehicle_id: vehicleId,
    assigned_orders: assignedOrders,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, message: "That trip number already exists." };
    }
    return { success: false, message: error.message };
  }

  revalidatePath("/trips");
  return { success: true, message: `${tripNumber} was created successfully.` };
}

function optionalNumber(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  return value === "" ? null : Number(value);
}

function requiredNumber(formData: FormData, name: string) {
  return Number(String(formData.get(name) ?? "").trim());
}

export async function updateTrip(
  _previousState: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  const id = String(formData.get("id") ?? "").trim();
  const tripNumber = String(formData.get("trip_number") ?? "").trim();
  const tripDate = String(formData.get("trip_date") ?? "").trim();
  const driverId = String(formData.get("driver_id") ?? "").trim();
  const regionId = String(formData.get("region_id") ?? "").trim();
  const vehicleId = String(formData.get("vehicle_id") ?? "").trim();
  const assignedOrders = requiredNumber(formData, "assigned_orders");
  const deliveredOrders = optionalNumber(formData, "delivered_orders");
  const distanceKm = optionalNumber(formData, "distance_km");
  const cashCollected = requiredNumber(formData, "cash_collected");
  const whishCollected = requiredNumber(formData, "whish_collected");
  const creditAmount = requiredNumber(formData, "credit_amount");
  const fuelExpense = requiredNumber(formData, "fuel_expense");
  const deliveryExpense = requiredNumber(formData, "delivery_expense");
  const otherExpense = requiredNumber(formData, "other_expense");
  const expenseNote = String(formData.get("expense_note") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!id || !tripNumber || tripNumber.length > 100) {
    return { success: false, message: "Enter a valid trip number." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(tripDate)) {
    return { success: false, message: "Select a valid trip date." };
  }

  if (!driverId || !regionId || !vehicleId) {
    return { success: false, message: "Select a driver, region, and vehicle." };
  }

  if (!Number.isInteger(assignedOrders) || assignedOrders < 0) {
    return { success: false, message: "Assigned orders must be a whole number of zero or more." };
  }

  if (
    deliveredOrders !== null &&
    (!Number.isInteger(deliveredOrders) || deliveredOrders < 0 || deliveredOrders > assignedOrders)
  ) {
    return { success: false, message: "Delivered orders must be between zero and assigned orders." };
  }

  if (distanceKm !== null && (!Number.isFinite(distanceKm) || distanceKm <= 0)) {
    return { success: false, message: "Distance must be greater than zero." };
  }

  const amounts = [cashCollected, whishCollected, creditAmount, fuelExpense, deliveryExpense, otherExpense];
  if (amounts.some((amount) => !Number.isFinite(amount) || amount < 0)) {
    return { success: false, message: "Payment and expense amounts cannot be negative." };
  }

  const cashHanded = Number((cashCollected-fuelExpense-deliveryExpense-otherExpense).toFixed(2));
  if (cashHanded < 0) return { success: false, message: "Trip expenses cannot be greater than cash collected." };

  if (otherExpense > 0 && !expenseNote) {
    return { success: false, message: "Add an expense note when other expense is greater than zero." };
  }

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("trips")
    .update({
      trip_number: tripNumber,
      trip_date: tripDate,
      driver_id: driverId,
      region_id: regionId,
      vehicle_id: vehicleId,
      assigned_orders: assignedOrders,
      delivered_orders: deliveredOrders,
      distance_km: distanceKm,
      cash_collected: cashCollected,
      whish_collected: whishCollected,
      credit_amount: creditAmount,
      fuel_expense: fuelExpense,
      delivery_expense: deliveryExpense,
      other_expense: otherExpense,
      expense_note: expenseNote || null,
      cash_handed: cashHanded,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { success: false, message: "That trip number already exists." };
    }
    return { success: false, message: error.message };
  }

  revalidatePath("/trips");
  return { success: true, message: "Trip updated successfully." };
}

export async function setTripLock(
  _previousState: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  const id = String(formData.get("id") ?? "").trim();
  const shouldLock = String(formData.get("should_lock") ?? "") === "true";

  if (!id) {
    return { success: false, message: "The trip ID is missing." };
  }

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("trips")
    .update({
      is_locked: shouldLock,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/trips");
  return {
    success: true,
    message: shouldLock
      ? "Trip locked successfully."
      : "Trip unlocked successfully.",
  };
}
