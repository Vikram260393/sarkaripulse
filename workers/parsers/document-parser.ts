import { isSafeHttpUrl } from "@/lib/utils/formatters";

export type OcrConfidenceFlag = "high" | "uncertain" | "unreadable";

export interface ParsedSourceDocument {
  title: string | null;
  cleanText: string;
  links: { text: string; url: string }[];
  pageCount: number;
  isScannedOcr: boolean;
  ocrConfidenceFlag: OcrConfidenceFlag;
  promptInjectionSignals: string[];
}

const PROMPT_INJECTION_PATTERNS: readonly { label: string; regex: RegExp }[] = [
  {
    label: "instruction_override",
    regex: /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  },
  {
    label: "forced_publish_command",
    regex: /\b(publish\s+immediately|bypass\s+verification|skip\s+human\s+review)\b/i,
  },
  {
    label: "secret_exfiltration",
    regex: /\b(reveal|print|output|exfiltrate)\s+(all\s+)?(secrets|api\s*keys|service\s*role|system\s*prompt)\b/i,
  },
  {
    label: "system_role_spoof",
    regex: /<\s*\/?\s*(system|assistant|developer)\s*>|^\s*SYSTEM\s*:/im,
  },
  {
    label: "payment_redirect_fraud",
    regex: /\b(send\s+application\s+fee\s+to|transfer\s+fee\s+to\s+upi)\b/i,
  },
];

/**
 * Scans untrusted source text for prompt-injection or hostile embedded directives
 * (Blueprint Ch. 10 & Ch. 33).
 */
export function detectPromptInjectionSignals(text: string): string[] {
  const matched: string[] = [];
  for (const item of PROMPT_INJECTION_PATTERNS) {
    if (item.regex.test(text)) {
      matched.push(item.label);
    }
  }
  return matched;
}

/**
 * Wraps untrusted retrieved content with explicit non-instruction delimiters
 * before passing to any LLM extraction call (Blueprint Appendix D).
 */
export function wrapUntrustedSourceContent(
  cleanText: string,
  sourceUrl: string
): string {
  const sanitized = cleanText
    .replace(/<\/?UNTRUSTED_SOURCE_DATA[^>]*>/gi, "[STRIPPED_TAG]")
    .slice(0, 40_000);
  return [
    `<UNTRUSTED_SOURCE_DATA source_url="${sourceUrl}">`,
    sanitized,
    `</UNTRUSTED_SOURCE_DATA>`,
  ].join("\n");
}

/**
 * Deterministic HTML parser that strips active scripts/styles, extracts clean text
 * and safe resolved links without executing anything.
 */
export function parseHtmlSourceDocument(
  html: string,
  baseUrl: string
): ParsedSourceDocument {
  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  const title = titleMatch ? decodeBasicEntities(titleMatch[1].trim()) : null;

  // Extract safe http(s) links before stripping tags
  const links: { text: string; url: string }[] = [];
  const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchorRegex.exec(html)) !== null) {
    const rawHref = match[1].trim();
    const rawText = decodeBasicEntities(
      match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    );
    try {
      const resolved = new URL(rawHref, baseUrl).toString();
      if (isSafeHttpUrl(resolved)) {
        links.push({ text: rawText || resolved, url: resolved });
      }
    } catch {
      // Skip malformed href
    }
  }

  // Strip scripts, styles, comments, and tags
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ");

  const cleanText = decodeBasicEntities(stripped).replace(/\s+/g, " ").trim();
  const promptInjectionSignals = detectPromptInjectionSignals(cleanText);

  return {
    title,
    cleanText,
    links,
    pageCount: 1,
    isScannedOcr: false,
    ocrConfidenceFlag: "high",
    promptInjectionSignals,
  };
}

/**
 * Evaluates extracted PDF page text to detect scanned / low-quality OCR documents
 * (Blueprint Ch. 10: "Never treat OCR output as definitive when the page image is unclear.
 * Flag low-quality scans for review.").
 */
export function evaluatePdfTextQuality(
  pages: readonly string[],
  wasOcrUsed: boolean
): ParsedSourceDocument {
  const cleanPages = pages.map((p) => p.replace(/\s+/g, " ").trim());
  const cleanText = cleanPages
    .map((text, idx) => `[Page ${idx + 1}] ${text}`)
    .join("\n")
    .trim();

  const totalChars = cleanPages.reduce((sum, p) => sum + p.length, 0);
  const avgCharsPerPage = pages.length > 0 ? totalChars / pages.length : 0;

  // Count replacement / garbled symbols
  const garbledMatches = cleanText.match(/[\uFFFD□]{1}|[^\p{L}\p{N}\p{P}\p{Z}\n]/gu);
  const garbledRatio =
    cleanText.length > 0 ? (garbledMatches?.length ?? 0) / cleanText.length : 1;

  let ocrConfidenceFlag: OcrConfidenceFlag = "high";
  let isScannedOcr = wasOcrUsed;

  if (totalChars < 40 || avgCharsPerPage < 25) {
    isScannedOcr = true;
    ocrConfidenceFlag = "unreadable";
  } else if (wasOcrUsed && garbledRatio > 0.08) {
    ocrConfidenceFlag = "uncertain";
  } else if (wasOcrUsed) {
    // Even reasonably readable OCR stays flagged for verification awareness when noisy
    ocrConfidenceFlag = garbledRatio > 0.03 ? "uncertain" : "high";
  }

  return {
    title: null,
    cleanText,
    links: [],
    pageCount: pages.length,
    isScannedOcr,
    ocrConfidenceFlag,
    promptInjectionSignals: detectPromptInjectionSignals(cleanText),
  };
}

function decodeBasicEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
