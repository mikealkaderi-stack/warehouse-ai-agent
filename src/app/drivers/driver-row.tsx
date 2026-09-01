"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { updateDriver, type DriverFormState } from "./actions";

type DriverRowProps = {
  driver: {
    id: string | number;
    name: string;
    phone: string | null;
    address: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    id_number: string | null;
    start_date: string | null;
    notes: string | null;
    status: string;
    badge_name: string | null;
    badge_color: string | null;
    badge_orders: number;
  };
  columns?: string[];
};

const initialState: DriverFormState = { message: "", success: false };

export function DriverRow({ driver, columns = ["phone","status"] }: DriverRowProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateDriver, initialState);

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
        title="Click to edit driver details"
      >
        <td className="px-4 py-4 font-medium text-emerald-300">{driver.name}</td>
        {columns.includes("badge")&&<td className="px-4 py-4">{driver.badge_name?<span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold" style={{color:driver.badge_color??"#94a3b8",borderColor:`${driver.badge_color??"#94a3b8"}66`,backgroundColor:`${driver.badge_color??"#94a3b8"}15`}}><span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor:driver.badge_color??"#94a3b8"}}/>{driver.badge_name}<span className="font-normal opacity-70">· {driver.badge_orders}</span></span>:<span className="text-sm text-slate-500">No scheme</span>}</td>}
        {columns.includes("phone")&&<td className="px-4 py-4 text-slate-300">{driver.phone || "—"}</td>}
        {columns.includes("id_number")&&<td className="px-4 py-4 text-slate-300">{driver.id_number || "—"}</td>}
        {columns.includes("start_date")&&<td className="px-4 py-4 text-slate-300">{driver.start_date || "—"}</td>}
        {columns.includes("address")&&<td className="max-w-[260px] truncate px-4 py-4 text-slate-300">{driver.address || "—"}</td>}
        {columns.includes("emergency")&&<td className="px-4 py-4 text-slate-300">{driver.emergency_contact_name || driver.emergency_contact_phone ? `${driver.emergency_contact_name??""}${driver.emergency_contact_name&&driver.emergency_contact_phone?" · ":""}${driver.emergency_contact_phone??""}` : "—"}</td>}
        {columns.includes("status")&&<td className="px-4 py-4">
          <span
            className={`rounded-full px-3 py-1 text-sm capitalize ${
              driver.status === "active"
                ? "bg-emerald-400/10 text-emerald-300"
                : "bg-slate-700 text-slate-300"
            }`}
          >
            {driver.status}
          </span>
        </td>}
      </tr>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="driver-dialog-title"
              className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-emerald-400">DRIVER DETAILS</p>
                  <h2 id="driver-dialog-title" className="mt-1 text-2xl font-bold text-slate-100">
                    {driver.name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  aria-label="Close driver details"
                >
                  ✕
                </button>
              </div>

              <form action={formAction} className="mt-6 space-y-4">
                <input type="hidden" name="id" value={driver.id} />

                <div>
                  <label htmlFor={`driver-name-${driver.id}`} className="mb-2 block text-sm font-medium text-slate-300">
                    Driver name
                  </label>
                  <input
                    id={`driver-name-${driver.id}`}
                    name="name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    defaultValue={driver.name}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label htmlFor={`driver-phone-${driver.id}`} className="mb-2 block text-sm font-medium text-slate-300">
                    Phone number
                  </label>
                  <input
                    id={`driver-phone-${driver.id}`}
                    name="phone"
                    type="tel"
                    maxLength={30}
                    defaultValue={driver.phone ?? ""}
                    placeholder="Example: 03 123 456"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-400"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`driver-id-${driver.id}`} className="mb-2 block text-sm font-medium text-slate-300">ID number</label>
                    <input
                      id={`driver-id-${driver.id}`}
                      name="id_number"
                      type="text"
                      maxLength={100}
                      defaultValue={driver.id_number ?? ""}
                      className="field"
                    />
                  </div>
                  <div>
                    <label htmlFor={`driver-start-${driver.id}`} className="mb-2 block text-sm font-medium text-slate-300">Start date</label>
                    <input
                      id={`driver-start-${driver.id}`}
                      name="start_date"
                      type="date"
                      defaultValue={driver.start_date ?? ""}
                      className="field"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={`driver-address-${driver.id}`} className="mb-2 block text-sm font-medium text-slate-300">Address</label>
                  <textarea
                    id={`driver-address-${driver.id}`}
                    name="address"
                    rows={2}
                    maxLength={1000}
                    defaultValue={driver.address ?? ""}
                    className="field resize-y"
                  />
                </div>

                <fieldset className="rounded-xl border border-slate-800 p-4">
                  <legend className="px-2 text-sm font-semibold text-slate-300">Emergency contact</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor={`emergency-name-${driver.id}`} className="mb-2 block text-sm font-medium text-slate-300">Name</label>
                      <input
                        id={`emergency-name-${driver.id}`}
                        name="emergency_contact_name"
                        type="text"
                        maxLength={1000}
                        defaultValue={driver.emergency_contact_name ?? ""}
                        className="field"
                      />
                    </div>
                    <div>
                      <label htmlFor={`emergency-phone-${driver.id}`} className="mb-2 block text-sm font-medium text-slate-300">Phone</label>
                      <input
                        id={`emergency-phone-${driver.id}`}
                        name="emergency_contact_phone"
                        type="tel"
                        maxLength={30}
                        defaultValue={driver.emergency_contact_phone ?? ""}
                        className="field"
                      />
                    </div>
                  </div>
                </fieldset>

                <div>
                  <label htmlFor={`driver-notes-${driver.id}`} className="mb-2 block text-sm font-medium text-slate-300">Notes</label>
                  <textarea
                    id={`driver-notes-${driver.id}`}
                    name="notes"
                    rows={3}
                    maxLength={1000}
                    defaultValue={driver.notes ?? ""}
                    className="field resize-y"
                  />
                </div>

                <div>
                  <label htmlFor={`driver-status-${driver.id}`} className="mb-2 block text-sm font-medium text-slate-300">
                    Status
                  </label>
                  <select
                    id={`driver-status-${driver.id}`}
                    name="status"
                    defaultValue={driver.status}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-400"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

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

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-300 hover:bg-slate-800"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-60"
                  >
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
