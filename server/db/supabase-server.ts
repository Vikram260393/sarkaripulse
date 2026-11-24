import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "@/server/config/env";

/**
 * Cookie-aware Supabase SSR client bound to the authenticated user's session
 * and enforced by PostgreSQL RLS (`auth.uid()`).
 */
export async function createSessionSupabaseClient(): Promise<SupabaseClient | null> {
  const config = getPublicSupabaseConfig();
  if (!config) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot mutate cookies during render; route handlers/middleware do.
        }
      },
    },
  });
}
