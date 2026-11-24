import { NextResponse } from "next/server";
import { createSessionSupabaseClient } from "@/server/db/supabase-server";
import { createServiceRoleSupabaseClient } from "@/server/db/supabase-admin";
import { jsonApiError } from "@/server/http/responses";

/**
 * Candidate Self-Service Account & Data Deletion Endpoint (Blueprint Ch. 06 & Ch. 17).
 * Deletes the authenticated user's preferences, bookmarks, and profile under verified session.
 */
export async function DELETE() {
  const supabase = await createSessionSupabaseClient();
  if (!supabase) {
    return jsonApiError(401, "UNAUTHORIZED", "Sign in to delete your account data.");
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return jsonApiError(401, "UNAUTHORIZED", "Sign in to delete your account data.");
  }

  await supabase.from("bookmarks").delete().eq("user_id", user.id);
  await supabase.from("notification_preferences").delete().eq("user_id", user.id);
  await supabase.from("users").delete().eq("id", user.id);

  const adminClient = createServiceRoleSupabaseClient();
  if (adminClient) {
    await adminClient.auth.admin.deleteUser(user.id);
  }

  return NextResponse.json(
    { deleted: true, deleted_at_utc: new Date().toISOString() },
    { status: 200 }
  );
}
