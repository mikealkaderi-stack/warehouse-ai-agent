"use client";

import { useActionState } from "react";
import { addRegion, type RegionFormState } from "./actions";

const initialState: RegionFormState = { message: "", success: false };

export function RegionForm() {
  const [state, formAction, pending] = useActionState(addRegion, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-300">
          Region name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={100}
          autoComplete="off"
          placeholder="Example: Beirut"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add region"}
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
