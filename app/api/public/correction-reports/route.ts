import { NextRequest, NextResponse } from "next/server";
import { CorrectionReportInputSchema } from "@/lib/schemas/api";
import { createServiceRoleSupabaseClient } from "@/server/db/supabase-admin";
import { createCorrelationId, jsonApiError } from "@/server/http/responses";
import { checkRateLimit, getClientRateKey } from "@/server/security/rate-limit";

/**
 * Public unauthenticated correction report endpoint (Blueprint Ch. 22).
 * Rate-limited and schema-validated; routes material factual reports to verification queue.
 */
export async function POST(request: NextRequest) {
  const rl = checkRateLimit(
    getClientRateKey(request, "public:correction-report"),
    10,
    60_000
  );
  if (!rl.allowed) {
    return jsonApiError(
      429,
      "RATE_LIMITED",
      "Too many correction submissions. Please try again later.",
      undefined,
      { "Retry-After": String(rl.retryAfterSeconds) }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonApiError(400, "INVALID_REQUEST", "Malformed JSON request body.");
  }

  const parsed = CorrectionReportInputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonApiError(
      400,
      "INVALID_REQUEST",
      "Correction report validation failed.",
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    );
  }

  const correlationId = createCorrelationId();
  const adminClient = createServiceRoleSupabaseClient();

  if (adminClient) {
    const { data, error } = await adminClient
      .from("correction_reports")
      .insert({
        page_url: parsed.data.page_url,
        recruitment_id: parsed.data.recruitment_id ?? null,
        issue_type: parsed.data.issue_type,
        explanation: parsed.data.explanation,
        reporter_contact: parsed.data.reporter_contact || null,
        triage_status: "queued",
      })
      .select("id, created_at")
      .single();

    if (error) {
      return jsonApiError(
        503,
        "SERVICE_UNAVAILABLE",
        "Unable to store correction report right now."
      );
    }

    return NextResponse.json(
      {
        status: "queued",
        report_id: data.id,
        correlation_id: correlationId,
        received_at: data.created_at,
        storage_mode: "database",
      },
      { status: 201 }
    );
  }

  return NextResponse.json(
    {
      status: "accepted_local_preview",
      report_id: correlationId,
      correlation_id: correlationId,
      received_at: new Date().toISOString(),
      storage_mode: "sample_preview",
    },
    { status: 202 }
  );
}
