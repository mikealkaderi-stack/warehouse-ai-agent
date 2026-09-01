"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
export type CState={success:boolean;message:string};
const f=(message:string)=>({success:false,message});
const v=(d:FormData,n:string)=>String(d.get(n)??"").trim();
export async function addSchemeVersion(_:CState,d:FormData):Promise<CState>{
  const name=v(d,"name"),from=v(d,"effective_from");
  if(name.length<2||!/^\d{4}-\d{2}-\d{2}$/.test(from))return f("Enter a scheme name and effective date.");
  const names=d.getAll("badge_name").map(String),colors=d.getAll("badge_color").map(String),minimums=d.getAll("minimum_orders").map(String),maximums=d.getAll("maximum_orders").map(String),rates=d.getAll("rate_per_order").map(String);
  const tiers=names.map((badge_name,i)=>({badge_name:badge_name.trim(),badge_color:colors[i]||"#94a3b8",minimum_orders:Number(minimums[i]),maximum_orders:maximums[i]===""?null:Number(maximums[i]),rate_per_order:Number(rates[i])}));
  if(!tiers.length||tiers.some(x=>x.badge_name.length<2||!/^#[0-9a-f]{6}$/i.test(x.badge_color)||!Number.isInteger(x.minimum_orders)||x.minimum_orders<0||(x.maximum_orders!==null&&(!Number.isInteger(x.maximum_orders)||x.maximum_orders<x.minimum_orders))||!Number.isFinite(x.rate_per_order)||x.rate_per_order<0))return f("Complete every badge with a name, color, valid range, and commission rate.");
  tiers.sort((a,b)=>a.minimum_orders-b.minimum_orders);
  if(tiers[0].minimum_orders!==0||tiers.at(-1)?.maximum_orders!==null||tiers.some((x,i)=>i>0&&x.minimum_orders!==Number(tiers[i-1].maximum_orders)+1))return f("Tiers must start at 0, be continuous, and end with +.");
  const s=await createAdminClient();let{data:scheme,error}=await s.from("commission_schemes").select("id").eq("name",name).maybeSingle();
  if(error)return f(error.message);if(!scheme){const r=await s.from("commission_schemes").insert({name}).select("id").single();scheme=r.data;error=r.error}
  if(error||!scheme)return f(error?.message??"Could not create scheme.");
  const{data:last}=await s.from("commission_scheme_versions").select("id,version_number,effective_from,effective_to").eq("commission_scheme_id",scheme.id).order("version_number",{ascending:false}).limit(1).maybeSingle();
  if(last&&!last.effective_to&&last.effective_from<from){const dt=new Date(`${from}T00:00:00Z`);dt.setUTCDate(dt.getUTCDate()-1);const{error:close}=await s.from("commission_scheme_versions").update({effective_to:dt.toISOString().slice(0,10)}).eq("id",last.id);if(close)return f(close.message)}
  const{data:version,error:ve}=await s.from("commission_scheme_versions").insert({commission_scheme_id:scheme.id,version_number:(last?.version_number??0)+1,effective_from:from,notes:v(d,"notes")||null}).select("id").single();
  if(ve||!version)return f(ve?.message??"Could not create version.");
  const{error:te}=await s.from("commission_tiers").insert(tiers.map(x=>({...x,commission_scheme_version_id:version.id})));if(te)return f(te.message);
  revalidatePath("/payroll/commission");return{success:true,message:`${name} version ${(last?.version_number??0)+1} created. Earlier versions remain unchanged.`}
}
export async function addDriverCompensation(_:CState,d:FormData):Promise<CState>{
  const driver=v(d,"driver_id"),salary=Number(v(d,"monthly_salary")),scheme=v(d,"commission_scheme_id"),from=v(d,"effective_from");
  if(!driver||!Number.isFinite(salary)||salary<0||!/^\d{4}-\d{2}-\d{2}$/.test(from))return f("Complete the driver compensation fields.");
  const s=await createAdminClient();const{data:current}=await s.from("driver_compensation_history").select("id,effective_from").eq("driver_id",driver).is("effective_to",null).lt("effective_from",from).order("effective_from",{ascending:false}).limit(1).maybeSingle();
  if(current){const dt=new Date(`${from}T00:00:00Z`);dt.setUTCDate(dt.getUTCDate()-1);const{error}=await s.from("driver_compensation_history").update({effective_to:dt.toISOString().slice(0,10)}).eq("id",current.id);if(error)return f(error.message)}
  const{error}=await s.from("driver_compensation_history").insert({driver_id:driver,monthly_salary:salary,commission_scheme_id:scheme||null,effective_from:from,reason:v(d,"reason")||null});if(error)return f(error.message);
  revalidatePath("/payroll/commission");revalidatePath("/drivers");return{success:true,message:"Driver compensation added without overwriting history."}
}
