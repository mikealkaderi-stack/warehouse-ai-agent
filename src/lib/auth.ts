import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthenticatedUser = {
  id: string;
  email: string;
};

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const allowedEmail = process.env.APP_ALLOWED_EMAIL?.trim().toLowerCase();
  if (!allowedEmail) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const id = typeof claims?.sub === "string" ? claims.sub : "";
  const email = typeof claims?.email === "string" ? claims.email.toLowerCase() : "";

  if (error || !id || email !== allowedEmail) return null;
  return { id, email };
}

export async function requireUser() {
  const allowedEmail = process.env.APP_ALLOWED_EMAIL?.trim();
  if (!allowedEmail) {
    throw new Error("APP_ALLOWED_EMAIL is not configured on the server.");
  }

  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  return user;
}
