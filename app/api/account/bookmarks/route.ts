import { NextRequest, NextResponse } from "next/server";
import { CreateBookmarkInputSchema } from "@/lib/schemas/api";
import { createSessionSupabaseClient } from "@/server/db/supabase-server";
import { jsonApiError } from "@/server/http/responses";

/**
 * Candidate bookmarks & saved searches API (Blueprint Ch. 17 & Ch. 07).
 * Strictly enforces authenticated Supabase session + per-user RLS (`user_id = auth.uid()`).
 */
export async function GET() {
  const supabase = await createSessionSupabaseClient();
  if (!supabase) {
    return jsonApiError(
      401,
      "UNAUTHORIZED",
      "Sign in to access saved bookmarks and searches."
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return jsonApiError(
      401,
      "UNAUTHORIZED",
      "Sign in to access saved bookmarks and searches."
    );
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .select("id, recruitment_id, saved_search_query, notify_on_update, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return jsonApiError(503, "SERVICE_UNAVAILABLE", "Unable to load bookmarks.");
  }

  return NextResponse.json({ items: data ?? [] }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const supabase = await createSessionSupabaseClient();
  if (!supabase) {
    return jsonApiError(401, "UNAUTHORIZED", "Sign in to save bookmarks.");
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return jsonApiError(401, "UNAUTHORIZED", "Sign in to save bookmarks.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonApiError(400, "INVALID_REQUEST", "Malformed JSON request body.");
  }

  const parsed = CreateBookmarkInputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonApiError(
      400,
      "INVALID_REQUEST",
      "Invalid bookmark payload.",
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    );
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      user_id: user.id,
      recruitment_id: parsed.data.recruitment_id ?? null,
      saved_search_query: parsed.data.saved_search_query ?? null,
      notify_on_update: parsed.data.notify_on_update,
    })
    .select("id, recruitment_id, saved_search_query, notify_on_update, created_at")
    .single();

  if (error) {
    return jsonApiError(503, "SERVICE_UNAVAILABLE", "Unable to save bookmark.");
  }

  return NextResponse.json({ item: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createSessionSupabaseClient();
  if (!supabase) {
    return jsonApiError(401, "UNAUTHORIZED", "Sign in to manage bookmarks.");
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return jsonApiError(401, "UNAUTHORIZED", "Sign in to manage bookmarks.");
  }

  const bookmarkId = request.nextUrl.searchParams.get("id");
  if (!bookmarkId || !/^[0-9a-f-]{36}$/i.test(bookmarkId)) {
    return jsonApiError(400, "INVALID_REQUEST", "Valid bookmark UUID is required.");
  }

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", bookmarkId)
    .eq("user_id", user.id);

  if (error) {
    return jsonApiError(503, "SERVICE_UNAVAILABLE", "Unable to remove bookmark.");
  }

  return NextResponse.json({ deleted: true, id: bookmarkId }, { status: 200 });
}
