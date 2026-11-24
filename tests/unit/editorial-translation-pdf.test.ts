import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { MOCK_RECRUITMENTS } from "@/lib/data/mock-recruitments";
import {
  buildMasterArticleDraft,
  validateArticleQuality,
} from "@/agents/writer-agent";
import {
  normalizeDevanagariNumerals,
  runTranslationAgent,
  TranslatedArticle,
  validateTranslationParity,
} from "@/agents/translator-agent";
import {
  buildSupersededGuidePlan,
  generateBrandedPdfGuide,
  PUBLIC_GUIDES_BUCKET,
  resolveCanonicalQrUrl,
} from "@/agents/pdf-agent";
import { AiModelProvider } from "@/server/ai/provider";
import { validateFileSignature } from "@/workers/sources/fetcher";
import { GET as getPdfGuide } from "@/app/api/public/guides/[slug]/route";
import { POST as postAdminPublish } from "@/app/api/admin/articles/[id]/publish/route";

const mpscSample = MOCK_RECRUITMENTS[0];

describe("English Master Article Writer & Editorial Quality Gate (Blueprint Ch. 13)", () => {
  it("generates a complete 18+ section English master article from a verified record", () => {
    const res = buildMasterArticleDraft(mpscSample);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.quality.passed).toBe(true);
      expect(res.quality.issues).toEqual([]);
      expect(res.draft.sections.length).toBeGreaterThanOrEqual(18);
      expect(res.draft.canonicalPath).toBe(`/en/jobs/${mpscSample.slug}`);
    }
  });

  it("refuses to generate publishable article from unverified or rejected recruitment records", () => {
    const unverified = { ...mpscSample, verificationStatus: "review_required" as const };
    const res = buildMasterArticleDraft(unverified);
    expect(res.ok).toBe(false);
  });

  it("blocks articles containing filler text, empty headings, or missing disclaimers", () => {
    const res = buildMasterArticleDraft(mpscSample);
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const polluted = structuredClone(res.draft);
    polluted.sections[0].body = "Lorem ipsum TBD placeholder text coming soon";
    const quality = validateArticleQuality(polluted);
    expect(quality.passed).toBe(false);
    expect(quality.issues.length).toBeGreaterThan(0);

    const noDisclaimer = structuredClone(res.draft);
    noDisclaimer.sections = noDisclaimer.sections.filter(
      (s) => s.key !== "disclaimer"
    );
    const noDiscQuality = validateArticleQuality(noDisclaimer);
    expect(noDiscQuality.passed).toBe(false);
  });
});

describe("Hindi/Marathi Translation Agent & Critical-Fact Parity (Blueprint Ch. 14 & Ch. 25)", () => {
  it("normalises Devanagari numerals cleanly for parity verification", () => {
    expect(normalizeDevanagariNumerals("एकूण ४८० पदे, अंतिम तारीख १८ डिसेंबर २०२६")).toBe(
      "एकूण 480 पदे, अंतिम तारीख 18 डिसेंबर 2026"
    );
  });

  it("passes Marathi translation when critical URLs, notification ref, Devanagari vacancy counts, and closing date match", async () => {
    const built = buildMasterArticleDraft(mpscSample);
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    const mrPayload: Omit<
      TranslatedArticle,
      "targetLanguage" | "sourceArticleVersion" | "glossaryVersion" | "promptVersion" | "modelVersion" | "canonicalPath"
    > = {
      title: "महाराष्ट्र गट-ब (अराजपत्रित) संयुक्त सेवा २०२६ (MPSC)",
      summary: "महाराष्ट्र लोकसेवा आयोग (MPSC) जाहिरात SAMPLE-MPSC-2026-01 अंतर्गत ४८० पदांची भरती.",
      seoTitle: "महाराष्ट्र गट-ब भरती २०२६ — पात्रता व तारखा",
      seoDescription: "MPSC गट-ब ४८० पदे, अंतिम तारीख १८ डिसेंबर २०२६.",
      sections: [
        {
          key: "overview",
          heading: "भरतीचा गोषवारा",
          body: "जाहिरात क्रमांक SAMPLE-MPSC-2026-01 साठी एकूण ४८० रिक्त पदे आहेत.",
        },
        {
          key: "important_dates",
          heading: "महत्त्वाच्या तारखा",
          body: "ऑनलाइन अर्ज अंतिम तारीख: १८ डिसेंबर २०२६.",
        },
        {
          key: "official_links",
          heading: "अधिकृत लिंक",
          body: "https://mpsc.gov.in/ आणि https://mpsconline.gov.in/",
        },
        {
          key: "disclaimer",
          heading: "अस्वीकरण",
          body: "SarkariPulse हा स्वतंत्र माहिती मंच आहे; मूळ अधिकृत जाहिरात अंतिम राहील.",
        },
      ],
    };

    const mockProvider: AiModelProvider = {
      providerName: "mock",
      async generateStructuredJson(req) {
        expect(req.systemInstruction).toContain("glossary-v1.0.0");
        return {
          modelVersion: "mock-gemini-flash",
          rawText: JSON.stringify(mrPayload),
          estimatedInputTokens: 300,
          estimatedOutputTokens: 250,
        };
      },
    };

    const translated = await runTranslationAgent({
      master: built.draft,
      targetLanguage: "mr",
      provider: mockProvider,
    });

    expect(translated.ok).toBe(true);
    if (translated.ok) {
      expect(translated.parity.passed).toBe(true);
      expect(translated.translation.canonicalPath).toBe(`/mr/jobs/${mpscSample.slug}`);
    }
  });

  it("blocks translation when a vacancy number, closing date, or official URL is altered", () => {
    const built = buildMasterArticleDraft(mpscSample);
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    const brokenHi: TranslatedArticle = {
      targetLanguage: "hi",
      sourceArticleVersion: 1,
      glossaryVersion: "glossary-v1.0.0",
      promptVersion: "translation-prompt-v1.0.0",
      modelVersion: "mock",
      title: "महाराष्ट्र ग्रुप-बी भर्ती 2026",
      summary: "गलत रिक्तियां 999 और गलत तिथि 25 दिसंबर 2026",
      seoTitle: "महाराष्ट्र ग्रुप-बी भर्ती 2026 विवरण",
      seoDescription: "गलत लिंक और संख्या वाला परीक्षण अनुवाद।",
      canonicalPath: `/hi/jobs/${mpscSample.slug}`,
      sections: [
        {
          key: "overview",
          heading: "अवलोकन",
          body: "कुल पद 999 हैं और अंतिम तिथि 25 दिसंबर 2026 है।",
        },
        {
          key: "official_links",
          heading: "लिंक",
          body: "https://mpsc.gov.in/", // Dropped mpsconline.gov.in!
        },
        {
          key: "disclaimer",
          heading: "अस्वीकरण",
          body: "SarkariPulse एक स्वतंत्र सूचना मंच है।",
        },
      ],
    };

    const parity = validateTranslationParity(built.draft, brokenHi);
    expect(parity.passed).toBe(false);
    expect(parity.missingUrls).toContain("https://mpsconline.gov.in/");
    expect(parity.missingCriticalNumbers).toContain("vacancyTotal=480");
    expect(parity.missingDates).toContain("applicationEnd=2026-12-18");
  });
});

