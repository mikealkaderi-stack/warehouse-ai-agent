import { AppNav } from "@/components/app-nav";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateInTimeZone, formatCurrency, getAppSettings } from "@/lib/settings";
import { type EmployeeRecord } from "./employee-row";
import { EmployeeDirectory } from "./employee-directory";

export const dynamic = "force-dynamic";

export default async function Employees() {
  const settings = await getAppSettings();
  const supabase = await createAdminClient();
  const [positions, employeesResult, history] = await Promise.all([
    supabase.from("positions").select("id,name,is_active").order("name"),
    supabase.from("employees").select("id,employee_number,name,position_id,phone,address,emergency_contact_name,emergency_contact_phone,id_number,start_date,end_date,notes,status").order("name"),
    supabase.from("employee_salary_history").select("id,employee_id,monthly_salary,effective_from,effective_to").order("effective_from", { ascending: false }),
  ]);
  const today = dateInTimeZone(settings.timezone);
  const employees = employeesResult.data ?? [];
  const positionNames = new Map((positions.data ?? []).map((position) => [String(position.id), position.name]));
  const current = new Map((history.data ?? []).filter((item) => !item.effective_to || item.effective_to >= today).map((item) => [String(item.employee_id), item]));
  const error = positions.error || employeesResult.error || history.error;

  return <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100"><div className="mx-auto max-w-7xl">
    <AppNav current="/employees" />
    <h1 className="mt-8 text-4xl font-bold">Employees</h1>
    <p className="mt-3 text-slate-400">Non-driver staff and effective-dated fixed salaries. Drivers remain in Drivers.</p>
    {error && <p className="mt-6 rounded-xl bg-amber-400/10 p-4 text-amber-200">Apply migrations 006 and 007 first: {error.message}</p>}
    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6"><EmployeeDirectory today={today} positions={(positions.data??[]).map(position=>({id:position.id,name:position.name,is_active:position.is_active}))} items={employees.map(employee=>{const salary=current.get(String(employee.id));return{employee:employee as EmployeeRecord,positionName:positionNames.get(String(employee.position_id))??"Position not found",currentSalary:salary?formatCurrency(Number(salary.monthly_salary),settings.currency_code):"Not set"}})}/></section>
  </div></main>;
}
