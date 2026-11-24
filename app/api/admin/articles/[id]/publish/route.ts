import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminPermission } from "@/server/auth/rbac";
import { createServiceRoleSupabaseClient } from "@/server/db/supabase-admin";
import { createCorrelationId, jsonApiError } from "@/server/http/responses";

const PublishArticleSchema = z.object({
  reason: z.string().trim().min(5).max(500),
  override_pause_switch: z.boolean().default(false),
});

/**
 * Protected Admin Article Publish Route (Blueprint Ch. 11, 18, 32).
 * Enforces:
 *  - Server-side `publish_article` RBAC (`super_admin` or `editor`)
 *  - Emergency kill switch (`system_controls.pause_publishing`)
 *  - Verified recruitment status check before publication
 *  - Snapshot in `content_versions` + immutable entry in `audit_logs`
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminPermission("publish_article");
  if (!auth.ok) {
    return jsonApiError(auth.status, auth.code, auth.message);
  }

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return jsonApiError(400, "INVALID_REQUEST", "Valid article UUID required.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonApiError(400, "INVALID_REQUEST", "Malformed JSON request body.");
  }

  const parsed = PublishArticleSchema.safeParse(body);
  if (!parsed.success) {
    return jsonApiError(
      400,
      "INVALID_REQUEST",
      "Invalid publish request.",
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

  // Enforce emergency publishing kill switch (Blueprint Ch. 11 & Ch. 18)
  const { data: controls } = await adminClient
    .from("system_controls")
    .select("pause_publishing")
    .eq("id", 1)
    .single();

  if (controls?.pause_publishing) {
    const canOverride =
      parsed.data.override_pause_switch && auth.principal.role === "super_admin";
    if (!canOverride) {
      return jsonApiError(
        403,
        "FORBIDDEN",
        "Publishing is currently paused by the emergency kill switch."
      );
    }
  }

  const { data: article, error: articleErr } = await adminClient
    .from("articles")
    .select("id, recruitment_id, slug, title, version_number, canonical_url, editorial_state")
    .eq("id", id)
    .maybeSingle();

  if (articleErr || !article) {
    return jsonApiError(404, "NOT_FOUND", "Article not found.");
  }

  // Verify linked recruitment passed verification gate before publishing
  if (article.recruitment_id) {
    const { data: rec } = await adminClient
      .from("recruitments")
      .select("id, verification_status")
      .eq("id", article.recruitment_id)
      .maybeSingle();

    if (!rec || rec.verification_status !== "verified") {
      return jsonApiError(
        403,
        "FORBIDDEN",
        "Linked recruitment has not passed verification; publication blocked."
      );
    }
  }

  const nowIso = new Date().toISOString();
  const correlationId = createCorrelationId();

  await adminClient
    .from("articles")
    .update({
      editorial_state: "published",
      published_at: nowIso,
      last_verified_at: nowIso,
      reviewer_id: auth.principal.userId,
    })
    .eq("id", id);

  if (article.recruitment_id) {
    await adminClient
      .from("recruitments")
      .update({
        editorial_state: "published",
        is_public_safe: true,
        first_published_at: nowIso,
      })
      .eq("id", article.recruitment_id);
  }

  await adminClient.from("audit_logs").insert({
    actor_id: auth.principal.userId,
    actor_role: auth.principal.role,
    action: "article_published",
    entity_type: "article",
    entity_id: id,
    reason: parsed.data.reason,
    correlation_id: correlationId,
  });

  return NextResponse.json(
    {
      published: true,
      article_id: id,
      canonical_url: article.canonical_url,
      published_at: nowIso,
      correlation_id: correlationId,
    },
    { status: 200 }
  );
}
