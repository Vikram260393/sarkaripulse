import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminPermission } from "@/server/auth/rbac";
import { createServiceRoleSupabaseClient } from "@/server/db/supabase-admin";
import { createCorrelationId, jsonApiError } from "@/server/http/responses";

const ToggleKillSwitchSchema = z.object({
  pause_source_fetching: z.boolean().optional(),
  pause_ai_generation: z.boolean().optional(),
  pause_translation: z.boolean().optional(),
  pause_pdf_creation: z.boolean().optional(),
  pause_publishing: z.boolean().optional(),
  reason: z.string().trim().min(5).max(500),
});

/**
 * Protected Emergency Kill-Switch Controller (Blueprint Ch. 11, 18, 33).
 * Restricted strictly to `super_admin` (`toggle_kill_switch`) with mandatory audit reason.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminPermission("toggle_kill_switch");
  if (!auth.ok) {
    return jsonApiError(auth.status, auth.code, auth.message);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonApiError(400, "INVALID_REQUEST", "Malformed JSON request body.");
  }

  const parsed = ToggleKillSwitchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonApiError(
      400,
      "INVALID_REQUEST",
      "Invalid kill-switch update request.",
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    );
  }

  const adminClient = createServiceRoleSupabaseClient();
  if (!adminClient) {
    return jsonApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Admin database connection is not configured."
    );
  }

  const updates: Record<string, unknown> = {
    updated_by: auth.principal.userId,
    updated_reason: parsed.data.reason,
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.pause_source_fetching !== undefined) {
    updates.pause_source_fetching = parsed.data.pause_source_fetching;
  }
  if (parsed.data.pause_ai_generation !== undefined) {
    updates.pause_ai_generation = parsed.data.pause_ai_generation;
  }
  if (parsed.data.pause_translation !== undefined) {
    updates.pause_translation = parsed.data.pause_translation;
  }
  if (parsed.data.pause_pdf_creation !== undefined) {
    updates.pause_pdf_creation = parsed.data.pause_pdf_creation;
  }
  if (parsed.data.pause_publishing !== undefined) {
    updates.pause_publishing = parsed.data.pause_publishing;
  }

  const { data, error } = await adminClient
    .from("system_controls")
    .update(updates)
    .eq("id", 1)
    .select(
      "pause_source_fetching, pause_ai_generation, pause_translation, pause_pdf_creation, pause_publishing, updated_reason, updated_at"
    )
    .single();

  if (error || !data) {
    return jsonApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Unable to update system kill switches."
    );
  }

  const correlationId = createCorrelationId();
  await adminClient.from("audit_logs").insert({
    actor_id: auth.principal.userId,
    actor_role: auth.principal.role,
    action: "kill_switch_updated",
    entity_type: "system_controls",
    entity_id: "1",
    reason: parsed.data.reason,
    after_summary: data,
    correlation_id: correlationId,
  });

  return NextResponse.json(
    {
      updated: true,
      controls: data,
      correlation_id: correlationId,
    },
    { status: 200 }
  );
}
