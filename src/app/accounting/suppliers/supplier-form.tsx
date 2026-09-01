"use client";
import { useActionState } from "react";
import { saveSupplier, type SupplierState } from "./actions";
type Account={id:string|number;code:string;name:string};
type Supplier={id?:string|number;code?:string;name?:string;payable_account_id?:string|number;default_expense_account_id?:string|number;phone?:string|null;email?:string|null;notes?:string|null;is_active?:boolean};
const initial:SupplierState={success:false,message:""};
export function SupplierForm({supplier={},payables,expenses}:{supplier?:Supplier;payables:Account[];expenses:Account[]}){
  const[state,action,pending]=useActionState(saveSupplier,initial);
  return <form action={action} className="mt-5 grid gap-4 sm:grid-cols-2">
    {supplier.id&&<input type="hidden" name="id" value={supplier.id}/>}<label className="text-sm text-slate-300">Supplier code<input className="field mt-2" name="code" defaultValue={supplier.code??""} placeholder="Example: MGT" required/></label><label className="text-sm text-slate-300">Supplier name<input className="field mt-2" name="name" defaultValue={supplier.name??""} required/></label>
    <label className="text-sm text-slate-300">Payable account<select className="field mt-2" name="payable_account_id" defaultValue={supplier.payable_account_id??""} required><option value="" disabled>Select liability account</option>{payables.map(x=><option key={x.id} value={x.id}>{x.code} — {x.name}</option>)}</select></label>
    <label className="text-sm text-slate-300">Default expense account<select className="field mt-2" name="default_expense_account_id" defaultValue={supplier.default_expense_account_id??""} required><option value="" disabled>Select expense account</option>{expenses.map(x=><option key={x.id} value={x.id}>{x.code} — {x.name}</option>)}</select></label>
    <label className="text-sm text-slate-300">Phone<input className="field mt-2" name="phone" defaultValue={supplier.phone??""}/></label><label className="text-sm text-slate-300">Email<input className="field mt-2" name="email" type="email" defaultValue={supplier.email??""}/></label>
    <label className="text-sm text-slate-300 sm:col-span-2">Notes<textarea className="field mt-2" name="notes" rows={3} defaultValue={supplier.notes??""}/></label>{supplier.id&&<label className="text-sm text-slate-300">Status<select className="field mt-2" name="is_active" defaultValue={supplier.is_active===false?"false":"true"}><option value="true">Active</option><option value="false">Inactive</option></select></label>}
    {state.message&&<p className={`sm:col-span-2 rounded-xl p-3 text-sm ${state.success?"bg-emerald-400/10 text-emerald-300":"bg-red-400/10 text-red-200"}`}>{state.message}</p>}
    <button disabled={pending||!payables.length||!expenses.length} className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50">{pending?"Saving…":supplier.id?"Save supplier":"Create supplier"}</button>
  </form>;
}
