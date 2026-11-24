import { NextResponse } from "next/server";
import { createSessionSupabaseClient } from "@/server/db/supabase-server";
import { jsonApiError } from "@/server/http/responses";

/**
 * Candidate user-data export endpoint (Blueprint Ch. 06 & Ch. 17).
 * Strictly scoped to auth.uid() under RLS.
 */
export async function GET() {
  const supabase = await createSessionSupabaseClient();
  if (!supabase) {
    return jsonApiError(401, "UNAUTHORIZED", "Sign in to export your data.");
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return jsonApiError(401, "UNAUTHORIZED", "Sign in to export your data.");
  }

  const [profileRes, bookmarksRes, prefsRes] = await Promise.all([
    supabase
      .from("users")
      .select("id, display_name, preferred_language, consent_recorded_at, created_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("bookmarks")
      .select("id, recruitment_id, saved_search_query, notify_on_update, created_at")
      .eq("user_id", user.id),
    supabase
      .from("notification_preferences")
      .select("channel, states, qualifications, categories, frequency, is_subscribed, consent_timestamp")
      .eq("user_id", user.id),
  ]);

  return NextResponse.json(
    {
      exported_at_utc: new Date().toISOString(),
      account: {
        id: user.id,
        email: user.email ?? null,
        profile: profileRes.data ?? null,
      },
      bookmarks: bookmarksRes.data ?? [],
      notification_preferences: prefsRes.data ?? [],
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
