"use client";

import { useActionState } from "react";
import { addTrip, type TripFormState } from "./actions";

type Option = { id: string | number; label: string };

type TripFormProps = {
  today: string;
  prefix: string;
  drivers: Option[];
  regions: Option[];
  vehicles: Option[];
};

const initialState: TripFormState = { message: "", success: false };

export function TripForm({ today, prefix, drivers, regions, vehicles }: TripFormProps) {
  const [state, formAction, pending] = useActionState(addTrip, initialState);
  const ready = drivers.length > 0 && regions.length > 0 && vehicles.length > 0;

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <Field label="Trip number" id="trip-number">
        <input
          id="trip-number"
          name="trip_number"
          type="text"
          required
          maxLength={100}
          defaultValue={`${prefix}-`}
          placeholder={`Example: ${prefix}-001`}
          className="field"
        />
      </Field>

      <Field label="Trip date" id="trip-date">
        <input id="trip-date" name="trip_date" type="date" required defaultValue={today} className="field" />
      </Field>

      <SelectField label="Driver" id="driver" name="driver_id" options={drivers} emptyLabel="No active drivers" />
      <SelectField label="Region" id="region" name="region_id" options={regions} emptyLabel="No active regions" />
      <SelectField label="Vehicle" id="vehicle" name="vehicle_id" options={vehicles} emptyLabel="No active vehicles" />

      <Field label="Assigned orders" id="assigned-orders">
        <input
          id="assigned-orders"
          name="assigned_orders"
          type="number"
          min={0}
          step={1}
          required
          defaultValue={0}
          className="field"
        />
      </Field>

      {!ready && (
        <p className="rounded-xl bg-amber-400/10 p-3 text-sm text-amber-200">
          Add at least one active driver, region, and vehicle before creating a trip.
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !ready}
        className="w-full rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create open trip"}
      </button>

      {state.message && (
        <p
          role="status"
          className={`rounded-xl p-3 text-sm ${
            state.success
              ? "bg-emerald-400/10 text-emerald-300"
              : "bg-red-400/10 text-red-200"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-300">{label}</label>
      {children}
    </div>
  );
}

function SelectField({
  label,
  id,
  name,
  options,
  emptyLabel,
}: {
  label: string;
  id: string;
  name: string;
  options: Option[];
  emptyLabel: string;
}) {
  return (
    <Field label={label} id={id}>
      <select id={id} name={name} required defaultValue="" className="field">
        <option value="" disabled>{options.length ? `Select ${label.toLowerCase()}` : emptyLabel}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>{option.label}</option>
        ))}
      </select>
    </Field>
  );
}
