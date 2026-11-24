import { NextRequest, NextResponse } from "next/server";
import { PublicRecruitmentsQuerySchema } from "@/lib/schemas/api";
import { jsonApiError } from "@/server/http/responses";
import { listPublicRecruitments } from "@/server/repositories/recruitments";
import { checkRateLimit, getClientRateKey } from "@/server/security/rate-limit";

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(
    getClientRateKey(request, "public:recruitments"),
    120,
    60_000
  );
  if (!rl.allowed) {
    return jsonApiError(
      429,
      "RATE_LIMITED",
      "Too many requests. Please try again shortly.",
      undefined,
      { "Retry-After": String(rl.retryAfterSeconds) }
    );
  }

  const sp = request.nextUrl.searchParams;
  const parsed = PublicRecruitmentsQuerySchema.safeParse({
    lang: sp.get("lang") ?? undefined,
    q: sp.get("q") ?? undefined,
    state: sp.get("state") ?? undefined,
    category: sp.get("category") ?? undefined,
    qualification: sp.get("qualification") ?? undefined,
    status: sp.get("status") ?? undefined,
    employmentType: sp.get("employmentType") ?? undefined,
    cursor: sp.get("cursor") ?? undefined,
    limit: sp.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return jsonApiError(
      400,
      "INVALID_REQUEST",
      "Invalid query parameters.",
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    );
  }

  const result = await listPublicRecruitments({
    lang: parsed.data.lang,
    filters: {
      q: parsed.data.q,
      state: parsed.data.state,
      category: parsed.data.category,
      qualification: parsed.data.qualification,
      status: parsed.data.status,
      employmentType: parsed.data.employmentType,
    },
    cursor: parsed.data.cursor,
    limit: parsed.data.limit,
  });

  return NextResponse.json(result, {
    status: 200,
    headers: {
      "X-RateLimit-Remaining": String(rl.remaining),
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
