import { NextRequest, NextResponse } from "next/server";
import { PublicSearchQuerySchema } from "@/lib/schemas/api";
import { jsonApiError } from "@/server/http/responses";
import { listPublicRecruitments } from "@/server/repositories/recruitments";
import { checkRateLimit, getClientRateKey } from "@/server/security/rate-limit";

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(
    getClientRateKey(request, "public:search"),
    60,
    60_000
  );
  if (!rl.allowed) {
    return jsonApiError(
      429,
      "RATE_LIMITED",
      "Search rate limit exceeded. Please wait briefly.",
      undefined,
      { "Retry-After": String(rl.retryAfterSeconds) }
    );
  }

  const sp = request.nextUrl.searchParams;
  const parsed = PublicSearchQuerySchema.safeParse({
    q: sp.get("q") ?? "",
    lang: sp.get("lang") ?? undefined,
    limit: sp.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return jsonApiError(
      400,
      "INVALID_REQUEST",
      "Invalid search query.",
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    );
  }

  const result = await listPublicRecruitments({
    lang: parsed.data.lang,
    filters: { q: parsed.data.q },
    limit: parsed.data.limit,
  });

  return NextResponse.json(result, {
    status: 200,
    headers: {
      "X-RateLimit-Remaining": String(rl.remaining),
      "Cache-Control": "no-store",
    },
  });
}
