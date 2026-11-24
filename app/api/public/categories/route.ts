import { NextRequest, NextResponse } from "next/server";
import { LanguageParamSchema } from "@/lib/schemas/api";
import { jsonApiError } from "@/server/http/responses";
import { listPublicTaxonomy } from "@/server/repositories/recruitments";
import { checkRateLimit, getClientRateKey } from "@/server/security/rate-limit";

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(
    getClientRateKey(request, "public:categories"),
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

  const langParsed = LanguageParamSchema.safeParse(
    request.nextUrl.searchParams.get("lang") ?? undefined
  );
  if (!langParsed.success) {
    return jsonApiError(400, "INVALID_REQUEST", "Unsupported language code.");
  }

  const taxonomy = await listPublicTaxonomy(langParsed.data);
  return NextResponse.json(taxonomy, {
    status: 200,
    headers: {
      "X-RateLimit-Remaining": String(rl.remaining),
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
