"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { setTripLock, updateTrip, type TripFormState } from "./actions";

export type TripRecord = {
  id: string;
  trip_number: string;
  trip_date: string;
  driver_id: string;
  driver_name: string;
  region_id: string;
  region_name: string;
  vehicle_id: string;
  vehicle_name: string;
  assigned_orders: number;
  delivered_orders: number | null;
  distance_km: number | string | null;
  cash_collected: number | string;
  whish_collected: number | string;
  credit_amount: number | string;
  fuel_expense: number | string;
  delivery_expense: number | string;
  other_expense: number | string;
  expense_note: string | null;
  cash_handed: number | string | null;
  notes: string | null;
  undelivered_orders: number | null;
  success_rate: number | string | null;
  total_payment_value: number | string;
  expected_cash: number | string;
  cash_difference: number | string | null;
  fuel_cost_per_km: number | string | null;
  km_per_delivery: number | string | null;
  status: string;
  is_locked: boolean;
  locked_at: string | null;
};

type Option = { id: string | number; label: string; status: string };

type TripRowProps = {
  trip: TripRecord;
  drivers: Option[];
  regions: Option[];
  vehicles: Option[];
  currency: string;
  columns?: string[];
};

const initialState: TripFormState = { message: "", success: false };

export function TripRow({ trip, drivers, regions, vehicles, currency, columns=["date","driver","region","orders","status"] }: TripRowProps) {
  const [open, setOpen] = useState(false);
  const [cashCollected,setCashCollected]=useState(Number(trip.cash_collected));
  const [fuelExpense,setFuelExpense]=useState(Number(trip.fuel_expense));
  const [deliveryExpense,setDeliveryExpense]=useState(Number(trip.delivery_expense));
  const [otherExpense,setOtherExpense]=useState(Number(trip.other_expense));
  const calculatedCashHanded=Math.max(0,cashCollected-fuelExpense-deliveryExpense-otherExpense);
  const [state, formAction, pending] = useActionState(updateTrip, initialState);
  const [lockState, lockAction, lockPending] = useActionState(setTripLock, initialState);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <tr
        onClick={() => setOpen(true)}
        className="cursor-pointer transition hover:bg-slate-800/60"
        title="Click to edit trip details"
      >
        <td className="px-4 py-4 font-medium text-emerald-300">{trip.trip_number}</td>
        {columns.includes("date")&&<td className="px-4 py-4 text-slate-300">{trip.trip_date}</td>}
        {columns.includes("driver")&&<td className="px-4 py-4">{trip.driver_name}</td>}
        {columns.includes("region")&&<td className="px-4 py-4">{trip.region_name}</td>}
        {columns.includes("vehicle")&&<td className="px-4 py-4">{trip.vehicle_name}</td>}
        {columns.includes("orders")&&<td className="px-4 py-4">{trip.delivered_orders ?? "—"} / {trip.assigned_orders}</td>}
        {columns.includes("distance")&&<td className="px-4 py-4">{trip.distance_km??"—"}</td>}
        {columns.includes("payments")&&<td className="px-4 py-4">{Number(trip.total_payment_value).toFixed(2)}</td>}
        {columns.includes("fuel")&&<td className="px-4 py-4">{Number(trip.fuel_expense).toFixed(2)}</td>}
        {columns.includes("status")&&<td className="px-4 py-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={trip.status} />
            {trip.is_locked && <LockBadge />}
          </div>
        </td>}
      </tr>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 sm:p-8"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="trip-dialog-title"
              className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-medium text-emerald-400">TRIP DETAILS</p>
                    <StatusBadge status={trip.status} />
                    {trip.is_locked && <LockBadge />}
                  </div>
                  <h2 id="trip-dialog-title" className="mt-2 text-2xl font-bold text-slate-100">
                    {trip.trip_number}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  aria-label="Close trip details"
                >
                  ✕
                </button>
              </div>

              <div className={`mt-5 rounded-xl border p-4 ${trip.is_locked ? "border-amber-400/30 bg-amber-400/10" : "border-slate-700 bg-slate-950"}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className={`font-semibold ${trip.is_locked ? "text-amber-200" : "text-slate-200"}`}>
                      {trip.is_locked ? "This trip is locked" : "This trip is editable"}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {trip.is_locked
                        ? "Unlock it before changing any trip information."
                        : "Lock it when the record is final and should not be changed."}
                    </p>
                  </div>
                  <form action={lockAction}>
                    <input type="hidden" name="id" value={trip.id} />
                    <input type="hidden" name="should_lock" value={trip.is_locked ? "false" : "true"} />
                    <button
                      type="submit"
                      disabled={lockPending}
                      className={`rounded-xl px-5 py-3 font-semibold transition disabled:opacity-60 ${
                        trip.is_locked
                          ? "bg-amber-300 text-slate-950 hover:bg-amber-200"
                          : "border border-amber-400/40 text-amber-200 hover:bg-amber-400/10"
                      }`}
                    >
                      {lockPending ? "Working…" : trip.is_locked ? "Unlock trip" : "Lock trip"}
                    </button>
                  </form>
                </div>
                {lockState.message && (
                  <p className={`mt-3 text-sm ${lockState.success ? "text-emerald-300" : "text-red-300"}`} role="status">
                    {lockState.message}
                  </p>
                )}
              </div>

              <form action={formAction} className="mt-6 space-y-7">
                <input type="hidden" name="id" value={trip.id} />

                <FormSection title="Assignment">
                  <Input label="Trip number" name="trip_number" defaultValue={trip.trip_number} required disabled={trip.is_locked} />
                  <Input label="Trip date" name="trip_date" type="date" defaultValue={trip.trip_date} required disabled={trip.is_locked} />
                  <Select label="Driver" name="driver_id" defaultValue={trip.driver_id} options={drivers} disabled={trip.is_locked} />
                  <Select label="Region" name="region_id" defaultValue={trip.region_id} options={regions} disabled={trip.is_locked} />
                  <Select label="Vehicle" name="vehicle_id" defaultValue={trip.vehicle_id} options={vehicles} disabled={trip.is_locked} />
                  <Input label="Assigned orders" name="assigned_orders" type="number" defaultValue={String(trip.assigned_orders)} min={0} step={1} required disabled={trip.is_locked} />
                </FormSection>

                <FormSection title="Driver return">
                  <Input label="Distance (KM)" name="distance_km" type="number" defaultValue={valueOf(trip.distance_km)} min={0.01} step={0.01} disabled={trip.is_locked} />
                  <Input label="Delivered orders" name="delivered_orders" type="number" defaultValue={valueOf(trip.delivered_orders)} min={0} step={1} disabled={trip.is_locked} />
                </FormSection>

                <FormSection title="Payments">
                  <Input label="Cash collected" name="cash_collected" type="number" defaultValue={valueOf(trip.cash_collected, "0")} value={cashCollected} onChange={setCashCollected} min={0} step={0.01} required disabled={trip.is_locked} />
                  <Input label="Whish collected" name="whish_collected" type="number" defaultValue={valueOf(trip.whish_collected, "0")} min={0} step={0.01} required disabled={trip.is_locked} />
                  <Input label="Credit amount" name="credit_amount" type="number" defaultValue={valueOf(trip.credit_amount, "0")} min={0} step={0.01} required disabled={trip.is_locked} />
                </FormSection>

                <FormSection title="Expenses and closing">
                  <Input label="Fuel expense" name="fuel_expense" type="number" defaultValue={valueOf(trip.fuel_expense, "0")} value={fuelExpense} onChange={setFuelExpense} min={0} step={0.01} required disabled={trip.is_locked} />
                  <Input label="Delivery expense" name="delivery_expense" type="number" defaultValue={valueOf(trip.delivery_expense, "0")} value={deliveryExpense} onChange={setDeliveryExpense} min={0} step={0.01} required disabled={trip.is_locked} />
                  <Input label="Additional expenses" name="other_expense" type="number" defaultValue={valueOf(trip.other_expense, "0")} value={otherExpense} onChange={setOtherExpense} min={0} step={0.01} required disabled={trip.is_locked} />
                  <Input label="Expense note" name="expense_note" defaultValue={trip.expense_note ?? ""} placeholder="Required when other expense is used" disabled={trip.is_locked} />
                  <Input label="Cash handed (automatic)" name="cash_handed" type="number" defaultValue={calculatedCashHanded.toFixed(2)} value={calculatedCashHanded} min={0} step={0.01} readOnly />
                </FormSection>

                <div>
                  <label htmlFor={`notes-${trip.id}`} className="mb-2 block text-sm font-medium text-slate-300">Notes</label>
                  <textarea
                    id={`notes-${trip.id}`}
                    name="notes"
                    rows={3}
                    defaultValue={trip.notes ?? ""}
                    disabled={trip.is_locked}
                    className="field resize-y"
                    placeholder="Optional trip notes"
                  />
                </div>

                <CalculatedSummary trip={trip} currency={currency} />

                {state.message && (
                  <p
                    role="status"
                    className={`rounded-xl p-4 text-sm ${
                      state.success
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-red-400/10 text-red-200"
                    }`}
                  >
                    {state.message}
                  </p>
                )}

                <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
                  <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-300 hover:bg-slate-800">
                    Close
                  </button>
                  <button type="submit" disabled={pending || trip.is_locked} className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40">
                    {trip.is_locked ? "Trip locked" : pending ? "Saving…" : "Save trip"}
                  </button>
                </div>
              </form>
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-4 text-lg font-semibold text-slate-100">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </fieldset>
  );
}

type InputProps = {
  label: string;
  name: string;
  defaultValue: string;
  type?: "text" | "number" | "date";
  placeholder?: string;
  required?: boolean;
  min?: number;
  step?: number;
  disabled?: boolean;
  readOnly?: boolean;
  value?: number;
  onChange?:(value:number)=>void;
};

function Input({ label, name, defaultValue, type = "text", placeholder, required, min, step, disabled,readOnly,value,onChange }: InputProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium text-slate-300">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={value===undefined?defaultValue:undefined}
        value={value}
        onChange={onChange?event=>onChange(Number(event.target.value)):undefined}
        placeholder={placeholder}
        required={required}
        min={min}
        step={step}
        disabled={disabled}
        readOnly={readOnly}
        className={`field ${readOnly?"cursor-not-allowed bg-slate-800 text-emerald-300":""}`}
      />
    </div>
  );
}

function Select({ label, name, defaultValue, options, disabled }: { label: string; name: string; defaultValue: string; options: Option[]; disabled?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium text-slate-300">{label}</label>
      <select id={name} name={name} defaultValue={defaultValue} disabled={disabled} className="field">
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}{option.status === "inactive" ? " (Inactive)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

function CalculatedSummary({ trip, currency }: { trip: TripRecord; currency: string }) {
  const items = [
    ["Undelivered", trip.undelivered_orders ?? "—"],
    ["Success rate", trip.success_rate === null ? "—" : `${trip.success_rate}%`],
    ["Total payments", money(trip.total_payment_value, currency)],
    ["Expected cash", money(trip.expected_cash, currency)],
    ["Cash difference", trip.cash_difference === null ? "—" : money(trip.cash_difference, currency)],
    ["Fuel / KM", trip.fuel_cost_per_km === null ? "—" : money(trip.fuel_cost_per_km, currency)],
    ["KM / delivery", trip.km_per_delivery ?? "—"],
  ];

  return (
    <section className="rounded-xl bg-slate-950 p-4">
      <h3 className="font-semibold text-slate-200">Calculated by Supabase</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(([label, value]) => (
          <div key={String(label)} className="rounded-lg bg-slate-900 p-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 font-semibold text-slate-200">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">Save the trip to refresh these calculated values.</p>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: "bg-blue-400/10 text-blue-300",
    pending_closing: "bg-amber-400/10 text-amber-200",
    closed: "bg-emerald-400/10 text-emerald-300",
    cash_difference: "bg-red-400/10 text-red-200",
  };
  return (
    <span className={`whitespace-nowrap rounded-full px-3 py-1 text-sm capitalize ${colors[status] ?? "bg-slate-700 text-slate-300"}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function LockBadge() {
  return (
    <span className="whitespace-nowrap rounded-full bg-amber-400/10 px-3 py-1 text-sm text-amber-200">
      Locked
    </span>
  );
}

function valueOf(value: number | string | null, fallback = "") {
  return value === null || value === undefined ? fallback : String(value);
}

function money(value: number | string, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "LBP" ? 0 : 2,
  }).format(Number(value));
}
