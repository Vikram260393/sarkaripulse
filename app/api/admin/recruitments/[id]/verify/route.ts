import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminPermission } from "@/server/auth/rbac";
import { createServiceRoleSupabaseClient } from "@/server/db/supabase-admin";
import { createCorrelationId, jsonApiError } from "@/server/http/responses";
import { VERIFICATION_RULESET_VERSION } from "@/agents/verification-engine";

const VerifyDecisionSchema = z.object({
  decision: z.enum(["verified", "review_required", "rejected"]),
  reason: z.string().trim().min(5).max(1000),
});

/**
 * Protected Admin Recruitment Verification Decision Endpoint (Blueprint Ch. 18 & Ch. 32).
 * Records immutable audit_logs entry alongside verification_checks decision.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminPermission("verify_recruitment");
  if (!auth.ok) {
    return jsonApiError(auth.status, auth.code, auth.message);
  }

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return jsonApiError(400, "INVALID_REQUEST", "Valid recruitment UUID required.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonApiError(400, "INVALID_REQUEST", "Malformed JSON request body.");
  }

  const parsed = VerifyDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonApiError(
      400,
      "INVALID_REQUEST",
      "Invalid verification decision payload.",
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

  const correlationId = createCorrelationId();
  const nowIso = new Date().toISOString();

  const { error: checkErr } = await adminClient.from("verification_checks").insert({
    recruitment_id: id,
    ruleset_version: VERIFICATION_RULESET_VERSION,
    decision: parsed.data.decision,
    reviewer_id: auth.principal.userId,
    review_reason: parsed.data.reason,
    verified_at: parsed.data.decision === "verified" ? nowIso : null,
  });

  if (checkErr) {
    return jsonApiError(503, "SERVICE_UNAVAILABLE", "Failed to save verification check.");
  }

  await adminClient
    .from("recruitments")
    .update({
      verification_status: parsed.data.decision,
      last_verified_at: parsed.data.decision === "verified" ? nowIso : undefined,
    })
    .eq("id", id);

  await adminClient.from("audit_logs").insert({
    actor_id: auth.principal.userId,
    actor_role: auth.principal.role,
    action: `verification_${parsed.data.decision}`,
    entity_type: "recruitment",
    entity_id: id,
    reason: parsed.data.reason,
    correlation_id: correlationId,
  });

  return NextResponse.json(
    {
      recruitment_id: id,
      decision: parsed.data.decision,
      ruleset_version: VERIFICATION_RULESET_VERSION,
      correlation_id: correlationId,
    },
    { status: 200 }
  );
}