describe("Branded PDF Informational Guide Pipeline & Lifecycle (Blueprint Ch. 15 & Ch. 24)", () => {
  it("generates a valid %PDF- branded guide in public-guides bucket with SHA-256 checksum & canonical QR rule", async () => {
    const generated = await generateBrandedPdfGuide({
      record: mpscSample,
      documentType: "recruitment_summary",
      language: "en",
      articleVersion: 2,
      canonicalHost: "sarkaripulse.in",
    });

    expect(validateFileSignature(generated.pdfBytes, "application/pdf").valid).toBe(true);
    expect(generated.checksumSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(generated.storageBucket).toBe(PUBLIC_GUIDES_BUCKET);
    expect(generated.filename).toContain("sarkaripulse-");
    expect(generated.filename).toContain("-v2.pdf");
    expect(generated.canonicalUrlForQr).toBe(
      `https://sarkaripulse.in/en/jobs/${mpscSample.slug}`
    );

    // Localhost must NOT emit a canonical QR URL
    expect(resolveCanonicalQrUrl("localhost:3000", "en", mpscSample.slug)).toBeNull();
  });

  it("embeds bundled Noto Sans Devanagari TTF automatically for Marathi (mr) and Hindi (hi) PDFs", async () => {
    const mrPdf = await generateBrandedPdfGuide({
      record: mpscSample,
      documentType: "multilingual_quick_guide",
      language: "mr",
      articleVersion: 1,
      canonicalHost: "sarkaripulse.in",
    });

    expect(mrPdf.embeddedUnicodeFont).toBe(true);
    expect(validateFileSignature(mrPdf.pdfBytes, "application/pdf").valid).toBe(true);
    expect(mrPdf.filename).toContain("-mr-v1.pdf");
    expect(mrPdf.fileSizeBytes).toBeGreaterThan(5_000);

    const hiPdf = await generateBrandedPdfGuide({
      record: mpscSample,
      documentType: "multilingual_quick_guide",
      language: "hi",
      articleVersion: 1,
      canonicalHost: "sarkaripulse.in",
    });
    expect(hiPdf.embeddedUnicodeFont).toBe(true);
    expect(validateFileSignature(hiPdf.pdfBytes, "application/pdf").valid).toBe(true);
  });

  it("refuses to overwrite an original official_notification file when superseding guides", () => {
    const blocked = buildSupersededGuidePlan({
      previousDocumentId: "doc-1",
      previousDocumentType: "official_notification",
      newDocumentId: "doc-2",
    });
    expect(blocked.ok).toBe(false);

    const allowed = buildSupersededGuidePlan({
      previousDocumentId: "doc-3",
      previousDocumentType: "recruitment_summary",
      newDocumentId: "doc-4",
    });
    expect(allowed.ok).toBe(true);
  });

  it("serves real PDF via GET /api/public/guides/[slug] and protects POST /api/admin/articles/[id]/publish", async () => {
    const pdfRes = await getPdfGuide(
      new NextRequest(
        `http://localhost:3000/api/public/guides/${mpscSample.slug}?lang=en`
      ),
      { params: Promise.resolve({ slug: mpscSample.slug }) }
    );
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers.get("content-type")).toBe("application/pdf");
    expect(pdfRes.headers.get("x-sarkariPulse-checksum-sha256")).toMatch(/^[a-f0-9]{64}$/);
    const bytes = new Uint8Array(await pdfRes.arrayBuffer());
    expect(validateFileSignature(bytes, "application/pdf").valid).toBe(true);

    const pubRes = await postAdminPublish(
      new NextRequest(
        "http://localhost:3000/api/admin/articles/00000000-0000-0000-0000-000000000001/publish",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reason: "Unauthorized attempt" }),
        }
      ),
      {
        params: Promise.resolve({
          id: "00000000-0000-0000-0000-000000000001",
        }),
      }
    );
    expect(pubRes.status).toBe(401);
  });
});
