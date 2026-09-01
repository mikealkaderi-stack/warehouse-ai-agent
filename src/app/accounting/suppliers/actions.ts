"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
export type SupplierState={success:boolean;message:string};
const value=(data:FormData,name:string)=>String(data.get(name)??"").trim();
const fail=(message:string):SupplierState=>({success:false,message});

export async function postInvoice(_:SupplierState,data:FormData):Promise<SupplierState>{
  const supplier=value(data,"supplier_id"),number=value(data,"invoice_number"),date=value(data,"invoice_date"),account=value(data,"expense_account_id"),payable=value(data,"payable_account_id"),amount=Number(value(data,"amount")),description=value(data,"description");
  if(!supplier||!number||!account||!payable||!description||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(amount)||amount<=0)return fail("Complete all invoice fields with a positive amount.");
  const{error}=await(await createAdminClient()).rpc("post_supplier_invoice",{supplier_id:supplier,invoice_number:number,invoice_date:date,expense_account_id:account,payable_account_id:payable,invoice_amount:amount,invoice_description:description,invoice_reference:value(data,"reference")||null});
  if(error)return fail(error.message);revalidatePath("/accounting/suppliers");revalidatePath("/accounting/invoices");revalidatePath("/accounting/expenses");revalidatePath("/accounting");revalidatePath("/accounting/ledger");return{success:true,message:`Invoice ${number} was posted.`};
}
export async function postPayment(_:SupplierState,data:FormData):Promise<SupplierState>{
  const supplier=value(data,"supplier_id"),date=value(data,"payment_date"),cash=value(data,"cash_account_id"),amount=Number(value(data,"amount"));
  if(!supplier||!cash||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(amount)||amount<=0)return fail("Complete all payment fields with a positive amount.");
  const{error}=await(await createAdminClient()).rpc("post_supplier_payment",{supplier_id:supplier,payment_date:date,cash_account_id:cash,payment_amount:amount,payment_method:value(data,"payment_method")||"cash",payment_reference:value(data,"reference")||null,payment_notes:value(data,"notes")||null});
  if(error)return fail(error.message);revalidatePath("/accounting/suppliers");revalidatePath("/accounting/payments");revalidatePath("/accounting");revalidatePath("/accounting/ledger");return{success:true,message:"Supplier payment was posted."};
}

export async function updateDraftInvoice(_:SupplierState,data:FormData):Promise<SupplierState>{
  const id=value(data,"id"),supplier=value(data,"supplier_id"),number=value(data,"invoice_number"),date=value(data,"invoice_date"),account=value(data,"expense_account_id"),payable=value(data,"payable_account_id"),amount=Number(value(data,"amount")),description=value(data,"description");
  if(!id||!supplier||!number||!account||!payable||!description||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(amount)||amount<=0)return fail("Complete all invoice fields with a positive amount.");
  const s=await createAdminClient();const{data:invoice,error:readError}=await s.from("supplier_invoices").select("status").eq("id",id).single();
  if(readError)return fail(readError.message);if(invoice.status!=="draft")return fail("Posted invoices are locked. Create a reversal or correction instead.");
  const{error}=await s.from("supplier_invoices").update({supplier_id:supplier,invoice_number:number,invoice_date:date,expense_account_id:account,payable_account_id:payable,amount,description,reference:value(data,"reference")||null,updated_at:new Date().toISOString()}).eq("id",id).eq("status","draft");
  if(error)return fail(error.message);revalidatePath("/accounting/invoices");return{success:true,message:"Draft invoice saved."};
}

export async function saveSupplier(_:SupplierState,data:FormData):Promise<SupplierState>{
  const id=value(data,"id"),code=value(data,"code").toUpperCase(),name=value(data,"name"),payable=value(data,"payable_account_id"),expense=value(data,"default_expense_account_id");
  if(!code||!name||!payable||!expense)return fail("Complete the supplier name, code, payable account, and expense account.");
  const s=await createAdminClient();
  const [payableCheck,expenseCheck]=await Promise.all([s.from("accounts").select("id").eq("id",payable).eq("account_type","liability").eq("is_active",true).maybeSingle(),s.from("accounts").select("id").eq("id",expense).eq("account_type","expense").eq("is_active",true).maybeSingle()]);
  if(!payableCheck.data||!expenseCheck.data)return fail("Choose an active liability account and an active expense account.");
  const payload={code,name,payable_account_id:payable,default_expense_account_id:expense,phone:value(data,"phone")||null,email:value(data,"email")||null,notes:value(data,"notes")||null,is_active:value(data,"is_active")!=="false",updated_at:new Date().toISOString()};
  const result=id?await s.from("suppliers").update(payload).eq("id",id):await s.from("suppliers").insert(payload);
  if(result.error)return fail(result.error.code==="23505"?"That supplier code or name already exists.":result.error.message);
  revalidatePath("/accounting/suppliers");revalidatePath("/accounting/invoices");revalidatePath("/accounting/payments");revalidatePath("/accounting/accounts");
  return{success:true,message:id?"Supplier updated.":"Supplier created."};
}

export async function voidInvoice(data:FormData){
  const id=value(data,"id"),date=value(data,"void_date");if(!id||!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error("Invoice and reversal date are required.");
  const{error}=await(await createAdminClient()).rpc("void_supplier_invoice",{target_invoice_id:id,void_date:date});if(error)throw new Error(error.message);
  revalidatePath("/accounting/invoices");revalidatePath("/accounting/suppliers");revalidatePath("/accounting/expenses");revalidatePath("/accounting/ledger");revalidatePath("/accounting/accounts");
}

export async function voidPayment(data:FormData){
  const id=value(data,"id"),date=value(data,"void_date");if(!id||!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error("Payment and reversal date are required.");
  const{error}=await(await createAdminClient()).rpc("void_supplier_payment",{target_payment_id:id,void_date:date});if(error)throw new Error(error.message);
  revalidatePath("/accounting/payments");revalidatePath("/accounting/suppliers");revalidatePath("/accounting/ledger");revalidatePath("/accounting/accounts");
}
