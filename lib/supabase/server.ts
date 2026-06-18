import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseAdminConfig, getSupabasePublicConfig } from "@/lib/supabase/env";

const serverClientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
};

export function createServerSupabaseClient() {
  const { url, anonKey } = getSupabasePublicConfig();

  return createClient<Database>(url, anonKey, serverClientOptions);
}

export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = getSupabaseAdminConfig();

  return createClient<Database>(url, serviceRoleKey, serverClientOptions);
}
