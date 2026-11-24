import fs from "node:fs";
import path from "node:path";
import "regenerator-runtime/runtime";
import { PDFDocument, type PDFFont, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { LanguageCode, RecruitmentRecord } from "@/lib/types/recruitment";
import {
  extractDestinationDomain,
  formatCalendarDate,
  formatVacancyCount,
  formatVerifiedTimestamp,
  isSafeHttpUrl,
  normalizeSlug,
  resolveLocalizedText,
} from "@/lib/utils/formatters";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  computeSha256Hex,
  validateFileSignature,
} from "@/workers/sources/fetcher";

let cachedDevanagariFontBytes: Uint8Array | null | undefined;

/**
 * Loads the bundled SIL OFL Noto Sans Devanagari TTF for Hindi/Marathi PDF embedding
 * (Blueprint Ch. 02, Ch. 14, Ch. 15 & Ch. 24).
 */
export function loadBundledDevanagariFont(): Uint8Array | null {
  if (cachedDevanagariFontBytes !== undefined) {
    return cachedDevanagariFontBytes;
  }
  const fontPath = path.resolve(
    process.cwd(),
    "public/fonts/NotoSansDevanagari-Regular.ttf"
  );
  try {
    if (fs.existsSync(fontPath)) {
      cachedDevanagariFontBytes = new Uint8Array(fs.readFileSync(fontPath));
      return cachedDevanagariFontBytes;
    }
  } catch {
    // Fallback cleanly to standard Latin font if unavailable
  }
  cachedDevanagariFontBytes = null;
  return null;
}

export type GuideDocumentType =
  | "recruitment_summary"
  | "application_checklist"
  | "eligibility_guide"
  | "syllabus_guide"
  | "multilingual_quick_guide";

export const MAX_GENERATED_PDF_PAGES = 20;
export const MAX_GENERATED_PDF_BYTES = 10 * 1024 * 1024; // 10 MB cap (Blueprint Ch. 24)
export const PUBLIC_GUIDES_BUCKET = "public-guides" as const;

export interface GeneratePdfGuideInput {
  record: RecruitmentRecord;
  documentType: GuideDocumentType;
  language: LanguageCode;
  articleVersion: number;
  canonicalHost: string;
  /** Optional licensed Unicode/Devanagari TTF bytes (e.g. NotoSansDevanagari-Regular.ttf) */
  unicodeFontBytes?: Uint8Array;
}

export interface GeneratedPdfGuideResult {
  pdfBytes: Uint8Array;
  checksumSha256: string;
  fileSizeBytes: number;
  pageCount: number;
  filename: string;
  storageBucket: typeof PUBLIC_GUIDES_BUCKET;
  storagePath: string;
  canonicalUrlForQr: string | null;
  generatedAt: string;
  embeddedUnicodeFont: boolean;
}

/**
 * Escapes control characters and prevents malformed PDF text injection (Blueprint Ch. 24).
 */
export function sanitizePdfText(
  input: string,
  asciiFallback: boolean
): string {
  const noControls = input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ");
  const collapsed = noControls.replace(/\s+/g, " ").trim();
  if (!asciiFallback) {
    return collapsed;
  }
  // WinAnsi standard PDF fonts only encode basic Latin + common symbols;
  // strip unsupported non-Latin codepoints when no Unicode TTF font buffer was supplied.
  return collapsed
    .replace(/₹/g, "INR ")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E]/g, "");
}

function wrapLines(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxCharsPerLine) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Resolves QR target URL strictly when it matches the canonical production host
 * (Blueprint Ch. 15: "Add a QR code to the relevant web page only when it resolves to the canonical URL").
 */
export function resolveCanonicalQrUrl(
  canonicalHost: string,
  lang: LanguageCode,
  slug: string
): string | null {
  const cleanHost = canonicalHost.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!cleanHost || cleanHost === "localhost" || cleanHost.startsWith("localhost:")) {
    return null;
  }
  const candidate = `https://${cleanHost}/${lang}/jobs/${slug}`;
  if (!isSafeHttpUrl(candidate)) return null;
  const parsedHost = extractDestinationDomain(candidate);
  return parsedHost === cleanHost ? candidate : null;
}

