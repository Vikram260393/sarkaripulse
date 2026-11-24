import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/server/auth/rbac";
import { createServiceRoleSupabaseClient } from "@/server/db/supabase-admin";
import { jsonApiError } from "@/server/http/responses";

/**
 * Protected Admin System Controls endpoint (Blueprint Ch. 07, 18, 32).
 * Enforces server-side RBAC against `public.admin_roles` — never trusts browser headers.
 */
export async function GET() {
  const auth = await requireAdminPermission("view_reports");
  if (!auth.ok) {
    return jsonApiError(auth.status, auth.code, auth.message);
  }

  const adminClient = createServiceRoleSupabaseClient();
  if (!adminClient) {
    return jsonApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Admin database connection is not configured."
    );
  }

  const { data, error } = await adminClient
    .from("system_controls")
    .select(
      "pause_source_fetching, pause_ai_generation, pause_translation, pause_pdf_creation, pause_publishing, updated_reason, updated_at"
    )
    .eq("id", 1)
    .single();

  if (error || !data) {
    return jsonApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Unable to read system controls."
    );
  }

  return NextResponse.json(
    {
      actor_role: auth.principal.role,
      controls: data,
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
