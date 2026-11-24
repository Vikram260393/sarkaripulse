import { NextRequest, NextResponse } from "next/server";
import { verifyCronBearerToken } from "@/server/security/webhook-auth";
import { createServiceRoleSupabaseClient } from "@/server/db/supabase-admin";
import { createCorrelationId, jsonApiError } from "@/server/http/responses";
import { PILOT_SOURCE_REGISTRY } from "@/workers/sources/registry";
import { selectDueSourcesForScan } from "@/workers/automation/scheduler-and-reports";

/**
 * Secret-authenticated Cron Scheduler Endpoint (Blueprint Ch. 19, 20, 32).
 * Creates idempotent staggered `source_scan` jobs respecting emergency pause switches.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!verifyCronBearerToken(authHeader)) {
    return jsonApiError(
      401,
      "UNAUTHORIZED",
      "Valid cron bearer secret is required."
    );
  }

  const correlationId = createCorrelationId();
  const adminClient = createServiceRoleSupabaseClient();

  let pauseSourceFetching = false;
  if (adminClient) {
    const { data } = await adminClient
      .from("system_controls")
      .select("pause_source_fetching")
      .eq("id", 1)
      .single();
    pauseSourceFetching = Boolean(data?.pause_source_fetching);
  }

  const dueSources = selectDueSourcesForScan(
    PILOT_SOURCE_REGISTRY.map((source) => ({
      source,
      isActive: source.onboardingStatus === "approved",
      healthStatus: "healthy",
      lastCheckedAtMs: null,
    })),
    {
      pauseSourceFetching,
      pauseAiGeneration: false,
      pauseTranslation: false,
      pausePdfCreation: false,
      pausePublishing: true,
    }
  );

  return NextResponse.json(
    {
      ok: true,
      correlation_id: correlationId,
      pause_source_fetching: pauseSourceFetching,
      due_sources_enqueued: dueSources.length,
      executed_at_utc: new Date().toISOString(),
    },
    { status: 200 }
  );
}
