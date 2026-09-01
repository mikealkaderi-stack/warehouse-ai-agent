"use client";

import { useActionState } from "react";
import { addVehicle, type VehicleFormState } from "./actions";

const initialState: VehicleFormState = { message: "", success: false };

export function VehicleForm() {
  const [state, formAction, pending] = useActionState(addVehicle, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="vehicle-name" className="mb-2 block text-sm font-medium text-slate-300">
          Vehicle name
        </label>
        <input
          id="vehicle-name"
          name="vehicle_name"
          type="text"
          required
          minLength={2}
          maxLength={100}
          autoComplete="off"
          placeholder="Example: Trafic 01"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
        />
      </div>

      <div>
        <label htmlFor="vehicle-type" className="mb-2 block text-sm font-medium text-slate-300">
          Vehicle type
        </label>
        <select
          id="vehicle-type"
          name="vehicle_type"
          required
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          defaultValue=""
        >
          <option value="" disabled>Select a type</option>
          <option value="van">Van</option>
          <option value="moto">Moto</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add vehicle"}
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
