import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime="nodejs";
const datePattern=/^\d{4}-\d{2}-\d{2}$/;

export async function POST(request:Request){
  const user=await getAuthenticatedUser();if(!user)return NextResponse.json({error:"Please sign in again."},{status:401});
  const apiKey=process.env.OPENAI_API_KEY?.trim();if(!apiKey)return NextResponse.json({error:"OPENAI_API_KEY is not configured."},{status:503});
  let body:{question?:string;from?:string;to?:string};try{body=await request.json()}catch{return NextResponse.json({error:"Invalid request."},{status:400})}
  const question=body.question?.trim()??"",from=body.from??"",to=body.to??"";
  if(question.length<3||question.length>1000||!datePattern.test(from)||!datePattern.test(to)||from>to)return NextResponse.json({error:"Enter a valid question and date range."},{status:400});
  const supabase=await createClient();
  const[trips,accounts,invoices,payments,expenses,payroll]=await Promise.all([
    supabase.from("trip_details").select("trip_number,trip_date,driver_name,region_name,assigned_orders,delivered_orders,undelivered_orders,total_payment_value,expected_cash,cash_handed,cash_difference,fuel_expense,other_expense,status").gte("trip_date",from).lte("trip_date",to).order("trip_date").limit(1000),
    supabase.from("account_balances").select("code,name,account_type,balance").order("code").limit(300),
    supabase.from("supplier_invoices").select("invoice_number,invoice_date,amount,status,suppliers(name)").gte("invoice_date",from).lte("invoice_date",to).limit(500),
    supabase.from("supplier_payments").select("payment_number,payment_date,amount,status,suppliers(name)").gte("payment_date",from).lte("payment_date",to).limit(500),
    supabase.from("expense_transactions").select("expense_date,description,amount,status,accounts(name)").gte("expense_date",from).lte("expense_date",to).limit(500),
    supabase.from("payroll_runs").select("payroll_number,period_start,period_end,status,payroll_items(worker_type,worker_name_snapshot,gross_pay,net_pay,commission_amount_snapshot)").gte("period_end",from).lte("period_start",to).limit(100),
  ]);
  const failed=[trips,accounts,invoices,payments,expenses,payroll].find(result=>result.error);if(failed?.error)return NextResponse.json({error:`Could not prepare the report: ${failed.error.message}`},{status:500});
  const snapshot={period:{from,to},trips:trips.data??[],account_balances:accounts.data??[],supplier_invoices:invoices.data??[],supplier_payments:payments.data??[],expenses:expenses.data??[],payroll_runs:payroll.data??[]};
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{authorization:`Bearer ${apiKey}`,"content-type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_MODEL?.trim()||"gpt-5.4-mini",store:false,max_output_tokens:1400,instructions:"You are the read-only SRT Logistics reporting assistant. Answer only from the supplied application snapshot. Never claim to create, edit, post, pay, void, or delete records. Clearly state the selected period. Use concise business language, show calculations when useful, and say when the data is insufficient. Currency amounts are USD unless the snapshot indicates otherwise.",input:`USER QUESTION:\n${question}\n\nSRT APPLICATION SNAPSHOT:\n${JSON.stringify(snapshot)}`})});
  const result=await response.json();if(!response.ok)return NextResponse.json({error:result?.error?.message||"OpenAI could not answer the question."},{status:502});
  const answer=(result.output??[]).flatMap((item:{content?:Array<{type?:string;text?:string}>})=>item.content??[]).filter((part:{type?:string})=>part.type==="output_text").map((part:{text?:string})=>part.text??"").join("\n").trim();
  return NextResponse.json({answer:answer||"No answer was returned."});
}
