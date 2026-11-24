import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyWebhookSignature } from "@/server/security/webhook-auth";
import { createCorrelationId, jsonApiError } from "@/server/http/responses";
import {
  buildEventDrivenProposedUpdate,
  RECRUITMENT_EVENT_TRIGGERS,
} from "@/workers/automation/scheduler-and-reports";

const SourceEventWebhookSchema = z.object({
  trigger: z.enum(RECRUITMENT_EVENT_TRIGGERS),
  source_id: z.string().trim().min(1).max(80),
  recruitment_id: z.string().uuid().nullable().optional(),
  evidence_url: z.string().url(),
});

/**
 * HMAC-authenticated Source Event Webhook (Blueprint Ch. 20 & Ch. 32).
 * Creates an evidence-backed proposed update — NEVER directly overwrites published content.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const sigHeader = request.headers.get("x-sarkaripulse-signature");

  if (!verifyWebhookSignature(rawBody, sigHeader)) {
    return jsonApiError(
      401,
      "UNAUTHORIZED",
      "Invalid or missing webhook signature."
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return jsonApiError(400, "INVALID_REQUEST", "Malformed JSON payload.");
  }

  const parsed = SourceEventWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return jsonApiError(
      400,
      "INVALID_REQUEST",
      "Invalid source event payload.",
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    );
  }

  const proposedUpdate = buildEventDrivenProposedUpdate({
    trigger: parsed.data.trigger,
    sourceId: parsed.data.source_id,
    recruitmentId: parsed.data.recruitment_id ?? null,
    evidenceUrl: parsed.data.evidence_url,
  });

  return NextResponse.json(
    {
      accepted: true,
      correlation_id: createCorrelationId(),
      proposed_update: proposedUpdate,
    },
    { status: 202 }
  );
}
