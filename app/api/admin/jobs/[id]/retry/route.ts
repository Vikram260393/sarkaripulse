import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminPermission } from "@/server/auth/rbac";
import { createServiceRoleSupabaseClient } from "@/server/db/supabase-admin";
import { createCorrelationId, jsonApiError } from "@/server/http/responses";

const RetryJobSchema = z.object({
  reason: z.string().trim().min(5).max(500),
});

/**
 * Protected Admin Dead-Letter Job Replay Endpoint (Blueprint Ch. 18, 19, 32).
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminPermission("retry_jobs");
  if (!auth.ok) {
    return jsonApiError(auth.status, auth.code, auth.message);
  }

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return jsonApiError(400, "INVALID_REQUEST", "Valid job UUID required.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonApiError(400, "INVALID_REQUEST", "Malformed JSON request body.");
  }

  const parsed = RetryJobSchema.safeParse(body);
  if (!parsed.success) {
    return jsonApiError(
      400,
      "INVALID_REQUEST",
      "Reason (min 5 characters) is required to replay a job.",
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
  const { data, error } = await adminClient
    .from("automation_jobs")
    .update({
      status: "queued",
      attempts: 0,
      next_run_at: new Date().toISOString(),
      error_code: null,
      error_message: null,
    })
    .eq("id", id)
    .in("status", ["dead_lettered", "failed"])
    .select("id, status, job_type")
    .maybeSingle();

  if (error || !data) {
    return jsonApiError(
      404,
      "NOT_FOUND",
      "Job not found or not eligible for replay."
    );
  }

  await adminClient.from("audit_logs").insert({
    actor_id: auth.principal.userId,
    actor_role: auth.principal.role,
    action: "job_replayed",
    entity_type: "automation_job",
    entity_id: id,
    reason: parsed.data.reason,
    correlation_id: correlationId,
  });

  return NextResponse.json(
    {
      replayed: true,
      job: data,
      correlation_id: correlationId,
    },
    { status: 200 }
  );
}
