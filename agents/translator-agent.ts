import { z } from "zod";
import { MasterArticleDraft } from "@/agents/writer-agent";
import { GLOSSARY_VERSION } from "@/prompts/glossaries-v1";
import {
  buildTranslationSystemInstruction,
  TRANSLATION_PROMPT_VERSION,
} from "@/prompts/editorial-v1";
import { AiModelProvider } from "@/server/ai/provider";

export const TranslatedArticleSchema = z.object({
  targetLanguage: z.enum(["hi", "mr"]),
  sourceArticleVersion: z.number().int().positive(),
  glossaryVersion: z.string().min(1),
  promptVersion: z.string().min(1),
  modelVersion: z.string().min(1),
  title: z.string().trim().min(5).max(260),
  summary: z.string().trim().min(15).max(700),
  seoTitle: z.string().trim().min(10).max(180),
  seoDescription: z.string().trim().min(20).max(340),
  canonicalPath: z.string().regex(/^\/(hi|mr)\/jobs\//),
  sections: z.array(
    z.object({
      key: z.string().min(1),
      heading: z.string().trim().min(2),
      body: z.string().trim().min(5),
    })
  ),
});

export type TranslatedArticle = z.infer<typeof TranslatedArticleSchema>;

export interface TranslationParityReport {
  passed: boolean;
  missingUrls: string[];
  missingReferences: string[];
  missingCriticalNumbers: string[];
  missingDates: string[];
  disclaimerPresent: boolean;
  issues: string[];
}

const DEVANAGARI_DIGITS: Readonly<Record<string, string>> = {
  "०": "0",
  "१": "1",
  "२": "2",
  "३": "3",
  "४": "4",
  "५": "5",
  "६": "6",
  "७": "7",
  "८": "8",
  "९": "9",
};

/**
 * Normalises Devanagari numerals (०–९) to ASCII digits (0–9) so critical-fact
 * parity checks accept natural Hindi/Marathi numerals while still detecting any altered value!
 */
export function normalizeDevanagariNumerals(input: string): string {
  return input.replace(/[०-९]/g, (ch) => DEVANAGARI_DIGITS[ch] ?? ch);
}

function buildDateVariants(isoDate: string): string[] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return [isoDate];
  const [, yyyy, mm, dd] = m;
  const dNum = String(Number(dd));
  const mNum = String(Number(mm));
  return [
    `${yyyy}-${mm}-${dd}`,
    `${dd}-${mm}-${yyyy}`,
    `${dd}/${mm}/${yyyy}`,
    `${dd}.${mm}.${yyyy}`,
    `${dNum}/${mNum}/${yyyy}`,
    `${dNum}-${mNum}-${yyyy}`,
    // Day + Year co-occurrence check (allows localized month names e.g. "18 दिसंबर 2026" / "१८ डिसेंबर २०२६")
    `${dNum}|${yyyy}`,
  ];
}

function containsDateInNormalizedText(isoDate: string, normalizedText: string): boolean {
  const variants = buildDateVariants(isoDate);
  for (const v of variants) {
    if (v.includes("|")) {
      const [day, year] = v.split("|");
      const rx = new RegExp(`\\b0?${day}\\b[\\s\\S]{0,24}\\b${year}\\b`);
      if (rx.test(normalizedText)) return true;
    } else if (normalizedText.includes(v)) {
      return true;
    }
  }
  return false;
}

/**
 * Critical-Fact Parity Validator (Blueprint Ch. 14 & Ch. 25):
 * Compares the English master against Hindi/Marathi translations to guarantee that
 * official URLs, notification references, vacancy counts, closing dates, and the
 * independent platform disclaimer are preserved accurately before publication.
 */
