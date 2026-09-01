"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { updateVehicle, type VehicleFormState } from "./actions";

type VehicleRowProps = {
  vehicle: {
    id: string | number;
    vehicle_name: string;
    vehicle_type: string;
    plate_number: string | null;
    make: string | null;
    model: string | null;
    year: number | null;
    color: string | null;
    registration_expiry: string | null;
    insurance_expiry: string | null;
    inspection_date: string | null;
    notes: string | null;
    status: string;
  };
  columns?: string[];
};

const initialState: VehicleFormState = { message: "", success: false };

export function VehicleRow({ vehicle,columns=["plate","type","status"] }: VehicleRowProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateVehicle, initialState);

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
        title="Click to edit vehicle details"
      >
        <td className="px-4 py-4 font-medium text-emerald-300">{vehicle.vehicle_name}</td>
        {columns.includes("plate")&&<td className="px-4 py-4 text-slate-300">{vehicle.plate_number || "—"}</td>}
        {columns.includes("type")&&<td className="px-4 py-4 capitalize text-slate-300">{vehicle.vehicle_type}</td>}
        {columns.includes("make_model")&&<td className="px-4 py-4">{[vehicle.make,vehicle.model].filter(Boolean).join(" ")||"—"}</td>}
        {columns.includes("year")&&<td className="px-4 py-4">{vehicle.year||"—"}</td>}
        {columns.includes("color")&&<td className="px-4 py-4">{vehicle.color||"—"}</td>}
        {columns.includes("registration")&&<td className="px-4 py-4">{vehicle.registration_expiry||"—"}</td>}
        {columns.includes("insurance")&&<td className="px-4 py-4">{vehicle.insurance_expiry||"—"}</td>}
        {columns.includes("inspection")&&<td className="px-4 py-4">{vehicle.inspection_date||"—"}</td>}
        {columns.includes("status")&&<td className="px-4 py-4">
          <span
            className={`rounded-full px-3 py-1 text-sm capitalize ${
              vehicle.status === "active"
                ? "bg-emerald-400/10 text-emerald-300"
                : "bg-slate-700 text-slate-300"
            }`}
          >
            {vehicle.status}
          </span>
        </td>}
      </tr>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="vehicle-dialog-title"
              className="my-auto w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-emerald-400">VEHICLE DETAILS</p>
                  <h2 id="vehicle-dialog-title" className="mt-1 text-2xl font-bold text-slate-100">
                    {vehicle.vehicle_name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  aria-label="Close vehicle details"
                >
                  ✕
                </button>
              </div>

              <form action={formAction} className="mt-6 grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="id" value={vehicle.id} />

                <VehicleField label="Vehicle name" id={`vehicle-name-${vehicle.id}`} name="vehicle_name" defaultValue={vehicle.vehicle_name} required />
                <VehicleField label="Plate number" id={`vehicle-plate-${vehicle.id}`} name="plate_number" defaultValue={vehicle.plate_number ?? ""} placeholder="Example: B 123456" />

                <div>
                  <label htmlFor={`vehicle-type-${vehicle.id}`} className="mb-2 block text-sm font-medium text-slate-300">Vehicle type</label>
                  <select
                    id={`vehicle-type-${vehicle.id}`}
                    name="vehicle_type"
                    defaultValue={vehicle.vehicle_type}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-400"
                  >
                    <option value="van">Van</option>
                    <option value="moto">Moto</option>
                  </select>
                </div>

                <VehicleField label="Make" id={`vehicle-make-${vehicle.id}`} name="make" defaultValue={vehicle.make ?? ""} placeholder="Example: Renault" />
                <VehicleField label="Model" id={`vehicle-model-${vehicle.id}`} name="model" defaultValue={vehicle.model ?? ""} placeholder="Example: Trafic" />
                <VehicleField label="Year" id={`vehicle-year-${vehicle.id}`} name="year" type="number" defaultValue={vehicle.year?.toString() ?? ""} placeholder="Example: 2022" />
                <VehicleField label="Color" id={`vehicle-color-${vehicle.id}`} name="color" defaultValue={vehicle.color ?? ""} placeholder="Example: White" />

                <div>
                  <label htmlFor={`vehicle-status-${vehicle.id}`} className="mb-2 block text-sm font-medium text-slate-300">Status</label>
                  <select
                    id={`vehicle-status-${vehicle.id}`}
                    name="status"
                    defaultValue={vehicle.status}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-400"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <fieldset className="rounded-xl border border-slate-800 p-4 sm:col-span-2">
                  <legend className="px-2 text-sm font-semibold text-slate-300">Documents and inspection</legend>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <VehicleField label="Registration expiry" id={`registration-expiry-${vehicle.id}`} name="registration_expiry" type="date" defaultValue={vehicle.registration_expiry ?? ""} />
                    <VehicleField label="Insurance expiry" id={`insurance-expiry-${vehicle.id}`} name="insurance_expiry" type="date" defaultValue={vehicle.insurance_expiry ?? ""} />
                    <VehicleField label="Next inspection" id={`inspection-date-${vehicle.id}`} name="inspection_date" type="date" defaultValue={vehicle.inspection_date ?? ""} />
                  </div>
                </fieldset>

                <div className="sm:col-span-2">
                  <label htmlFor={`vehicle-notes-${vehicle.id}`} className="mb-2 block text-sm font-medium text-slate-300">Notes</label>
                  <textarea
                    id={`vehicle-notes-${vehicle.id}`}
                    name="notes"
                    rows={3}
                    maxLength={1000}
                    defaultValue={vehicle.notes ?? ""}
                    className="field resize-y"
                  />
                </div>

                {state.message && (
                  <p
                    role="status"
                    className={`rounded-xl p-3 text-sm sm:col-span-2 ${
                      state.success
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-red-400/10 text-red-200"
                    }`}
                  >
                    {state.message}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2 sm:col-span-2">
                  <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-300 hover:bg-slate-800">
                    Close
                  </button>
                  <button type="submit" disabled={pending} className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-60">
                    {pending ? "Saving…" : "Save changes"}
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

type VehicleFieldProps = {
  label: string;
  id: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "number" | "date";
};

function VehicleField({
  label,
  id,
  name,
  defaultValue,
  placeholder,
  required = false,
  type = "text",
}: VehicleFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-300">{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        minLength={type === "text" && required ? 2 : undefined}
        maxLength={type === "text" ? 100 : undefined}
        min={type === "number" ? 1900 : undefined}
        max={type === "number" ? new Date().getFullYear() + 1 : undefined}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-400"
      />
    </div>
  );
}
