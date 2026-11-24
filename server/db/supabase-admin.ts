import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabaseConfig } from "@/server/config/env";

/**
 * Strictly server-only Supabase service-role client.
 * Bypasses RLS — MUST ONLY be called after server-side admin RBAC verification
 * or authenticated worker/cron signature verification (Blueprint Ch. 07).
 */
export function createServiceRoleSupabaseClient(): SupabaseClient | null {
  if (typeof window !== "undefined") {
    throw new Error("Service-role Supabase client cannot run in the browser");
  }
  const config = getAdminSupabaseConfig();
  if (!config) {
    return null;
  }
  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
