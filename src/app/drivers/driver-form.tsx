"use client";

import { useActionState } from "react";
import { addDriver, type DriverFormState } from "./actions";

const initialState: DriverFormState = { message: "", success: false };

export function DriverForm({onCancel}:{onCancel?:()=>void}) {
  const [state, formAction, pending] = useActionState(addDriver, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-300">
          Driver name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={100}
          autoComplete="off"
          placeholder="Example: Ali Hassan"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Phone"><input className="field" name="phone" type="tel" maxLength={30}/></Field><Field label="ID number"><input className="field" name="id_number" maxLength={100}/></Field></div>
      <Field label="Start date"><input className="field" name="start_date" type="date"/></Field>
      <Field label="Address"><textarea className="field resize-y" name="address" rows={2}/></Field>
      <fieldset className="rounded-xl border border-slate-800 p-4"><legend className="px-2 text-sm font-semibold text-slate-300">Emergency contact</legend><div className="grid gap-4 sm:grid-cols-2"><Field label="Name"><input className="field" name="emergency_contact_name"/></Field><Field label="Phone"><input className="field" name="emergency_contact_phone" type="tel" maxLength={30}/></Field></div></fieldset>
      <Field label="Notes"><textarea className="field resize-y" name="notes" rows={3}/></Field>

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
      <div className="flex justify-end gap-3 pt-2">{onCancel&&<button type="button" onClick={onCancel} className="rounded-xl border border-slate-700 px-5 py-3 text-slate-300">Cancel</button>}<button type="submit" disabled={pending} className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-white transition hover:bg-emerald-300 disabled:opacity-60">{pending ? "Adding…" : "Save driver"}</button></div>
    </form>
  );
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block text-sm font-medium text-slate-300">{label}<div className="mt-2">{children}</div></label>}
