"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type AccountingState = { success: boolean; message: string };

const fail = (message: string): AccountingState => ({ success: false, message });
const ok = (message: string): AccountingState => ({ success: true, message });
const text = (data: FormData, name: string) => String(data.get(name) ?? "").trim();
const amount = (data: FormData, name: string) => Number(text(data, name));

export async function addAccount(_: AccountingState, data: FormData): Promise<AccountingState> {
  const code = text(data, "code"); const name = text(data, "name");
  const account_type = text(data, "account_type");
  if (!code || !name) return fail("Enter an account code and name.");
  if (!["asset","liability","equity","revenue","expense"].includes(account_type)) return fail("Select a valid account type.");
  const normal_balance = ["asset","expense"].includes(account_type) ? "debit" : "credit";
  const { error } = await (await createAdminClient()).from("accounts").insert({ code, name, account_type, normal_balance });
  if (error) return fail(error.code === "23505" ? "That account code already exists." : error.message);
  revalidatePath("/accounting"); revalidatePath("/accounting/accounts");
  return ok(`${code} — ${name} was added.`);
}

export async function createOpeningBalances(_: AccountingState, data: FormData): Promise<AccountingState> {
  const openingDate = text(data, "opening_date");
  const values = [amount(data,"cash_amount"),amount(data,"mgt_payable"),amount(data,"arcome_payable")];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(openingDate) || values.some(v => !Number.isFinite(v) || v < 0)) return fail("Enter a date and non-negative balances.");
  const { error } = await (await createAdminClient()).rpc("create_opening_balances", { opening_date: openingDate, cash_amount: values[0], mgt_payable: values[1], arcome_payable: values[2] });
  if (error) return fail(error.message);
  revalidatePath("/accounting"); revalidatePath("/accounting/ledger");
  return ok("Opening balances were posted successfully.");
}

export async function addManualJournal(_: AccountingState, data: FormData): Promise<AccountingState> {
  const entryDate=text(data,"entry_date"), description=text(data,"description"), debitAccount=text(data,"debit_account_id"), creditAccount=text(data,"credit_account_id"), value=amount(data,"amount");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate) || !description || !debitAccount || !creditAccount || debitAccount===creditAccount || !Number.isFinite(value) || value<=0) return fail("Complete the journal with two different accounts and a positive amount.");
  const supabase=await createAdminClient();
  const number=`JE-MAN-${Date.now()}`;
  const { data:entry,error }=await supabase.from("journal_entries").insert({entry_number:number,entry_date:entryDate,description,reference:text(data,"reference")||null,source_type:"manual"}).select("id").single();
  if(error||!entry) return fail(error?.message??"Could not create journal.");
  const {error:lineError}=await supabase.from("journal_lines").insert([
    {journal_entry_id:entry.id,line_number:1,account_id:debitAccount,debit:value,credit:0},
    {journal_entry_id:entry.id,line_number:2,account_id:creditAccount,debit:0,credit:value},
  ]);
  if(lineError) { await supabase.from("journal_entries").delete().eq("id",entry.id); return fail(lineError.message); }
  const {error:postError}=await supabase.rpc("post_journal",{entry_id:entry.id});
  if(postError) return fail(postError.message);
  revalidatePath("/accounting"); revalidatePath("/accounting/ledger");
  return ok(`${number} was balanced and posted.`);
}

export async function addExpense(_: AccountingState, data: FormData): Promise<AccountingState> {
  const expenseDate=text(data,"expense_date"), description=text(data,"description"), expenseAccount=text(data,"expense_account_id"), paidFrom=text(data,"paid_from_account_id"), value=amount(data,"amount");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)||!description||!expenseAccount||!paidFrom||!Number.isFinite(value)||value<=0) return fail("Complete all expense fields with a positive amount.");
  const supabase=await createAdminClient(); const number=`EXP-${Date.now()}`; const journal=`JE-EXP-${Date.now()}`;
  const {data:entry,error}=await supabase.from("journal_entries").insert({entry_number:journal,entry_date:expenseDate,description,source_type:"expense",source_id:number}).select("id").single();
  if(error||!entry)return fail(error?.message??"Could not create expense journal.");
  const {error:lines}=await supabase.from("journal_lines").insert([{journal_entry_id:entry.id,line_number:1,account_id:expenseAccount,debit:value,credit:0},{journal_entry_id:entry.id,line_number:2,account_id:paidFrom,debit:0,credit:value}]);
  if(lines)return fail(lines.message);
  const {error:post}=await supabase.rpc("post_journal",{entry_id:entry.id}); if(post)return fail(post.message);
  const {error:expense}=await supabase.from("expense_transactions").insert({expense_number:number,expense_date:expenseDate,expense_account_id:expenseAccount,paid_from_account_id:paidFrom,amount:value,description,reference:text(data,"reference")||null,status:"posted",journal_entry_id:entry.id});
  if(expense)return fail(expense.message);
  revalidatePath("/accounting"); revalidatePath("/accounting/expenses"); revalidatePath("/accounting/ledger");
  return ok(`${number} was recorded and posted.`);
}

