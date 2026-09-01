"use client";
export function VoidButton({label="Void and reverse"}:{label?:string}){return <button type="submit" onClick={event=>{if(!window.confirm("This posted document will be voided and a reversing journal will be created. Continue?"))event.preventDefault()}} className="rounded-xl border border-red-400/40 bg-red-400/10 px-5 py-3 font-semibold text-red-200">{label}</button>}
