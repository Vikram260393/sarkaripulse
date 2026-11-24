import { NextRequest, NextResponse } from "next/server";
import { LanguageParamSchema } from "@/lib/schemas/api";
import { getPublicRecruitmentDetail } from "@/server/repositories/recruitments";
import { jsonApiError } from "@/server/http/responses";
import { checkRateLimit, getClientRateKey } from "@/server/security/rate-limit";
import { generateBrandedPdfGuide } from "@/agents/pdf-agent";

/**
 * Rate-limited Branded Informational PDF Guide download endpoint (Blueprint Ch. 15 & Ch. 24).
 * Always serves clearly labelled "SarkariPulse Informational Guide" PDFs with SHA-256 checksum header.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const rl = checkRateLimit(
    getClientRateKey(request, "public:pdf-guide"),
    20,
    60_000
  );
  if (!rl.allowed) {
    return jsonApiError(
      429,
      "RATE_LIMITED",
      "PDF generation rate limit exceeded. Please try again shortly.",
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

  const { record } = await getPublicRecruitmentDetail(slug, langParsed.data);
  if (!record) {
    return jsonApiError(404, "NOT_FOUND", "Recruitment record not found.");
  }

  const canonicalHost =
    process.env.NEXT_PUBLIC_CANONICAL_HOST?.trim() || "sarkaripulse.in";

  const generated = await generateBrandedPdfGuide({
    record,
    documentType: "recruitment_summary",
    language: langParsed.data,
    articleVersion: 1,
    canonicalHost,
  });

  return new NextResponse(Buffer.from(generated.pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${generated.filename}"`,
      "Content-Length": String(generated.fileSizeBytes),
      "X-Content-Type-Options": "nosniff",
      "X-SarkariPulse-Checksum-SHA256": generated.checksumSha256,
      "X-SarkariPulse-Storage-Bucket": generated.storageBucket,
      "X-RateLimit-Remaining": String(rl.remaining),
      "Cache-Control": "public, max-age=300",
    },
  });
}
