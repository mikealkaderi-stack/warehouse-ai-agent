"use server";
import { revalidatePath } from "next/cache"; import { createAdminClient } from "@/lib/supabase/admin";
export type EmployeeState={success:boolean;message:string}; const fail=(message:string)=>({success:false,message}); const val=(d:FormData,n:string)=>String(d.get(n)??"").trim();
export async function addPosition(_:EmployeeState,d:FormData):Promise<EmployeeState>{const name=val(d,"name");if(name.length<2)return fail("Enter a position name.");const{error}=await(await createAdminClient()).from("positions").insert({name});if(error)return fail(error.message);revalidatePath("/employees");return{success:true,message:`${name} position added.`}}
export async function addEmployee(_:EmployeeState,d:FormData):Promise<EmployeeState>{const name=val(d,"name"),position_id=val(d,"position_id"),salary=Number(val(d,"monthly_salary")),effective_from=val(d,"effective_from");if(name.length<2||!position_id||!Number.isFinite(salary)||salary<0||!/^\d{4}-\d{2}-\d{2}$/.test(effective_from))return fail("Enter the employee, position, salary, and effective date.");const s=await createAdminClient();const{data:e,error}=await s.from("employees").insert({name,position_id,phone:val(d,"phone")||null,start_date:effective_from,status:"active"}).select("id").single();if(error||!e)return fail(error?.message??"Could not add employee.");const{error:pay}=await s.from("employee_salary_history").insert({employee_id:e.id,monthly_salary:salary,effective_from,reason:"Initial salary"});if(pay){await s.from("employees").delete().eq("id",e.id);return fail(pay.message)}revalidatePath("/employees");return{success:true,message:`${name} and the initial salary were added.`}}
export async function addEmployeeSalary(_:EmployeeState,d:FormData):Promise<EmployeeState>{const employee_id=val(d,"employee_id"),salary=Number(val(d,"monthly_salary")),from=val(d,"effective_from"),reason=val(d,"reason");if(!employee_id||!Number.isFinite(salary)||salary<0||!/^\d{4}-\d{2}-\d{2}$/.test(from))return fail("Enter a valid salary and effective date.");const s=await createAdminClient();const{data:current}=await s.from("employee_salary_history").select("id,effective_from").eq("employee_id",employee_id).is("effective_to",null).lt("effective_from",from).order("effective_from",{ascending:false}).limit(1).maybeSingle();if(current){const to=new Date(`${from}T00:00:00Z`);to.setUTCDate(to.getUTCDate()-1);const{error}=await s.from("employee_salary_history").update({effective_to:to.toISOString().slice(0,10)}).eq("id",current.id);if(error)return fail(error.message)}const{error}=await s.from("employee_salary_history").insert({employee_id,monthly_salary:salary,effective_from:from,reason:reason||null});if(error)return fail(error.message);revalidatePath("/employees");return{success:true,message:"New salary added without overwriting history."}}

export async function updateEmployee(_:EmployeeState,d:FormData):Promise<EmployeeState>{
  const id=val(d,"id"),name=val(d,"name"),position_id=val(d,"position_id"),status=val(d,"status");
  const start_date=val(d,"start_date"),end_date=val(d,"end_date");
  if(!id||name.length<2||name.length>100||!position_id)return fail("Enter a valid employee name and position.");
  if(!["active","inactive"].includes(status))return fail("Select a valid employee status.");
  if([start_date,end_date].some(value=>value&&!/^\d{4}-\d{2}-\d{2}$/.test(value)))return fail("Select valid employment dates.");
  if(start_date&&end_date&&end_date<start_date)return fail("End date cannot be before the start date.");
  const phone=val(d,"phone"),emergency_phone=val(d,"emergency_contact_phone"),id_number=val(d,"id_number"),employee_number=val(d,"employee_number");
  if(phone.length>30||emergency_phone.length>30||id_number.length>100||employee_number.length>100)return fail("A phone, ID, or employee number is too long.");
  const address=val(d,"address"),emergency_name=val(d,"emergency_contact_name"),notes=val(d,"notes");
  if([address,emergency_name,notes].some(value=>value.length>1000))return fail("One of the employee details is too long.");
  const {error}=await(await createAdminClient()).from("employees").update({
    employee_number:employee_number||null,name,position_id,phone:phone||null,address:address||null,
    emergency_contact_name:emergency_name||null,emergency_contact_phone:emergency_phone||null,
    id_number:id_number||null,start_date:start_date||null,end_date:end_date||null,notes:notes||null,status,
    updated_at:new Date().toISOString(),
  }).eq("id",id);
  if(error)return fail(error.code==="23505"?"That employee number or ID is already in use.":error.message);
  revalidatePath("/employees");return{success:true,message:"Employee details saved."};
}
