import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "@/server/config/env";

/**
 * Anon-key Supabase client strictly bound by Row-Level Security (RLS).
 * Public reads only return records explicitly marked published & public-safe.
 */
export function createPublicSupabaseClient(): SupabaseClient | null {
  const config = getPublicSupabaseConfig();
  if (!config) {
    return null;
  }
  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
