import "server-only";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createAdminClient() {
  await requireUser();
  return createClient();
}
