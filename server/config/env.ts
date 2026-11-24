import "server-only";

export interface PublicSupabaseConfig {
  url: string;
  anonKey: string;
}

export interface AdminSupabaseConfig extends PublicSupabaseConfig {
  serviceRoleKey: string;
}

/**
 * Returns public Supabase configuration if present, without ever logging secrets.
 */
export function getPublicSupabaseConfig(): PublicSupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    return null;
  }
  return { url, anonKey };
}

/**
 * Returns server-only Supabase service-role configuration.
 * Never call or expose in client components, logs, or error payloads.
 */
export function getAdminSupabaseConfig(): AdminSupabaseConfig | null {
  if (typeof window !== "undefined") {
    throw new Error("Admin Supabase config is strictly server-only");
  }
  const base = getPublicSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!base || !serviceRoleKey) {
    return null;
  }
  return { ...base, serviceRoleKey };
}

export function isSupabaseConfigured(): boolean {
  return getPublicSupabaseConfig() !== null;
}
