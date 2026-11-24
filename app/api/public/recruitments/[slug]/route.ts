import { NextRequest, NextResponse } from "next/server";
import { LanguageParamSchema } from "@/lib/schemas/api";
import { jsonApiError } from "@/server/http/responses";
import { getPublicRecruitmentDetail } from "@/server/repositories/recruitments";
import { checkRateLimit, getClientRateKey } from "@/server/security/rate-limit";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const rl = checkRateLimit(
    getClientRateKey(request, "public:recruitment-detail"),
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

  const { slug } = await context.params;
  if (!slug || !/^[a-z0-9-]{2,160}$/.test(slug)) {
    return jsonApiError(400, "INVALID_REQUEST", "Invalid recruitment slug.");
  }

  const langParsed = LanguageParamSchema.safeParse(
    request.nextUrl.searchParams.get("lang") ?? undefined
  );
  if (!langParsed.success) {
    return jsonApiError(400, "INVALID_REQUEST", "Unsupported language code.");
  }

  const { record, data_source } = await getPublicRecruitmentDetail(
    slug,
    langParsed.data
  );

  if (!record) {
    return jsonApiError(404, "NOT_FOUND", "Recruitment record not found.");
  }

  return NextResponse.json(
    {
      language: langParsed.data,
      data_source,
      data: record,
    },
    {
      status: 200,
      headers: {
        "X-RateLimit-Remaining": String(rl.remaining),
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