/**
 * Branded SarkariPulse Informational PDF Guide Generator (Blueprint Ch. 15, Ch. 24 & Appendix C).
 * - Always prominently displays "SarkariPulse informational guide — Not an official government notice".
 * - Routes strictly to `public-guides` bucket (never overwrites original official files).
 * - Verifies `%PDF-` signature, page cap, size cap, and SHA-256 checksum.
 */
export async function generateBrandedPdfGuide(
  input: GeneratePdfGuideInput
): Promise<GeneratedPdfGuideResult> {
  const { record, documentType, language, articleVersion, canonicalHost } = input;
  const generatedAt = new Date().toISOString();

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`SarkariPulse Informational Guide — ${record.title.en}`);
  pdfDoc.setAuthor("SarkariPulse (Independent Information Platform)");
  pdfDoc.setSubject(
    `Informational recruitment summary for ${record.officialEnglishOrganisation}`
  );
  pdfDoc.setCreator("SarkariPulse PDF Pipeline v1.0");

  const dict = getDictionary(language);
  const resolvedFontBytes =
    input.unicodeFontBytes ??
    (language === "hi" || language === "mr" ? loadBundledDevanagariFont() : null);

  let embeddedUnicodeFont = false;
  let bodyFont: PDFFont;
  let boldFont: PDFFont;

  if (resolvedFontBytes && resolvedFontBytes.byteLength > 0) {
    pdfDoc.registerFontkit(fontkit);
    bodyFont = await pdfDoc.embedFont(resolvedFontBytes, { subset: true });
    boldFont = bodyFont;
    embeddedUnicodeFont = true;
  } else {
    bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  const asciiFallback = !embeddedUnicodeFont;
  const clean = (s: string) => sanitizePdfText(s, asciiFallback);
  const pickLang = (text: { en: string; hi?: string; mr?: string }) =>
    embeddedUnicodeFont ? resolveLocalizedText(text, language).value : text.en;
  const effectiveDateLang: LanguageCode = embeddedUnicodeFont ? language : "en";

  // Blueprint Brand Colours: Navy #123D78, Secondary Blue #2878D0, Accent Orange #F59E0B
  const navy = rgb(0x12 / 255, 0x3d / 255, 0x78 / 255);
  const blue = rgb(0x28 / 255, 0x78 / 255, 0xd0 / 255);
  const orange = rgb(0xf5 / 255, 0x9e / 255, 0x0b / 255);
  const darkText = rgb(0x0f / 255, 0x17 / 255, 0x2a / 255);
  const mutedText = rgb(0x47 / 255, 0x55 / 255, 0x69 / 255);
  const white = rgb(1, 1, 1);

  const pageWidth = 595.28; // A4 portrait
  const pageHeight = 841.89;
  const marginX = 44;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - 104;

  function drawHeaderBanner(targetPage: typeof page) {
    targetPage.drawRectangle({
      x: 0,
      y: pageHeight - 78,
      width: pageWidth,
      height: 78,
      color: navy,
    });
    targetPage.drawRectangle({
      x: 0,
      y: pageHeight - 82,
      width: pageWidth,
      height: 4,
      color: orange,
    });
    targetPage.drawText("SarkariPulse", {
      x: marginX,
      y: pageHeight - 36,
      size: 18,
      font: boldFont,
      color: white,
    });
    targetPage.drawText(
      "SarkariPulse Informational Guide — NOT an official government notification",
      {
        x: marginX,
        y: pageHeight - 58,
        size: 9.5,
        font: bodyFont,
        color: rgb(0.88, 0.94, 1),
      }
    );
  }

  drawHeaderBanner(page);

  function ensureSpace(requiredHeight: number) {
    if (cursorY - requiredHeight < 70) {
      if (pdfDoc.getPageCount() >= MAX_GENERATED_PDF_PAGES) {
        throw new Error(
          `PDF exceeded maximum permitted page limit (${MAX_GENERATED_PDF_PAGES}).`
        );
      }
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      drawHeaderBanner(page);
      cursorY = pageHeight - 104;
    }
  }

  function writeHeading(text: string) {
    ensureSpace(28);
    page.drawText(clean(text), {
      x: marginX,
      y: cursorY,
      size: 12,
      font: boldFont,
      color: navy,
    });
    cursorY -= 6;
    page.drawLine({
      start: { x: marginX, y: cursorY },
      end: { x: pageWidth - marginX, y: cursorY },
      thickness: 1,
      color: blue,
    });
    cursorY -= 14;
  }

  function writeParagraph(text: string, fontSize = 9.5, color = darkText) {
    const lines = wrapLines(clean(text), 86);
    for (const line of lines) {
      ensureSpace(14);
      page.drawText(line, {
        x: marginX,
        y: cursorY,
        size: fontSize,
        font: bodyFont,
        color,
      });
      cursorY -= 13.5;
    }
    cursorY -= 4;
  }

  // Title & Metadata (renders localized Devanagari when embeddedUnicodeFont is active)
  writeHeading(pickLang(record.title));
  writeParagraph(
    `${pickLang(record.organisation)} (${record.officialEnglishOrganisation}) | ${pickLang(record.department)}`
  );
  writeParagraph(
    `${dict.detail.notificationNo}: ${record.notificationReference ?? "N/A"} | Cycle: ${record.cycleLabel} | Type: ${documentType} | v${articleVersion}`
  );
  writeParagraph(
    `${dict.card.vacancies}: ${formatVacancyCount(record.vacancyTotal, effectiveDateLang)} | ${dict.card.lastDate}: ${formatCalendarDate(record.applicationEnd, effectiveDateLang)} | ${dict.detail.lastVerified}: ${formatVerifiedTimestamp(record.lastVerifiedAt, effectiveDateLang)}`,
    9.5,
    navy
  );

  // Important Dates
  writeHeading(embeddedUnicodeFont ? dict.detail.sections.importantDates : "Important Dates");
  for (const d of record.dates) {
    writeParagraph(
      `- ${pickLang(d.label)}: ${formatCalendarDate(d.eventDate, effectiveDateLang, d.eventTimeLabel)}`
    );
  }

  // Post Breakdown
  writeHeading(embeddedUnicodeFont ? dict.detail.sections.postDetails : "Post-Wise Summary");
  for (const post of record.posts) {
    writeParagraph(
      `- ${pickLang(post.postName)} | ${dict.card.vacancies}: ${formatVacancyCount(post.vacancyCount, effectiveDateLang)} | Pay: ${post.payLevel ?? "N/A"} | ${pickLang(post.qualificationSummary)}`
    );
  }

  // Eligibility & Selection
  writeHeading(
    embeddedUnicodeFont
      ? `${dict.detail.sections.ageLimit} & ${dict.detail.sections.selectionProcess}`
      : "Eligibility, Pay & Selection"
  );
  writeParagraph(
    `${dict.detail.sections.ageLimit}: ${record.minAge ?? "N/A"} - ${record.maxAge ?? "N/A"} (Cut-off: ${formatCalendarDate(record.ageCutOffDate, effectiveDateLang)}). ${pickLang(record.ageRelaxationNote)}`
  );
  writeParagraph(
    `${dict.detail.sections.salary}: ${record.paySummary.displayLabel ?? "Not specified"}. ${pickLang(record.paySummary.sourceBasis)}`
  );
  writeParagraph(
    `${dict.detail.sections.selectionProcess}: ${record.selectionStages.map((s) => pickLang(s)).join(" -> ")}`
  );

  // Official Source Links & Canonical Web Page
  const canonicalUrlForQr = resolveCanonicalQrUrl(
    canonicalHost,
    language,
    record.slug
  );
  writeHeading(embeddedUnicodeFont ? dict.detail.sections.officialLinks : "Official Source URLs & Reference");
  for (const link of record.links) {
    if (isSafeHttpUrl(link.url)) {
      writeParagraph(
        `- ${pickLang(link.label)}: ${link.url} (${extractDestinationDomain(link.url) ?? "unknown"})`
      );
    }
  }
  if (canonicalUrlForQr) {
    writeParagraph(`Canonical SarkariPulse Web Page (QR Target): ${canonicalUrlForQr}`, 9, blue);
  }

  // Mandatory Independent Disclaimer
  writeHeading(embeddedUnicodeFont ? dict.detail.sections.disclaimer : "Independent Platform Disclaimer");
  writeParagraph(
    embeddedUnicodeFont
      ? `${dict.legal.footerDisclaimer} ${dict.detail.officialNoticeGoverns}`
      : "This PDF is a SarkariPulse informational guide prepared from verified official recruitment notices. SarkariPulse is NOT a government agency and does not accept applications or fees. The original official notification published by the recruiting authority governs in all respects.",
    9,
    mutedText
  );

  // Page numbers & generation timestamp footer on every page
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;
  const generatedIst = clean(formatVerifiedTimestamp(generatedAt, "en"));

  pages.forEach((p, idx) => {
    p.drawLine({
      start: { x: marginX, y: 42 },
      end: { x: pageWidth - marginX, y: 42 },
      thickness: 0.5,
      color: rgb(0.82, 0.86, 0.92),
    });
    p.drawText(
      `SarkariPulse Informational Guide | Generated: ${generatedIst} | v${articleVersion}`,
      {
        x: marginX,
        y: 28,
        size: 8,
        font: bodyFont,
        color: mutedText,
      }
    );
    p.drawText(`Page ${idx + 1} of ${totalPages}`, {
      x: pageWidth - marginX - 55,
      y: 28,
      size: 8,
      font: boldFont,
      color: navy,
    });
  });

  const pdfBytes = await pdfDoc.save();
  if (pdfBytes.byteLength > MAX_GENERATED_PDF_BYTES) {
    throw new Error("Generated PDF exceeded maximum file size limit.");
  }

  const sigCheck = validateFileSignature(
    pdfBytes,
    "application/pdf",
    MAX_GENERATED_PDF_BYTES
  );
  if (!sigCheck.valid) {
    throw new Error(`Generated PDF failed signature verification: ${sigCheck.reason}`);
  }

  const checksumSha256 = computeSha256Hex(pdfBytes);
  const safeSlug = normalizeSlug(record.slug) || "recruitment";
  const filename = `sarkaripulse-${safeSlug}-${documentType}-${language}-v${articleVersion}.pdf`;
  const storagePath = `guides/${language}/${safeSlug}/${filename}`;

  return {
    pdfBytes,
    checksumSha256,
    fileSizeBytes: pdfBytes.byteLength,
    pageCount: totalPages,
    filename,
    storageBucket: PUBLIC_GUIDES_BUCKET,
    storagePath,
    canonicalUrlForQr,
    generatedAt,
    embeddedUnicodeFont,
  };
}

/**
 * Document Lifecycle helper (Blueprint Ch. 15):
 * Marks superseded SarkariPulse guides when a material recruitment fact changes,
 * while strictly refusing to overwrite or replace an `official_notification` file.
 */
export function buildSupersededGuidePlan(params: {
  previousDocumentId: string;
  previousDocumentType: string;
  newDocumentId: string;
}): { ok: true; update: { id: string; is_superseded: true; superseded_by_id: string } } | { ok: false; error: string } {
  if (params.previousDocumentType === "official_notification") {
    return {
      ok: false,
      error:
        "Cannot replace or overwrite an original official_notification file with a generated summary.",
    };
  }
  return {
    ok: true,
    update: {
      id: params.previousDocumentId,
      is_superseded: true,
      superseded_by_id: params.newDocumentId,
    },
  };
}
