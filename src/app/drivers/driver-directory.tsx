"use client";

import {useEffect,useState} from "react";
import {createPortal} from "react-dom";
import {DriverForm} from "./driver-form";
import {DriverRow} from "./driver-row";

type Driver={id:string|number;name:string;phone:string|null;address:string|null;emergency_contact_name:string|null;emergency_contact_phone:string|null;id_number:string|null;start_date:string|null;notes:string|null;status:string;badge_name:string|null;badge_color:string|null;badge_orders:number};
const options=[{key:"badge",label:"Current badge"},{key:"phone",label:"Phone"},{key:"id_number",label:"ID number"},{key:"start_date",label:"Start date"},{key:"address",label:"Address"},{key:"emergency",label:"Emergency contact"},{key:"status",label:"Status"}];

export function DriverDirectory({drivers,total}:{drivers:Driver[];total:number}){
  const[addOpen,setAddOpen]=useState(false);const[columns,setColumns]=useState(["badge","phone","status"]);
  useEffect(()=>{const timer=window.setTimeout(()=>{try{const saved=localStorage.getItem("srt-driver-columns");if(saved){const parsed=JSON.parse(saved) as string[];setColumns(parsed.includes("badge")?parsed:["badge",...parsed])}}catch{}},0);return()=>window.clearTimeout(timer)},[]);
  const toggle=(key:string)=>setColumns(current=>{const next=current.includes(key)?current.filter(item=>item!==key):[...current,key];localStorage.setItem("srt-driver-columns",JSON.stringify(next));return next});
  return <>
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">Drivers</h2><p className="mt-1 text-sm text-slate-400">{total} matching · Click a row to view or edit</p></div><div className="flex gap-2"><details className="relative"><summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800">⚙ Columns</summary><div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl">{options.map(option=><label key={option.key} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"><input type="checkbox" checked={columns.includes(option.key)} onChange={()=>toggle(option.key)} className="accent-red-500"/>{option.label}</label>)}</div></details><button onClick={()=>setAddOpen(true)} className="rounded-xl bg-emerald-400 px-5 py-2.5 font-semibold text-white hover:bg-emerald-300">+ Add driver</button></div></div>
    {drivers.length===0?<div className="mt-5 rounded-xl border border-dashed border-slate-700 p-10 text-center text-slate-400">No drivers match the current filters.</div>:<div className="mt-5 overflow-x-auto rounded-xl border border-slate-800"><table className="w-full min-w-[720px] text-left"><thead className="bg-slate-950 text-sm text-slate-400"><tr><th className="px-4 py-3 font-medium">Name</th>{options.filter(option=>columns.includes(option.key)).map(option=><th key={option.key} className="px-4 py-3 font-medium">{option.label}</th>)}</tr></thead><tbody className="divide-y divide-slate-800">{drivers.map(driver=><DriverRow key={driver.id} driver={driver} columns={columns}/>)}</tbody></table></div>}
    {addOpen&&createPortal(<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onMouseDown={event=>{if(event.target===event.currentTarget)setAddOpen(false)}}><section role="dialog" aria-modal="true" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-emerald-400">NEW DRIVER</p><h2 className="mt-1 text-2xl font-bold">Add driver</h2></div><button onClick={()=>setAddOpen(false)} className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-800" aria-label="Close">✕</button></div><DriverForm onCancel={()=>setAddOpen(false)}/></section></div>,document.body)}
  </>;
}
