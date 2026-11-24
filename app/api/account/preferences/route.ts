import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSessionSupabaseClient } from "@/server/db/supabase-server";
import { jsonApiError } from "@/server/http/responses";

const AlertPreferencesSchema = z.object({
  channel: z.enum(["email", "web_push"]).default("email"),
  states: z.array(z.string().trim().max(32)).max(20).default([]),
  qualifications: z.array(z.string().trim().max(40)).max(15).default([]),
  frequency: z
    .enum(["daily_digest", "weekly_digest", "instant_verified"])
    .default("daily_digest"),
  is_subscribed: z.boolean(),
});

/**
 * Candidate Alert Preferences API (Blueprint Ch. 17 & Ch. 07).
 * Strictly enforces authenticated session & per-user RLS (`user_id = auth.uid()`).
 */
export async function GET() {
  const supabase = await createSessionSupabaseClient();
  if (!supabase) {
    return jsonApiError(401, "UNAUTHORIZED", "Sign in to manage alert preferences.");
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return jsonApiError(401, "UNAUTHORIZED", "Sign in to manage alert preferences.");
  }

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("channel, states, qualifications, frequency, is_subscribed, consent_timestamp, updated_at")
    .eq("user_id", user.id);

  if (error) {
    return jsonApiError(503, "SERVICE_UNAVAILABLE", "Unable to load alert preferences.");
  }

  return NextResponse.json({ preferences: data ?? [] }, { status: 200 });
}

export async function PUT(request: NextRequest) {
  const supabase = await createSessionSupabaseClient();
  if (!supabase) {
    return jsonApiError(401, "UNAUTHORIZED", "Sign in to update alert preferences.");
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return jsonApiError(401, "UNAUTHORIZED", "Sign in to update alert preferences.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonApiError(400, "INVALID_REQUEST", "Malformed JSON body.");
  }

  const parsed = AlertPreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return jsonApiError(
      400,
      "INVALID_REQUEST",
      "Invalid alert preferences payload.",
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    );
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        user_id: user.id,
        channel: parsed.data.channel,
        states: parsed.data.states,
        qualifications: parsed.data.qualifications,
        frequency: parsed.data.frequency,
        is_subscribed: parsed.data.is_subscribed,
        consent_timestamp: parsed.data.is_subscribed ? nowIso : null,
      },
      { onConflict: "user_id,channel" }
    )
    .select("channel, states, qualifications, frequency, is_subscribed, consent_timestamp")
    .single();

  if (error) {
    return jsonApiError(503, "SERVICE_UNAVAILABLE", "Unable to save alert preferences.");
  }

  return NextResponse.json({ preference: data }, { status: 200 });
}
