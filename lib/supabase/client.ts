"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

let browserClient: SupabaseClient<Database> | null = null;

export function createBrowserSupabaseClient() {
  const { url, anonKey } = getSupabasePublicConfig();

  if (!browserClient) {
    browserClient = createClient<Database>(url, anonKey);
  }

  return browserClient;
}
