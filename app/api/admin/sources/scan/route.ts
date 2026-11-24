import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminPermission } from "@/server/auth/rbac";
import { createCorrelationId, jsonApiError } from "@/server/http/responses";
import { getPilotSourceById } from "@/workers/sources/registry";
import { createServiceRoleSupabaseClient } from "@/server/db/supabase-admin";

const TriggerScanSchema = z.object({
  source_id: z.string().trim().min(1).max(80),
  priority: z.number().int().min(1).max(4).default(2),
});

/**
 * Protected Admin Source Scan Trigger (Blueprint Ch. 32).
 * Enforces server-side `manage_sources` RBAC + idempotency key support.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminPermission("manage_sources");
  if (!auth.ok) {
    return jsonApiError(auth.status, auth.code, auth.message);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonApiError(400, "INVALID_REQUEST", "Malformed JSON request body.");
  }

  const parsed = TriggerScanSchema.safeParse(body);
  if (!parsed.success) {
    return jsonApiError(
      400,
      "INVALID_REQUEST",
      "Invalid source scan request.",
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    );
  }

  const source = getPilotSourceById(parsed.data.source_id);
  if (!source) {
    return jsonApiError(404, "NOT_FOUND", "Unknown allowlisted source_id.");
  }

  const idempotencyKey =
    request.headers.get("idempotency-key")?.trim() ||
    `source_scan:${source.id}:${new Date().toISOString().slice(0, 13)}`;
  const correlationId = createCorrelationId();

  const adminClient = createServiceRoleSupabaseClient();
  if (!adminClient) {
    return jsonApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Admin database connection is not configured."
    );
  }

  const { data: job, error } = await adminClient
    .from("automation_jobs")
    .upsert(
      {
        correlation_id: correlationId,
        job_type: "source_scan",
        priority: parsed.data.priority,
        idempotency_key: idempotencyKey,
        status: "queued",
        payload: { source_registry_id: source.id, official_domain: source.officialDomain },
      },
      { onConflict: "idempotency_key", ignoreDuplicates: true }
    )
    .select("id, status, idempotency_key, correlation_id")
    .maybeSingle();

  if (error) {
    return jsonApiError(503, "SERVICE_UNAVAILABLE", "Failed to enqueue scan job.");
  }

  return NextResponse.json(
    {
      queued: true,
      idempotency_key: idempotencyKey,
      correlation_id: correlationId,
      job: job ?? null,
    },
    { status: 202 }
  );
}