export function validateTranslationParity(
  master: MasterArticleDraft,
  translation: TranslatedArticle
): TranslationParityReport {
  const combinedRaw = [
    translation.title,
    translation.summary,
    ...translation.sections.map((s) => `${s.heading} ${s.body}`),
  ].join("\n");
  const normalized = normalizeDevanagariNumerals(combinedRaw);
  const compactDigits = normalized.replace(/,/g, "");

  const missingUrls: string[] = [];
  for (const link of master.officialLinks) {
    if (!combinedRaw.includes(link.url)) {
      missingUrls.push(link.url);
    }
  }

  const missingReferences: string[] = [];
  if (
    master.notificationReference &&
    !normalized.toLowerCase().includes(master.notificationReference.toLowerCase())
  ) {
    missingReferences.push(master.notificationReference);
  }

  const missingCriticalNumbers: string[] = [];
  if (master.vacancyTotal !== null) {
    const rawNum = String(master.vacancyTotal);
    const numRegex = new RegExp(`(?<!\\d)${rawNum}(?!\\d)`);
    if (!numRegex.test(compactDigits)) {
      missingCriticalNumbers.push(`vacancyTotal=${rawNum}`);
    }
  }

  const missingDates: string[] = [];
  if (master.applicationEnd) {
    if (!containsDateInNormalizedText(master.applicationEnd, normalized)) {
      missingDates.push(`applicationEnd=${master.applicationEnd}`);
    }
  }

  const disclaimerSection = translation.sections.find(
    (s) => s.key === "disclaimer"
  );
  const disclaimerPresent = Boolean(
    disclaimerSection && disclaimerSection.body.trim().length >= 20
  );

  const issues: string[] = [];
  if (missingUrls.length > 0) {
    issues.push(`Missing or altered official URLs: ${missingUrls.join(", ")}`);
  }
  if (missingReferences.length > 0) {
    issues.push(
      `Missing or altered notification reference: ${missingReferences.join(", ")}`
    );
  }
  if (missingCriticalNumbers.length > 0) {
    issues.push(
      `Critical vacancy/count parity mismatch: ${missingCriticalNumbers.join(", ")}`
    );
  }
  if (missingDates.length > 0) {
    issues.push(`Closing date parity mismatch: ${missingDates.join(", ")}`);
  }
  if (!disclaimerPresent) {
    issues.push("Independent platform disclaimer section missing in translation.");
  }

  return {
    passed: issues.length === 0,
    missingUrls,
    missingReferences,
    missingCriticalNumbers,
    missingDates,
    disclaimerPresent,
    issues,
  };
}

/**
 * Translator Agent (Blueprint Ch. 14 & Appendix C):
 * Invokes replaceable AI provider with controlled glossary, validates schema,
 * and enforces Critical-Fact Parity before allowing publication.
 */
export async function runTranslationAgent(params: {
  master: MasterArticleDraft;
  targetLanguage: "hi" | "mr";
  provider: AiModelProvider;
}): Promise<
  | {
      ok: true;
      translation: TranslatedArticle;
      parity: TranslationParityReport;
      estimatedTokens: number;
    }
  | {
      ok: false;
      errorCode: "PROVIDER_ERROR" | "MALFORMED_JSON" | "SCHEMA_VALIDATION_FAILED";
      message: string;
    }
> {
  const systemInstruction = buildTranslationSystemInstruction(
    params.targetLanguage
  );
  const userPrompt = JSON.stringify({
    targetLanguage: params.targetLanguage,
    sourceArticleVersion: params.master.versionNumber,
    glossaryVersion: GLOSSARY_VERSION,
    promptVersion: TRANSLATION_PROMPT_VERSION,
    master: {
      slug: params.master.slug,
      title: params.master.title,
      summary: params.master.summary,
      seoTitle: params.master.seoTitle,
      seoDescription: params.master.seoDescription,
      sections: params.master.sections,
    },
  });

  let rawText: string;
  let modelVersion: string;
  let estimatedTokens = 0;

  try {
    const res = await params.provider.generateStructuredJson({
      systemInstruction,
      userPrompt,
      modelTier: "fast",
      maxOutputTokens: 3200,
      temperature: 0.1,
    });
    rawText = res.rawText;
    modelVersion = res.modelVersion;
    estimatedTokens = res.estimatedInputTokens + res.estimatedOutputTokens;
  } catch (err) {
    return {
      ok: false,
      errorCode: "PROVIDER_ERROR",
      message: err instanceof Error ? err.message : "Translation provider failed.",
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return {
      ok: false,
      errorCode: "MALFORMED_JSON",
      message: "Translation provider returned non-JSON output.",
    };
  }

  const validated = TranslatedArticleSchema.safeParse({
    ...(typeof parsed === "object" && parsed !== null ? parsed : {}),
    targetLanguage: params.targetLanguage,
    sourceArticleVersion: params.master.versionNumber,
    glossaryVersion: GLOSSARY_VERSION,
    promptVersion: TRANSLATION_PROMPT_VERSION,
    modelVersion,
    canonicalPath: `/${params.targetLanguage}/jobs/${params.master.slug}`,
  });

  if (!validated.success) {
    return {
      ok: false,
      errorCode: "SCHEMA_VALIDATION_FAILED",
      message: validated.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  const parity = validateTranslationParity(params.master, validated.data);
  return {
    ok: true,
    translation: validated.data,
    parity,
    estimatedTokens,
  };
}
