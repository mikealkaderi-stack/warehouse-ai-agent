"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { message: string };

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const allowedEmail = process.env.APP_ALLOWED_EMAIL?.trim().toLowerCase();

  if (!allowedEmail) {
    return { message: "The allowed login email has not been configured yet." };
  }
  if (!email || !password) return { message: "Enter your email and password." };
  if (email !== allowedEmail) return { message: "Invalid email or password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { message: "Invalid email or password." };

  const { data } = await supabase.auth.getClaims();
  const claimEmail = typeof data?.claims?.email === "string"
    ? data.claims.email.toLowerCase()
    : "";
  if (claimEmail !== allowedEmail) {
    await supabase.auth.signOut();
    return { message: "This account is not allowed to use the application." };
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
